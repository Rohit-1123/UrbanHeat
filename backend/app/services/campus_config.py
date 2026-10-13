"""Service-area bounds: all of Tamil Nadu (includes Chennai metro).

Names keep the old `srm_campus` spelling so existing imports keep working.
"""

SRM_CAMPUS_BOUNDS = {
    "min_lat": 7.9,
    "max_lat": 13.7,
    "min_lon": 76.1,
    "max_lon": 80.5,
}

def is_within_srm_campus(lat: float, lon: float) -> bool:
    b = SRM_CAMPUS_BOUNDS
    return b["min_lat"] <= lat <= b["max_lat"] and b["min_lon"] <= lon <= b["max_lon"]


def route_geometry_is_within_srm_campus(coords: list[list[float]]) -> bool:
    return bool(coords) and all(is_within_srm_campus(lat, lon) for lat, lon in coords)
