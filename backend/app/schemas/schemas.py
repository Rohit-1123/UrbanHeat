from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class HeatPredictionInput(BaseModel):
    temperature: float = Field(..., description="Temperature in Celsius (e.g. 35.0)", ge=10.0, le=55.0)
    humidity: float = Field(..., description="Relative humidity in percentage (e.g. 65.0)", ge=0.0, le=100.0)
    uv_index: float = Field(..., description="UV Index (e.g. 8.0)", ge=0.0, le=15.0)
    vegetation_index: float = Field(..., description="NDVI vegetation index (0.0 to 1.0)", ge=0.0, le=1.0)
    building_density: float = Field(..., description="Building density ratio (0.0 to 1.0)", ge=0.0, le=1.0)
    shade_score: float = Field(..., description="Canopy/Structure shade score (0.0 to 1.0)", ge=0.0, le=1.0)

class HeatPredictionOutput(BaseModel):
    predicted_heat_risk: float
    risk_level: str
    breakdown: Optional[Dict[str, float]] = None

class HeatPointResponse(BaseModel):
    id: Optional[int] = None
    latitude: float
    longitude: float
    temperature: float
    humidity: float
    uv_index: float
    vegetation_index: float
    building_density: float
    shade_score: float
    heat_risk: float
    risk_level: str
    timestamp: str

class RouteRequest(BaseModel):
    start_lat: float = Field(..., description="Start point latitude", ge=-90.0, le=90.0)
    start_lon: float = Field(..., description="Start point longitude", ge=-180.0, le=180.0)
    end_lat: float = Field(..., description="Destination latitude", ge=-90.0, le=90.0)
    end_lon: float = Field(..., description="Destination longitude", ge=-180.0, le=180.0)

class RoutePointHeat(BaseModel):
    lat: float
    lon: float
    distance_km: float
    heat_risk: float
    risk_level: str
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    uv_index: Optional[float] = None
    vegetation_index: Optional[float] = None
    building_density: Optional[float] = None
    shade_score: Optional[float] = None

class RouteHeatDetailRequest(BaseModel):
    coordinates: List[List[float]] = Field(..., description="List of [latitude, longitude] pairs")

class RouteAnalysis(BaseModel):
    route_name: str
    route_type: str  # "coolest", "balanced", "fastest"
    distance_km: float
    duration_minutes: float
    average_heat_risk: float
    maximum_heat_risk: float
    heat_risk_level: str
    shaded_area_percentage: int
    heat_profile: List[Dict[str, Any]]  # List of {position: int, score: float}
    final_score: float
    geometry: List[List[float]]  # List of [lat, lon]
    sampled_points: List[RoutePointHeat]
    turn_by_turn: List[Dict[str, Any]] = Field(default_factory=list)

class RouteRecommendationResponse(BaseModel):
    coolest_route: RouteAnalysis
    balanced_route: RouteAnalysis
    fastest_route: RouteAnalysis
    recommended_route: str  # "coolest_route", "balanced_route", or "fastest_route"
    comparison: Dict[str, Any]

class LocationDetailRequest(BaseModel):
    lat: float
    lon: float
    location_name: Optional[str] = "Selected Area"

class ForecastHour(BaseModel):
    time: str
    temp: int
    heat_risk: int
    risk_level: str

class LocationDetailResponse(BaseModel):
    location_name: str
    heat_risk_score: int
    risk_level: str
    temperature: float
    humidity: float
    uv_index_label: str
    vegetation_cover: str
    building_density: str
    surface_type: str
    warning_message: str
    forecast: List[ForecastHour]
    recommendations: List[Dict[str, str]]
