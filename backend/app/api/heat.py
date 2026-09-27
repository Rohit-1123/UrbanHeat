from fastapi import APIRouter, Depends, Query, HTTPException
import requests
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.schemas.schemas import (
    HeatPredictionInput, HeatPredictionOutput, HeatPointResponse,
    LocationDetailRequest, LocationDetailResponse,
    HeatTrendResponse, RecommendationsResponse
)
from app.services.ml_service import ml_service
from app.services.heat_service import heat_service
from app.services.campus_config import SRM_CAMPUS_BOUNDS, is_within_srm_campus

router = APIRouter(prefix="/api", tags=["Heat Analysis"])

@router.get("/location-search")
def search_campus_locations(
    q: str = Query(..., min_length=2, max_length=80),
):
    """Search mapped SRM campus places through Nominatim, never the wider city."""
    bounds = SRM_CAMPUS_BOUNDS
    viewbox = f"{bounds['min_lon']},{bounds['max_lat']},{bounds['max_lon']},{bounds['min_lat']}"
    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": q,
                "format": "jsonv2",
                "addressdetails": 1,
                "limit": 8,
                "bounded": 1,
                "viewbox": viewbox,
            },
            headers={"User-Agent": "UrbanHeat-SRM-Campus/1.0"},
            timeout=8,
        )
        response.raise_for_status()
        results = []
        for item in response.json():
            lat = float(item["lat"])
            lon = float(item["lon"])
            if is_within_srm_campus(lat, lon):
                results.append({
                    "id": f"osm-{item.get('osm_type', 'place')}-{item.get('osm_id', item.get('place_id'))}",
                    "name": item.get("display_name", "SRM campus location").split(",")[0],
                    "display_name": item.get("display_name", "SRM campus location"),
                    "lat": lat,
                    "lon": lon,
                    "source": "OpenStreetMap",
                })
        return results
    except requests.RequestException as exc:
        raise HTTPException(status_code=503, detail=f"Campus location search is temporarily unavailable: {exc}")

