import math
import requests
import numpy as np
import time
from copy import deepcopy
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.heat_service import heat_service, haversine_distance
from app.services.campus_config import route_geometry_is_within_srm_campus

OSRM_BASE_URL = "https://routing.openstreetmap.de/routed-foot/route/v1/driving"

class RouteService:
    @staticmethod
    def decode_polyline(encoded: str) -> List[List[float]]:
        """Decode a Google-style encoded polyline into [lat, lon] pairs."""
        points = []
        index = latitude = longitude = 0
        while index < len(encoded):
            result = shift = 0
            while index < len(encoded):
                byte = ord(encoded[index]) - 63
                index += 1
                result |= (byte & 0x1f) << shift
                shift += 5
                if byte < 0x20:
                    break
            latitude += ~(result >> 1) if result & 1 else result >> 1

            result = shift = 0
            while index < len(encoded):
                byte = ord(encoded[index]) - 63
                index += 1
                result |= (byte & 0x1f) << shift
                shift += 5
                if byte < 0x20:
                    break
            longitude += ~(result >> 1) if result & 1 else result >> 1
            points.append([latitude / 1e5, longitude / 1e5])
        return points

    @staticmethod
    def extract_route_coordinates(raw_route: Dict[str, Any]) -> List[List[float]]:
        """Normalize common GeoJSON geometry shapes to [latitude, longitude]."""
        geometry = raw_route.get("geometry")
        coordinates = geometry.get("coordinates") if isinstance(geometry, dict) else geometry
        if isinstance(coordinates, str):
            return RouteService.decode_polyline(coordinates)
        if not isinstance(coordinates, list) or not coordinates:
            return []

        def flatten(points: Any) -> List[List[float]]:
            if not isinstance(points, list) or not points:
                return []
            if len(points) >= 2 and all(isinstance(value, (int, float)) for value in points[:2]):
                return [[round(float(points[1]), 6), round(float(points[0]), 6)]]
            result = []
            for child in points:
                result.extend(flatten(child))
            return result

        normalized = flatten(coordinates)
        return normalized if len(normalized) >= 2 else []

    @staticmethod
    def snap_to_walkable_point(lat: float, lon: float) -> tuple[float, float, float]:
        """Snap an arbitrary campus pin to the nearest mapped walking segment."""
        nearest_url = OSRM_BASE_URL.replace('/route/', '/nearest/')
        search_points = [(lat, lon)]
        for offset in (0.00025, -0.00025, 0.0005, -0.0005):
            search_points.extend([(lat + offset, lon), (lat, lon + offset)])

        for candidate_lat, candidate_lon in search_points:
            url = f"{nearest_url}/{candidate_lon},{candidate_lat}?number=3"
            for attempt in range(2):
                try:
                    response = requests.get(url, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    for waypoint in data.get("waypoints", []):
                        if waypoint.get("location"):
                            snapped_lon, snapped_lat = waypoint["location"]
                            return float(snapped_lat), float(snapped_lon), float(waypoint.get("distance", 0.0))
                    break
                except requests.RequestException as exc:
                    if attempt == 1:
                        print(f"Walking snap attempt failed: {exc}")
                    else:
                        time.sleep(0.15)
        raise ValueError("No mapped walking path was found near one of the selected SRM campus pins")

    @staticmethod
    def fetch_osrm_routes(start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> List[Dict[str, Any]]:
        """Fetches route options from public OpenStreetMap OSRM API."""
        url = f"{OSRM_BASE_URL}/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson&steps=true&alternatives=true"
        for attempt in range(3):
            try:
                resp = requests.get(url, timeout=12)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("code") == "Ok" and "routes" in data:
                        return data["routes"]
            except requests.RequestException as exc:
                if attempt == 2:
                    print(f"Walking route request failed: {exc}")
                else:
                    time.sleep(0.2)
        
        return []

    @staticmethod
    def create_alternative_geometry(coords: List[List[float]], bend_factor: float, target_lat: float, target_lon: float) -> List[List[float]]:
        """Generates shaded/balanced route geometries bending middle points towards green/park zones."""
        if len(coords) < 4:
            return coords

        new_coords = []
        n = len(coords)

        for i, (lat, lon) in enumerate(coords):
            if i == 0 or i == n - 1:
                new_coords.append([lat, lon])
            else:
                weight = math.sin((i / n) * math.pi) * bend_factor
                bended_lat = lat + (target_lat - lat) * weight
                bended_lon = lon + (target_lon - lon) * weight
                new_coords.append([round(bended_lat, 6), round(bended_lon, 6)])

        return new_coords

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
        steps: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        sampled = RouteService.sample_points_along_route(coords, max_samples=16)
        
        sampled_heat_points = []
        heat_scores = []
        cum_dist = 0.0

        for i, (lat, lon) in enumerate(sampled):
            if i > 0:
                prev_lat, prev_lon = sampled[i-1][0], sampled[i-1][1]
                cum_dist += haversine_distance(prev_lat, prev_lon, lat, lon)

            risk_score, risk_level, env_data = heat_service.evaluate_coordinate_heat_risk(db, lat, lon)
            
            heat_scores.append(risk_score)

            sampled_heat_points.append({
                "lat": lat,
                "lon": lon,
                "distance_km": round(cum_dist, 2),
                "heat_risk": round(risk_score, 1),
                "risk_level": risk_level,
                "temperature": env_data.get("temperature"),
                "humidity": env_data.get("humidity"),
                "uv_index": env_data.get("uv_index"),
                "vegetation_index": env_data.get("vegetation_index"),
                "building_density": env_data.get("building_density"),
                "shade_score": env_data.get("shade_score")
            })

        avg_heat_risk = round(float(np.mean(heat_scores)), 1)
        max_heat_risk = round(float(np.max(heat_scores)), 1)
        
        heat_risk_level = "Low"
        if avg_heat_risk > 75.0:
            heat_risk_level = "Extreme"
        elif avg_heat_risk > 50.0:
            heat_risk_level = "High"
        elif avg_heat_risk > 25.0:
            heat_risk_level = "Moderate"

        shade_scores = [point["shade_score"] for point in sampled_heat_points if point["shade_score"] is not None]
        shaded_pct = round(float(np.mean(shade_scores)) * 100) if shade_scores else 0

        # Build heat profile curve points (0 to 100% position)
        num_profile_pts = len(heat_scores)
        heat_profile = [
            {"position": int((i / (num_profile_pts - 1)) * 100), "score": round(score, 1)}
            for i, score in enumerate(heat_scores)
        ]

        turn_by_turn = []
        for step in steps or []:
            maneuver = step.get("maneuver", {})
            instruction = maneuver.get("instruction") or maneuver.get("type", "Continue")
            step_distance = step.get("distance", 0.0)
            turn_by_turn.append({
                "instruction": instruction,
                "distance": f"{step_distance:.0f}m"
            })

        return {
            "route_name": route_name,
            "route_type": route_type,
            "distance_km": round(distance_km, 2),
            "duration_minutes": round(duration_min, 1),
            "average_heat_risk": avg_heat_risk,
            "maximum_heat_risk": max_heat_risk,
            "heat_risk_level": heat_risk_level,
            "shaded_area_percentage": shaded_pct,
            "heat_profile": heat_profile,
            "geometry": coords,
            "sampled_points": sampled_heat_points,
            "turn_by_turn": turn_by_turn
        }

    @staticmethod
    def process_and_recommend_routes(db: Session, start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> Dict[str, Any]:
        snapped_start_lat, snapped_start_lon, start_snap_distance = RouteService.snap_to_walkable_point(start_lat, start_lon)
        snapped_end_lat, snapped_end_lon, end_snap_distance = RouteService.snap_to_walkable_point(end_lat, end_lon)

        if not route_geometry_is_within_srm_campus([
            [snapped_start_lat, snapped_start_lon],
            [snapped_end_lat, snapped_end_lon]
        ]):
            raise ValueError("The nearest mapped walking path is outside the SRM campus boundary")

        raw_routes = RouteService.fetch_osrm_routes(
            snapped_start_lat,
            snapped_start_lon,
            snapped_end_lat,
            snapped_end_lon
        )

        route_options = []
        for raw_route in raw_routes:
            coordinates = RouteService.extract_route_coordinates(raw_route)
            if len(coordinates) < 2:
                continue
            route_options.append({
                "coords": coordinates,
                "distance_km": raw_route.get("distance", 0.0) / 1000.0,
                "duration_min": raw_route.get("duration", 0.0) / 60.0,
                "steps": [step for leg in raw_route.get("legs", []) for step in leg.get("steps", [])]
            })

        campus_route_options = [
            option for option in route_options
            if route_geometry_is_within_srm_campus(option["coords"])
        ]

        if not campus_route_options:
            if route_options:
                raise ValueError(
                    "No mapped walking path stays within the SRM campus between these two points "
                    "(the nearest route detours onto public roads outside campus). Try selecting "
                    "locations that are closer together or connected by an internal campus path."
                )
            raise ValueError("Routing provider returned no usable route geometry")

        route_options = campus_route_options

        mapped_route_count = len(route_options)

        analyzed_routes = []
        for option in route_options:
            analyzed_routes.append(RouteService.analyze_route_heat(
                db,
                option["coords"],
                "Route option",
                "alternative",
                option["distance_km"],
                option["duration_min"],
                option["steps"]
            ))

        fastest_route = deepcopy(min(analyzed_routes, key=lambda route: route["duration_minutes"]))
        coolest_route = deepcopy(min(analyzed_routes, key=lambda route: (route["average_heat_risk"], route["duration_minutes"])))

        max_dist = max(route["distance_km"] for route in analyzed_routes) or 1.0
        max_dur = max(route["duration_minutes"] for route in analyzed_routes) or 1.0
        balanced_route = deepcopy(min(
            analyzed_routes,
            key=lambda route: (
                0.5 * route["average_heat_risk"] / 100.0
                + 0.25 * route["distance_km"] / max_dist
                + 0.25 * route["duration_minutes"] / max_dur
            )
        ))

        coolest_route["route_name"] = "Coolest Route"
        coolest_route["route_type"] = "coolest"
        balanced_route["route_name"] = "Balanced Route"
        balanced_route["route_type"] = "balanced"
        fastest_route["route_name"] = "Fastest Route"
        fastest_route["route_type"] = "fastest"

        # Keep three cards useful even when OSRM only returns one road option.
        for route in {id(coolest_route): coolest_route, id(balanced_route): balanced_route, id(fastest_route): fastest_route}.values():
            route["final_score"] = round(
                0.5 * route["average_heat_risk"] / 100.0
                + 0.25 * route["distance_km"] / max_dist
                + 0.25 * route["duration_minutes"] / max_dur,
                3
            )

        # Calculate scores for ranking
        recommended = "coolest_route" if coolest_route["average_heat_risk"] <= balanced_route["average_heat_risk"] else "balanced_route"

        heat_reduction = max(0.0, round(fastest_route["average_heat_risk"] - coolest_route["average_heat_risk"], 1))
        extra_time = max(0.0, round(coolest_route["duration_minutes"] - fastest_route["duration_minutes"], 1))

        comparison = {
            "heat_reduction_points": heat_reduction,
            "extra_time_minutes": extra_time,
            "mapped_route_count": mapped_route_count,
            "alternatives_available": mapped_route_count > 1,
            "start_snap_distance_m": round(start_snap_distance, 1),
            "end_snap_distance_m": round(end_snap_distance, 1),
            "pins_snapped": start_snap_distance > 2.0 or end_snap_distance > 2.0,
            "summary": f"Routes with more trees and greenery reduce heat exposure by up to {int(heat_reduction)} points."
        }

        return {
            "coolest_route": coolest_route,
            "balanced_route": balanced_route,
            "fastest_route": fastest_route,
            "recommended_route": recommended,
            "comparison": comparison
        }

route_service = RouteService()
