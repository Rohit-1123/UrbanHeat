import math
import numpy as np
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.database.models import HeatData
from app.services.ml_service import ml_service

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance between two coordinates in kilometers."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class HeatService:
    @staticmethod
    def get_all_heatmap_points(
        db: Session,
        min_lat: Optional[float] = None,
        max_lat: Optional[float] = None,
        min_lon: Optional[float] = None,
        max_lon: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(HeatData)
        if min_lat is not None and max_lat is not None:
            query = query.filter(HeatData.latitude >= min_lat, HeatData.latitude <= max_lat)
        if min_lon is not None and max_lon is not None:
            query = query.filter(HeatData.longitude >= min_lon, HeatData.longitude <= max_lon)
        
        points = query.all()
        return [p.to_dict() for p in points]

    @staticmethod
    def find_nearest_db_heat_point(db: Session, lat: float, lon: float, max_dist_km: float = 2.0) -> Optional[HeatData]:
        # Perform spatial bounding box filter first
        lat_delta = max_dist_km / 111.0
        lon_delta = max_dist_km / (111.0 * math.cos(math.radians(lat)))

        candidates = db.query(HeatData).filter(
            HeatData.latitude >= lat - lat_delta,
            HeatData.latitude <= lat + lat_delta,
            HeatData.longitude >= lon - lon_delta,
            HeatData.longitude <= lon + lon_delta
        ).all()

        if not candidates:
            return None

        best_point = None
        min_dist = float("inf")

        for p in candidates:
            dist = haversine_distance(lat, lon, p.latitude, p.longitude)
            if dist < min_dist and dist <= max_dist_km:
                min_dist = dist
                best_point = p

        return best_point

    @staticmethod
    def evaluate_coordinate_heat_risk(db: Session, lat: float, lon: float) -> Tuple[float, str, Dict[str, float]]:
        """
        Evaluates heat risk at any coordinate.
        Queries database first; if absent, interpolates environmental features and uses ML prediction model.
        """
        nearest_db = HeatService.find_nearest_db_heat_point(db, lat, lon, max_dist_km=1.5)

        if nearest_db:
            env_data = {
                "temperature": nearest_db.temperature,
                "humidity": nearest_db.humidity,
                "uv_index": nearest_db.uv_index,
                "vegetation_index": nearest_db.vegetation_index,
                "building_density": nearest_db.building_density,
                "shade_score": nearest_db.shade_score
            }
            return nearest_db.heat_risk, nearest_db.risk_level, env_data

        # Fallback spatial interpolation for coordinates outside database grid
        dist_from_urban = math.sqrt((lat - 12.823)**2 + (lon - 80.045)**2)
        dist_from_green = math.sqrt((lat - 12.815)**2 + (lon - 80.030)**2)

        building_density = float(np.clip(0.85 - dist_from_urban * 8.0, 0.1, 0.95))
        vegetation_index = float(np.clip(0.80 - dist_from_green * 7.0, 0.05, 0.90))
        shade_score = float(np.clip(vegetation_index * 0.7, 0.05, 0.85))

        temperature = float(round(33.0 + building_density * 5.5 - vegetation_index * 3.0, 1))
        humidity = 60.0
        uv_index = float(round(7.5 + building_density * 1.5 - shade_score * 1.0, 1))

        risk_score, risk_level = ml_service.predict(
            temperature, humidity, uv_index, vegetation_index, building_density, shade_score
        )

        env_data = {
            "temperature": temperature,
            "humidity": humidity,
            "uv_index": uv_index,
            "vegetation_index": vegetation_index,
            "building_density": building_density,
            "shade_score": shade_score
        }

        return risk_score, risk_level, env_data

heat_service = HeatService()
