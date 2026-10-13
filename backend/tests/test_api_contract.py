"""
API contract tests for the UrbanHeat backend.

These tests exercise the real FastAPI app and its real request/response
schemas (Pydantic models in app/schemas/schemas.py). They deliberately avoid
asserting against fabricated/mocked production responses — for endpoints
that call external services (OSRM, Nominatim), only the deterministic,
network-independent validation paths (400/422 responses) are tested here,
since the actual live-data paths depend on third-party services that are not
appropriate to hit inside a unit test.
"""
import os

import pytest
from fastapi.testclient import TestClient

# Keep tests offline and deterministic: no live Open-Meteo call.
os.environ["LIVE_WEATHER"] = "0"

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body == {"status": "running", "service": "Urban Heat Risk Prediction API"}


def test_heatmap_returns_list_within_region_bounds():
    response = client.get("/api/heatmap")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    for point in body:
        assert "latitude" in point and "longitude" in point
        assert "heat_risk" in point and "risk_level" in point
        # Tamil Nadu bounding box (app/services/campus_config.py)
        assert 7.9 <= point["latitude"] <= 13.7
        assert 76.1 <= point["longitude"] <= 80.5


def test_heatmap_respects_custom_bounding_box():
    response = client.get(
        "/api/heatmap",
        params={"min_lat": 12.82, "max_lat": 12.822, "min_lon": 80.04, "max_lon": 80.042},
    )
    assert response.status_code == 200
    for point in response.json():
        assert 12.82 <= point["latitude"] <= 12.822
        assert 80.04 <= point["longitude"] <= 80.042


def test_location_search_rejects_short_query():
    response = client.get("/api/location-search", params={"q": "a"})
    assert response.status_code == 422


def test_predict_heat_returns_score_and_breakdown():
    payload = {
        "temperature": 34.0,
        "humidity": 50.0,
        "uv_index": 8.0,
        "vegetation_index": 0.5,
        "building_density": 0.5,
        "shade_score": 0.5,
    }
    response = client.post("/api/predict-heat", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert 0.0 <= body["predicted_heat_risk"] <= 100.0
    assert body["risk_level"] in {"Low", "Moderate", "High", "Extreme"}
    assert set(body["breakdown"].keys()) == {
        "temperature_factor", "humidity_factor", "uv_factor",
        "building_density_factor", "vegetation_mitigation", "shade_mitigation",
    }


def test_predict_heat_rejects_out_of_range_input():
    payload = {
        "temperature": 999.0,  # outside the declared 10-55 range
        "humidity": 50.0,
        "uv_index": 8.0,
        "vegetation_index": 0.5,
        "building_density": 0.5,
        "shade_score": 0.5,
    }
    response = client.post("/api/predict-heat", json=payload)
    assert response.status_code == 422


def test_location_heat_detail_requires_campus_coordinates():
    # Mumbai: well outside the Tamil Nadu bounding box.
    response = client.post(
        "/api/location-heat-detail",
        json={"lat": 19.076, "lon": 72.877, "location_name": "Mumbai"},
    )
    assert response.status_code == 400


def test_location_heat_detail_returns_real_shape_for_campus_point():
    response = client.post(
        "/api/location-heat-detail",
        json={"lat": 12.823, "lon": 80.0445, "location_name": "SRM Campus"},
    )
    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["heat_risk_score"] <= 100
    # "Now" + the 6-point model-driven diurnal curve from /heat-trend.
    assert len(body["forecast"]) == 7
    assert body["risk_level"].removesuffix(" Heat Risk") in {"Low", "Moderate", "High", "Extreme"}
    assert 0 <= body["environment"]["vegetation_index"] <= 1
    assert len(body["recommendations"]) >= 1


def test_recommend_route_rejects_identical_points():
    payload = {"start_lat": 12.823, "start_lon": 80.0445, "end_lat": 12.823, "end_lon": 80.0445}
    response = client.post("/api/recommend-route", json=payload)
    assert response.status_code == 400


def test_recommend_route_rejects_points_outside_region():
    payload = {"start_lat": 13.0827, "start_lon": 80.2707, "end_lat": 19.076, "end_lon": 72.877}
    response = client.post("/api/recommend-route", json=payload)
    assert response.status_code == 400


def test_route_heat_requires_at_least_two_coordinates():
    response = client.post("/api/route-heat", json={"coordinates": [[12.823, 80.0445]]})
    assert response.status_code == 400


def test_route_heat_rejects_coordinates_outside_region():
    response = client.post(
        "/api/route-heat",
        json={"coordinates": [[13.0827, 80.2707], [19.076, 72.877]]},
    )
    assert response.status_code == 400


def test_route_heat_analyzes_a_valid_campus_path():
    response = client.post(
        "/api/route-heat",
        json={"coordinates": [[12.822, 80.0440], [12.8235, 80.0450], [12.825, 80.0460]]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["route_type"] == "custom"
    assert len(body["sampled_points"]) >= 2
    assert 0 <= body["average_heat_risk"] <= 100


def test_recommend_route_picks_coolest_of_osrm_alternatives(monkeypatch):
    # Two fake alternatives (no network): a short straight one and a longer detour.
    straight = ([[13.04, 80.23], [13.05, 80.23], [13.06, 80.23]], [("Road A", 1100.0), ("Road B", 1100.0)])
    detour = ([[13.04, 80.23], [13.05, 80.26], [13.06, 80.23]], [("Road C", 3000.0)])
    monkeypatch.setattr(
        "app.services.route_service._osrm_routes",
        lambda *a: ([straight, detour], (1.0, 1.0)) if len(a) == 4 or a[4] is None else ([], ()),
    )
    payload = {"start_lat": 13.04, "start_lon": 80.23, "end_lat": 13.06, "end_lon": 80.23}
    response = client.post("/api/recommend-route", json=payload)
    assert response.status_code == 200
    body = response.json()
    for key in ("coolest_route", "balanced_route", "fastest_route"):
        route = body[key]
        assert route["distance_km"] > 0 and route["duration_minutes"] > 0
        assert len(route["heat_segments"]) == len(route["geometry"]) - 1
        assert route["turn_by_turn"][-1]["instruction"] == "Arrive at your destination"
    assert body["fastest_route"]["distance_km"] == 2.2
    assert body["coolest_route"]["average_heat_risk"] <= body["fastest_route"]["average_heat_risk"]
    assert body["comparison"]["mapped_route_count"] == 2


def test_areas_json_matches_frontend_copy():
    import pathlib
    root = pathlib.Path(__file__).resolve().parents[2]
    assert (root / "backend/data/areas.json").read_text() == (root / "frontend/src/config/areas.json").read_text()


def test_feedback_rejects_unknown_topic():
    r = client.post("/api/feedback", json={"is_correct": True, "topic": "bogus"})
    assert r.status_code == 422
