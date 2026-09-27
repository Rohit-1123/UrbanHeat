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

    @staticmethod
    def compute_hourly_trend(db: Session, lat: float, lon: float) -> List[Dict[str, Any]]:
        """
        Derives a real, model-driven diurnal heat trend for a location by feeding the
        trained ML model a typical Chennai temperature/UV diurnal curve while holding
        that location's real vegetation/building/shade factors constant. This replaces
        a static mocked trend with an actual per-location prediction curve.
        """
        _, _, env = HeatService.evaluate_coordinate_heat_risk(db, lat, lon)
        base_temp = env["temperature"]
        vegetation_index = env["vegetation_index"]
        building_density = env["building_density"]
        shade_score = env["shade_score"]

        # (hour label, temp offset from base, uv index for that hour)
        diurnal_curve = [
            ("6 AM", -7.0, 2.0),
            ("9 AM", -3.0, 6.0),
            ("12 PM", 1.5, 9.5),
            ("3 PM", 2.5, 8.5),
            ("6 PM", -1.0, 3.5),
            ("9 PM", -4.5, 0.0),
        ]

        points = []
        for hour_label, temp_offset, uv in diurnal_curve:
            hour_temp = round(base_temp + temp_offset, 1)
            humidity = env["humidity"]
            risk_score, risk_level = ml_service.predict(
                hour_temp, humidity, uv, vegetation_index, building_density, shade_score
            )
            points.append({
                "hour": hour_label,
                "temperature": hour_temp,
                "heat_risk": round(risk_score, 1),
                "risk_level": risk_level
            })

        return points

    @staticmethod
    def build_recommendations(db: Session, lat: float, lon: float) -> Tuple[float, str, List[Dict[str, str]]]:
        """
        Ranks mitigation actions using the location's real environmental factors instead
        of a static recommendation list, so advice actually reflects what is driving risk
        at that specific coordinate (low canopy, high building density, low shade, etc).
        """
        risk_score, risk_level, env = HeatService.evaluate_coordinate_heat_risk(db, lat, lon)

        candidates = []

        if env["vegetation_index"] < 0.35:
            candidates.append({
                "title": "Seek Tree Canopy",
                "description": f"This area has low vegetation cover ({int(env['vegetation_index'] * 100)}%). Prefer routes through parks or tree-lined paths where possible.",
                "icon": "tree",
                "priority": "high",
                "reason": "low_vegetation"
            })
        if env["building_density"] > 0.6:
            candidates.append({
                "title": "Avoid Peak Concrete Exposure",
                "description": f"Building/pavement density here is high ({int(env['building_density'] * 100)}%), which traps and re-radiates heat. Avoid lingering outdoors between 12-3 PM.",
                "icon": "building",
                "priority": "high",
                "reason": "high_building_density"
            })
        if env["shade_score"] < 0.3:
            candidates.append({
                "title": "Use Shaded Walkways",
                "description": f"Shade coverage is limited ({int(env['shade_score'] * 100)}%). Carry an umbrella or wear a wide-brimmed hat if crossing this zone.",
                "icon": "umbrella",
                "priority": "medium",
                "reason": "low_shade"
            })
        if env["uv_index"] >= 8:
            candidates.append({
                "title": "Apply Sun Protection",
                "description": f"UV index is elevated ({env['uv_index']}). Apply sunscreen (SPF 30+) and wear sunglasses if outdoors for extended periods.",
                "icon": "sun",
                "priority": "medium",
                "reason": "high_uv"
            })

        candidates.append({
            "title": "Stay Hydrated",
            "description": "Carry water and drink regularly, especially if this location's predicted heat risk is Moderate or higher.",
            "icon": "water",
            "priority": "low",
            "reason": "general"
        })
        candidates.append({
            "title": "Travel Smart",
            "description": "Plan intensive outdoor activity for early morning or evening hours to avoid this location's peak thermal exposure window.",
            "icon": "clock",
            "priority": "low",
            "reason": "general"
        })

        priority_order = {"high": 0, "medium": 1, "low": 2}
        candidates.sort(key=lambda c: priority_order[c["priority"]])

        return risk_score, risk_level, candidates

heat_service = HeatService()
