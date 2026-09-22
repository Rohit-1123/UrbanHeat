"""SRM Kattankulathur campus routing configuration."""

SRM_CAMPUS_BOUNDS = {
    "min_lat": 12.8188,
    "max_lat": 12.8280,
    "min_lon": 80.0372,
    "max_lon": 80.0516,
}


def is_within_srm_campus(lat: float, lon: float) -> bool:
    return (
        SRM_CAMPUS_BOUNDS["min_lat"] <= lat <= SRM_CAMPUS_BOUNDS["max_lat"]
        and SRM_CAMPUS_BOUNDS["min_lon"] <= lon <= SRM_CAMPUS_BOUNDS["max_lon"]
    )


def route_geometry_is_within_srm_campus(coords: list[list[float]]) -> bool:
    return bool(coords) and all(is_within_srm_campus(lat, lon) for lat, lon in coords)
