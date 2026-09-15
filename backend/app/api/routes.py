from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.schemas import RouteRequest, RouteRecommendationResponse, RouteHeatDetailRequest
from app.services.route_service import route_service

router = APIRouter(prefix="/api", tags=["Routing"])

@router.post("/recommend-route", response_model=RouteRecommendationResponse)
def recommend_route(data: RouteRequest, db: Session = Depends(get_db)):
    """
    Calculates and compares Fastest vs. Coolest routes based on distance, duration, and predicted heat exposure.
    """
    # Validation: start and end coordinates cannot be identical
    if abs(data.start_lat - data.end_lat) < 1e-6 and abs(data.start_lon - data.end_lon) < 1e-6:
        raise HTTPException(
            status_code=400,
            detail="Start location and destination cannot be identical. Please select distinct locations."
        )

    try:
        recommendation = route_service.process_and_recommend_routes(
            db, data.start_lat, data.start_lon, data.end_lat, data.end_lon
        )
        return recommendation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate route recommendations: {str(e)}")

@router.post("/route-heat")
def analyze_route_heat_detail(data: RouteHeatDetailRequest, db: Session = Depends(get_db)):
    """
    Provides detailed point-by-point heat exposure analysis for any custom geometry path.
    """
    if not data.coordinates or len(data.coordinates) < 2:
        raise HTTPException(status_code=400, detail="At least two coordinate points are required.")

    try:
        analysis = route_service.analyze_route_heat(
            db, data.coordinates, "Custom Route Path", distance_km=0.0, duration_min=0.0
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze route heat: {str(e)}")