@router.post("/predict-heat", response_model=HeatPredictionOutput)
def predict_heat(data: HeatPredictionInput):
    """
    Predicts Heat Risk Score (0-100) and Risk Level based on environmental parameters.
    """
    try:
        score, risk_level = ml_service.predict(
            temperature=data.temperature,
            humidity=data.humidity,
            uv_index=data.uv_index,
            vegetation_index=data.vegetation_index,
            building_density=data.building_density,
            shade_score=data.shade_score
        )
        
        breakdown = {
            "temperature_factor": round((data.temperature - 25.0) / 20.0 * 35.0, 1),
            "humidity_factor": round((data.humidity - 30.0) / 60.0 * 15.0, 1),
            "uv_factor": round((data.uv_index / 12.0) * 20.0, 1),
            "building_density_factor": round(data.building_density * 30.0, 1),
            "vegetation_mitigation": round(data.vegetation_index * 25.0, 1),
            "shade_mitigation": round(data.shade_score * 25.0, 1)
        }

        return HeatPredictionOutput(
            predicted_heat_risk=round(score, 1),
            risk_level=risk_level,
            breakdown=breakdown
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing heat risk prediction: {str(e)}")

@router.get("/heatmap", response_model=List[HeatPointResponse])
def get_heatmap_data(
    min_lat: Optional[float] = Query(None, description="Minimum latitude for bounding box"),
    max_lat: Optional[float] = Query(None, description="Maximum latitude for bounding box"),
    min_lon: Optional[float] = Query(None, description="Minimum longitude for bounding box"),
    max_lon: Optional[float] = Query(None, description="Maximum longitude for bounding box"),
    db: Session = Depends(get_db)
):
    """
    Returns geographical heat dataset points for interactive heatmap overlays.
    """
    bounds = SRM_CAMPUS_BOUNDS
    min_lat = bounds["min_lat"] if min_lat is None else max(min_lat, bounds["min_lat"])
    max_lat = bounds["max_lat"] if max_lat is None else min(max_lat, bounds["max_lat"])
    min_lon = bounds["min_lon"] if min_lon is None else max(min_lon, bounds["min_lon"])
    max_lon = bounds["max_lon"] if max_lon is None else min(max_lon, bounds["max_lon"])

    try:
        points = heat_service.get_all_heatmap_points(db, min_lat, max_lat, min_lon, max_lon)
        return points
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving heatmap data: {str(e)}")

@router.post("/location-heat-detail", response_model=LocationDetailResponse)
def get_location_heat_detail(data: LocationDetailRequest, db: Session = Depends(get_db)):
    """
    Provides detailed microclimate metrics, gauge score, hourly forecast, and health advisories for any location.
    """
    if not is_within_srm_campus(data.lat, data.lon):
        raise HTTPException(status_code=400, detail="Heat analysis is limited to the SRM Kattankulathur campus area.")

    try:
        score, risk_level, env = heat_service.evaluate_coordinate_heat_risk(db, data.lat, data.lon)
        score_int = int(round(score))

        forecast = [
            {"time": "Now", "temp": int(round(env["temperature"])), "heat_risk": score_int, "risk_level": risk_level},
            {"time": "1 PM", "temp": int(round(env["temperature"] + 2)), "heat_risk": min(100, score_int + 4), "risk_level": "Very High" if score_int + 4 >= 76 else "High"},
            {"time": "4 PM", "temp": int(round(env["temperature"] - 1)), "heat_risk": max(10, score_int - 13), "risk_level": "High" if score_int - 13 >= 51 else "Moderate"},
            {"time": "7 PM", "temp": int(round(env["temperature"] - 4)), "heat_risk": max(10, score_int - 30), "risk_level": "Moderate"},
            {"time": "10 PM", "temp": int(round(env["temperature"] - 6)), "heat_risk": max(10, score_int - 46), "risk_level": "Low"},
            {"time": "1 AM", "temp": int(round(env["temperature"] - 8)), "heat_risk": max(10, score_int - 54), "risk_level": "Low"}
        ]

        recommendations = [
            {"title": "Find Shade", "description": "Choose routes with more trees and canopy coverage.", "icon": "tree"},
            {"title": "Stay Hydrated", "description": "Carry a water bottle and drink regularly.", "icon": "water"},
            {"title": "Travel Smart", "description": "Plan intense outdoor travel during early morning or evening hours.", "icon": "clock"}
        ]

        warning = "High heat stress possible. Stay hydrated and avoid prolonged direct sun exposure." if score_int >= 50 else "Heat conditions are manageable. Maintain normal hydration."

        return LocationDetailResponse(
            location_name=data.location_name or "SRM City Center",
            heat_risk_score=score_int,
            risk_level="Very High Heat Risk" if score_int >= 76 else (risk_level + " Heat Risk"),
            temperature=round(env["temperature"], 1),
            humidity=round(env["humidity"], 1),
            uv_index_label="Extreme (9.5)" if env["uv_index"] > 8 else ("High (" + str(round(env["uv_index"], 1)) + ")"),
            vegetation_cover=f"{int(env['vegetation_index'] * 100)}%",
            building_density="High (Dense Urban)" if env["building_density"] > 0.6 else "Moderate",
            surface_type="Concrete / Asphalt Pavement",
            warning_message=warning,
            forecast=forecast,
            recommendations=recommendations
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating location heat detail: {str(e)}")

@router.get("/heat-trend", response_model=HeatTrendResponse)
def get_heat_trend(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    location_name: Optional[str] = Query("Selected Area"),
    db: Session = Depends(get_db)
):
    """
    Returns a real, model-driven diurnal heat-risk trend for a coordinate by running
    the trained ML model across a typical daily temperature/UV curve, instead of a
    static mocked chart.
    """
    if not is_within_srm_campus(lat, lon):
        raise HTTPException(status_code=400, detail="Heat trend analysis is limited to the SRM Kattankulathur campus area.")

    try:
        points = heat_service.compute_hourly_trend(db, lat, lon)
        peak = max(points, key=lambda p: p["heat_risk"])
        return HeatTrendResponse(
            location_name=location_name or "Selected Area",
            peak_hour=peak["hour"],
            peak_heat_risk=peak["heat_risk"],
            points=points
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing heat trend: {str(e)}")

@router.get("/recommendations", response_model=RecommendationsResponse)
def get_recommendations(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    location_name: Optional[str] = Query("Selected Area"),
    db: Session = Depends(get_db)
):
    """
    Returns mitigation recommendations ranked by that specific coordinate's real
    environmental risk factors, instead of a static recommendation list.
    """
    if not is_within_srm_campus(lat, lon):
        raise HTTPException(status_code=400, detail="Recommendations are limited to the SRM Kattankulathur campus area.")

    try:
        score, risk_level, recommendations = heat_service.build_recommendations(db, lat, lon)
        return RecommendationsResponse(
            location_name=location_name or "Selected Area",
            heat_risk_score=round(score, 1),
            risk_level=risk_level,
            recommendations=recommendations
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")
