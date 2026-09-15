from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.schemas.schemas import (
    HeatPredictionInput, HeatPredictionOutput, HeatPointResponse,
    LocationDetailRequest, LocationDetailResponse
)
from app.services.ml_service import ml_service
from app.services.heat_service import heat_service

router = APIRouter(prefix="/api", tags=["Heat Analysis"])

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
