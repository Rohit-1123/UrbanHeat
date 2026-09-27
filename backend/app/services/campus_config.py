"""SRM Kattankulathur campus routing configuration."""

SRM_CAMPUS_BOUNDS = {
    "min_lat": 12.8188,
    "max_lat": 12.8280,
    "min_lon": 80.0372,
    "max_lon": 80.0516,
}

# Real OSRM footpath geometry near the campus edge can dip a short distance
# outside the hand-drawn box above (verified up to ~55m south of min_lat on
# the routed-foot service). Pad the bounds so genuine on-campus routes are not
# rejected just because a mapped path hugs the boundary.
_BOUNDS_MARGIN_DEG = 0.0008  # ~90m at this latitude

def is_within_srm_campus(lat: float, lon: float) -> bool:
    return (
        SRM_CAMPUS_BOUNDS["min_lat"] - _BOUNDS_MARGIN_DEG <= lat <= SRM_CAMPUS_BOUNDS["max_lat"] + _BOUNDS_MARGIN_DEG
        and SRM_CAMPUS_BOUNDS["min_lon"] - _BOUNDS_MARGIN_DEG <= lon <= SRM_CAMPUS_BOUNDS["max_lon"] + _BOUNDS_MARGIN_DEG
    )


def route_geometry_is_within_srm_campus(coords: list[list[float]]) -> bool:
    return bool(coords) and all(is_within_srm_campus(lat, lon) for lat, lon in coords)
