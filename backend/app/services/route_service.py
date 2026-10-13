"""Heat-aware walking routes across Chennai metro / Tamil Nadu.

The public OSRM foot service proposes up to 3 alternative walking routes; each
is scored with the seeded heat data along its geometry. Fastest = shortest,
coolest = lowest average heat, balanced = best blended score. When OSRM only
returns one sensible path, the three options honestly come back identical.
"""
import math
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from typing import Any, Dict, List, Optional

import numpy as np
import requests
from sqlalchemy.orm import Session

from app.services.heat_service import heat_service, haversine_distance

OSRM_URL = "https://routing.openstreetmap.de/routed-foot/route/v1/foot"
WALKING_SPEED_M_PER_MIN = 80.0  # ~4.8 km/h
MAX_SNAP_M = 500.0
MAX_STRAIGHT_KM = 50.0
MAX_SAMPLES = 24
MAX_DETOUR = 1.2  # a cooler route may be at most 20% longer than the shortest


@lru_cache(maxsize=128)
def _osrm_routes(start_lat: float, start_lon: float, end_lat: float, end_lon: float, via: Optional[tuple] = None):
    """Alternatives as [(coords[[lat,lon]], steps[(name, meters)])] plus snap distances."""
    resp = requests.get(
        f"{OSRM_URL}/{start_lon},{start_lat};" + (f"{via[1]},{via[0]};" if via else "") + f"{end_lon},{end_lat}",
        params={"alternatives": "false" if via else "3", "overview": "full", "geometries": "geojson", "steps": "true"},
        headers={"User-Agent": "UrbanHeat-TN/1.0"},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get("code") != "Ok" or not data.get("routes"):
        raise ValueError("No walking route was found between these two points.")
    routes = [
        ([[lat, lon] for lon, lat in r["geometry"]["coordinates"]],
         [(st.get("name") or "footpath", st["distance"]) for leg in r["legs"] for st in leg["steps"] if st["distance"] > 0])
        for r in data["routes"]
    ]
    snaps = tuple(w.get("distance", 0.0) for w in data["waypoints"])
    return routes, snaps


def _directions(segments: List[tuple]) -> List[Dict[str, str]]:
    """Group consecutive edges on the same way into one instruction."""
    steps: List[List] = []
    for label, length in segments:
        if steps and steps[-1][0] == label:
            steps[-1][1] += length
        else:
            steps.append([label, length])
    out = [
        {"instruction": f"{'Head along' if i == 0 else 'Continue onto'} {label}", "distance": f"{length:.0f}m"}
        for i, (label, length) in enumerate(steps)
    ]
    out.append({"instruction": "Arrive at your destination", "distance": ""})
    return out


class RouteService:
    @staticmethod
    def sample_points_along_route(coords: List[List[float]], max_samples: int = 16) -> List[List[float]]:
        if len(coords) <= max_samples:
            return coords
        indices = np.linspace(0, len(coords) - 1, max_samples, dtype=int)
        return [coords[idx] for idx in indices]

    @staticmethod
    def analyze_route_heat(
        db: Session,
        coords: List[List[float]],
        route_name: str,
        route_type: str,
        distance_km: float,
        duration_min: float,
        turn_by_turn: Optional[List[Dict[str, str]]] = None,
        max_samples: int = 16,
    ) -> Dict[str, Any]:
        sampled = RouteService.sample_points_along_route(coords, max_samples=max_samples)

        sampled_heat_points = []
        heat_scores = []
        cum_dist = 0.0
        for i, (lat, lon) in enumerate(sampled):
            if i > 0:
                cum_dist += haversine_distance(sampled[i - 1][0], sampled[i - 1][1], lat, lon)
            risk_score, risk_level, env_data = heat_service.evaluate_coordinate_heat_risk(db, lat, lon)
            heat_scores.append(risk_score)
            sampled_heat_points.append({
                "lat": lat,
                "lon": lon,
                "distance_km": round(cum_dist, 2),
                "heat_risk": round(risk_score, 1),
                "risk_level": risk_level,
                **{k: env_data.get(k) for k in ("temperature", "humidity", "uv_index", "vegetation_index", "building_density", "shade_score")},
            })

        avg_heat_risk = round(float(np.mean(heat_scores)), 1)
        heat_risk_level = (
            "Extreme" if avg_heat_risk > 75 else "High" if avg_heat_risk > 50 else "Moderate" if avg_heat_risk > 25 else "Low"
        )
        shade_scores = [p["shade_score"] for p in sampled_heat_points if p["shade_score"] is not None]
        last = max(len(heat_scores) - 1, 1)

        return {
            "route_name": route_name,
            "route_type": route_type,
            "distance_km": round(distance_km, 2),
            "duration_minutes": round(duration_min, 1),
            "average_heat_risk": avg_heat_risk,
            "maximum_heat_risk": round(float(np.max(heat_scores)), 1),
            "heat_risk_level": heat_risk_level,
            "shaded_area_percentage": round(float(np.mean(shade_scores)) * 100) if shade_scores else 0,
            "heat_profile": [{"position": int(i / last * 100), "score": round(s, 1)} for i, s in enumerate(heat_scores)],
            "geometry": coords,
            "sampled_points": sampled_heat_points,
            "turn_by_turn": turn_by_turn or [],
        }

    @staticmethod
    def process_and_recommend_routes(db: Session, start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> Dict[str, Any]:
        if haversine_distance(start_lat, start_lon, end_lat, end_lon) > MAX_STRAIGHT_KM:
            raise ValueError(f"Walking routes are limited to {MAX_STRAIGHT_KM:.0f} km between the two points. Pick places closer together.")
        # Rounded to ~1 m so repeat requests hit the cache.
        start_lat, start_lon, end_lat, end_lon = (round(v, 5) for v in (start_lat, start_lon, end_lat, end_lon))
        # OSRM often returns a single path, so also try detours through a point
        # pushed sideways of the midpoint (both sides) to give the heat search real choices.
        # ponytail: 2 fixed detours; add more offsets if choice matters.
        cos_lat = math.cos(math.radians((start_lat + end_lat) / 2))
        dlat, dlon = end_lat - start_lat, (end_lon - start_lon) * cos_lat
        vias = [None] + [
            (round((start_lat + end_lat) / 2 - side * 0.2 * dlon, 5),
             round((start_lon + end_lon) / 2 + side * 0.2 * dlat / cos_lat, 5))
            for side in (1, -1)
        ]

        def fetch(via):
            try:
                return _osrm_routes(start_lat, start_lon, end_lat, end_lon, via)
            except (ValueError, requests.RequestException):
                if via is None:
                    raise
                return [], ()

        with ThreadPoolExecutor(max_workers=3) as pool:
            results = list(pool.map(fetch, vias))
        osrm, snaps = results[0]
        shortest_m = min(sum(l for _, l in steps) for _, steps in osrm)
        for extra, _ in results[1:]:
            osrm = osrm + [r for r in extra if sum(l for _, l in r[1]) <= MAX_DETOUR * shortest_m]
        start_snap, end_snap = snaps[0], snaps[-1]
        if max(start_snap, end_snap) > MAX_SNAP_M:
            raise ValueError("No walkable path runs near one of these pins. Move it closer to a road or footpath.")

        analysed = []
        for coords, steps in osrm:
            meters = sum(length for _, length in steps)
            route = RouteService.analyze_route_heat(
                db, coords, "", "", meters / 1000.0, meters / WALKING_SPEED_M_PER_MIN, _directions(steps),
                max_samples=MAX_SAMPLES,
            )
            # One heat value per geometry segment, taken from the nearest sampled point.
            n_seg = len(coords) - 1
            scores = [p["score"] for p in route["heat_profile"]]
            route["heat_segments"] = [
                {"coords": [coords[i], coords[i + 1]],
                 "heat_risk": scores[round(i / max(n_seg - 1, 1) * (len(scores) - 1))]}
                for i in range(n_seg)
            ]
            analysed.append(route)

        picks = {
            "fastest": min(analysed, key=lambda r: r["distance_km"]),
            "coolest": min(analysed, key=lambda r: r["average_heat_risk"]),
        }
        picks["balanced"] = min(
            analysed, key=lambda r: r["average_heat_risk"] / 100.0 + r["distance_km"] / (picks["fastest"]["distance_km"] or 1.0) * 0.5
        )
        routes: Dict[str, Dict[str, Any]] = {}
        for route_type, r in picks.items():
            routes[route_type] = {**r, "route_name": f"{route_type.title()} Route", "route_type": route_type}

        max_dist = max(r["distance_km"] for r in routes.values()) or 1.0
        max_dur = max(r["duration_minutes"] for r in routes.values()) or 1.0
        for r in routes.values():
            r["final_score"] = round(
                0.5 * r["average_heat_risk"] / 100.0 + 0.25 * r["distance_km"] / max_dist + 0.25 * r["duration_minutes"] / max_dur, 3
            )

        coolest, fastest = routes["coolest"], routes["fastest"]
        heat_reduction = max(0.0, round(fastest["average_heat_risk"] - coolest["average_heat_risk"], 1))
        extra_time = max(0.0, round(coolest["duration_minutes"] - fastest["duration_minutes"], 1))
        cost = "at no extra time" if extra_time < 0.5 else f"for {round(extra_time)} extra minute{'s' if round(extra_time) != 1 else ''}"
        summary = (
            f"The coolest route lowers average heat exposure by {heat_reduction} points {cost}."
            if heat_reduction > 0 else
            "No alternative walking route is cooler than the fastest one here, so the fastest is also the coolest."
        )

        return {
            "coolest_route": coolest,
            "balanced_route": routes["balanced"],
            "fastest_route": fastest,
            "recommended_route": "coolest_route" if heat_reduction > 0 else "fastest_route",
            "comparison": {
                "heat_reduction_points": heat_reduction,
                "extra_time_minutes": extra_time,
                "mapped_route_count": len(analysed),
                "alternatives_available": len(analysed) > 1,
                "start_snap_distance_m": round(start_snap, 1),
                "end_snap_distance_m": round(end_snap, 1),
                "pins_snapped": start_snap > 2.0 or end_snap > 2.0,
                "summary": summary,
            },
        }


route_service = RouteService()
