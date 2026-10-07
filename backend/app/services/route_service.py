"""Heat-aware walking routes over the SRM campus path network.

The network (data/campus_paths.json, from OpenStreetMap via
scripts/build_campus_graph.py) is routed in-process with Dijkstra, so routes
never leave campus and need no external routing service. Each edge costs
    length * (1 + alpha * heat_risk / 100)
with alpha = 0 (fastest), 1.5 (balanced) and 4 (coolest). When the map only
has one sensible path, the three options honestly come back identical.
"""
import heapq
import json
import math
import os
import threading
from typing import Any, Dict, List, Optional

import numpy as np
from sqlalchemy.orm import Session

from app.database.models import HeatData
from app.services.heat_service import heat_service, haversine_distance

GRAPH_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "campus_paths.json")
WALKING_SPEED_M_PER_MIN = 80.0  # ~4.8 km/h
MAX_SNAP_M = 250.0
ROUTE_PROFILES = {"fastest": 0.0, "balanced": 1.5, "coolest": 4.0}


def _meters(a, b) -> float:
    return haversine_distance(a[0], a[1], b[0], b[1]) * 1000.0


class CampusGraph:
    def __init__(self, db: Session):
        with open(GRAPH_PATH, encoding="utf-8") as f:
            raw = json.load(f)
        self.nodes = {int(k): tuple(v) for k, v in raw["nodes"].items()}
        self.adj: Dict[int, List[tuple]] = {}
        for way in raw["ways"]:
            label = way["name"] or {"footway": "footpath", "path": "path", "steps": "steps"}.get(way["highway"], "campus road")
            for a, b in zip(way["nodes"], way["nodes"][1:]):
                length = _meters(self.nodes[a], self.nodes[b])
                self.adj.setdefault(a, []).append((b, length, label))
                self.adj.setdefault(b, []).append((a, length, label))

        # Route only on the largest connected component; small islands are
        # disconnected service lanes that can't reach anything.
        self.main = max(self._components(), key=len)

        # Heat at each node = nearest seeded heat point (static dataset).
        pts = [(p.latitude, p.longitude, p.heat_risk) for p in db.query(HeatData).all()]
        self.heat = {
            n: min(pts, key=lambda p: (p[0] - lat) ** 2 + (p[1] - lon) ** 2)[2] if pts else 50.0
            for n, (lat, lon) in self.nodes.items() if n in self.adj
        }

    def _components(self):
        seen = set()
        for start in self.adj:
            if start in seen:
                continue
            comp, stack = {start}, [start]
            while stack:
                for nxt, _, _ in self.adj[stack.pop()]:
                    if nxt not in comp:
                        comp.add(nxt)
                        stack.append(nxt)
            seen |= comp
            yield comp

    def nearest(self, lat: float, lon: float) -> tuple[int, float]:
        # ponytail: linear scan over ~600 nodes; add a grid index if the graph grows 100x.
        node = min(self.main, key=lambda n: _meters((lat, lon), self.nodes[n]))
        return node, _meters((lat, lon), self.nodes[node])

    def shortest(self, source: int, target: int, alpha: float) -> List[tuple]:
        """Dijkstra; returns [(node, label_of_edge_into_node)]."""
        dist = {source: 0.0}
        prev: Dict[int, tuple] = {}
        queue = [(0.0, source)]
        while queue:
            cost, node = heapq.heappop(queue)
            if node == target:
                break
            if cost > dist[node]:
                continue
            for nxt, length, label in self.adj[node]:
                heat = (self.heat[node] + self.heat[nxt]) / 200.0
                new_cost = cost + length * (1.0 + alpha * heat)
                if new_cost < dist.get(nxt, math.inf):
                    dist[nxt] = new_cost
                    prev[nxt] = (node, label)
                    heapq.heappush(queue, (new_cost, nxt))
        if target not in dist:
            raise ValueError("These two points are not connected by any mapped campus path.")
        path = [(target, prev.get(target, (None, ""))[1])]
        while path[-1][0] != source:
            node = prev[path[-1][0]][0]
            path.append((node, prev.get(node, (None, ""))[1]))
        path.reverse()
        return path


_graph: Optional[CampusGraph] = None
_graph_lock = threading.Lock()


def get_graph(db: Session) -> CampusGraph:
    # ponytail: built once per process; restart the API after re-seeding heat data.
    global _graph
    with _graph_lock:
        if _graph is None:
            _graph = CampusGraph(db)
        return _graph


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
    ) -> Dict[str, Any]:
        sampled = RouteService.sample_points_along_route(coords, max_samples=16)

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
        graph = get_graph(db)
        source, start_snap = graph.nearest(start_lat, start_lon)
        target, end_snap = graph.nearest(end_lat, end_lon)
        if max(start_snap, end_snap) > MAX_SNAP_M:
            raise ValueError("No mapped campus path runs near one of these pins. Move it closer to a road or footpath.")
        if source == target:
            raise ValueError("Both pins snap to the same point on the path network. Pick places further apart.")

        routes: Dict[str, Dict[str, Any]] = {}
        paths = set()
        for route_type, alpha in ROUTE_PROFILES.items():
            path = graph.shortest(source, target, alpha)
            nodes = [n for n, _ in path]
            paths.add(tuple(nodes))
            coords = [list(graph.nodes[n]) for n in nodes]
            edges = [(label, _meters(graph.nodes[a], graph.nodes[b])) for (a, _), (b, label) in zip(path, path[1:])]
            meters = sum(length for _, length in edges)
            route = RouteService.analyze_route_heat(
                db, coords, f"{route_type.title()} Route", route_type,
                meters / 1000.0, meters / WALKING_SPEED_M_PER_MIN, _directions(edges),
            )
            route["heat_segments"] = [
                {"coords": [list(graph.nodes[a]), list(graph.nodes[b])],
                 "heat_risk": round((graph.heat[a] + graph.heat[b]) / 2, 1)}
                for a, b in zip(nodes, nodes[1:])
            ]
            routes[route_type] = route

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
            "Every mapped path between these points has similar heat exposure, so the fastest one is also the coolest."
        )

        return {
            "coolest_route": coolest,
            "balanced_route": routes["balanced"],
            "fastest_route": fastest,
            "recommended_route": "coolest_route" if heat_reduction > 0 else "fastest_route",
            "comparison": {
                "heat_reduction_points": heat_reduction,
                "extra_time_minutes": extra_time,
                "mapped_route_count": len(paths),
                "alternatives_available": len(paths) > 1,
                "start_snap_distance_m": round(start_snap, 1),
                "end_snap_distance_m": round(end_snap, 1),
                "pins_snapped": start_snap > 2.0 or end_snap > 2.0,
                "summary": summary,
            },
        }


route_service = RouteService()
