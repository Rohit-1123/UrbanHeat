# API Documentation

Backend: FastAPI, base URL default `http://localhost:8000`. Interactive Swagger UI is auto-generated at `/docs` (FastAPI default — verified reachable during testing). All request/response shapes below are taken directly from `backend/app/schemas/schemas.py` and confirmed against live responses.

All coordinate-accepting endpoints enforce the SRM KTR campus boundary (`backend/app/services/campus_config.py`) and return **HTTP 400** if a coordinate falls outside it.

---

## Endpoint Summary

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Health check |
| `/api/location-search` | GET | Campus-bounded place search (proxies Nominatim) |
| `/api/predict-heat` | POST | Raw ML heat-risk prediction from 6 environmental inputs |
| `/api/heatmap` | GET | All (bounding-box-filtered) seeded heat data points |
| `/api/location-heat-detail` | POST | Full detail card for one coordinate (score, forecast, recommendations) |
| `/api/heat-trend` | GET | Model-driven diurnal (hourly) heat-risk curve for one coordinate |
| `/api/recommendations` | GET | Ranked mitigation recommendations for one coordinate |
| `/api/recommend-route` | POST | Fastest / Coolest / Balanced walking-route comparison |
| `/api/route-heat` | POST | Heat analysis of an arbitrary custom coordinate path |

Endpoints such as `/api/geocode`, `/api/reverse-geocode`, `/api/campus/locations`, `/api/environment/current`, and `/api/environment/air-quality` (which a generic template might assume) **do not exist** in this backend and are not documented as if they did.

---

## `GET /health`

No parameters.

**Response 200**
```json
{"status": "running", "service": "Urban Heat Risk Prediction API"}
```

---

## `GET /api/location-search`

Proxies OpenStreetMap Nominatim, bounded to a viewbox around the SRM campus, then filters results to those actually inside the campus boundary.

| Param | Type | Required | Constraint |
|---|---|---|---|
| `q` | string (query) | Yes | `min_length=2, max_length=80` |

**Response 200** — array of:
```json
{
  "id": "osm-way-123456",
  "name": "Tech Park",
  "display_name": "Tech Park, SRM Institute of Science and Technology, ...",
  "lat": 12.8234,
  "lon": 80.0446,
  "source": "OpenStreetMap"
}
```

**Errors**
- `422` — `q` shorter than 2 characters (Pydantic validation)
- `503` — Nominatim request failed/timed out

---

## `POST /api/predict-heat`

Runs the trained ML model (with analytical fallback) directly on caller-supplied environmental values — no database lookup, no coordinate. Used by the frontend's ML Simulator.

**Request body** (`HeatPredictionInput`)
```json
{
  "temperature": 34.0,
  "humidity": 50.0,
  "uv_index": 8.0,
  "vegetation_index": 0.5,
  "building_density": 0.5,
  "shade_score": 0.5
}
```
All fields required; each has a range constraint (`temperature` 10–55, `humidity`/percentages 0–100, `uv_index` 0–15, the three index fields 0–1).

**Response 200** (`HeatPredictionOutput`) — actual response captured during testing:
```json
{
  "predicted_heat_risk": 41.3,
  "risk_level": "Moderate",
  "breakdown": {
    "temperature_factor": 15.8,
    "humidity_factor": 5.0,
    "uv_factor": 13.3,
    "building_density_factor": 15.0,
    "vegetation_mitigation": 12.5,
    "shade_mitigation": 12.5
  }
}
```
Note: `breakdown` is always computed from the same fixed analytical formula (`app/api/heat.py`) for display purposes, **regardless of whether the ML model or the analytical fallback produced `predicted_heat_risk`** — the two can therefore diverge slightly; the breakdown is illustrative, not a decomposition of the model's internal decision.

**Errors:** `422` on out-of-range/missing fields; `500` on unexpected model error.

---

## `GET /api/heatmap`

Returns seeded `heat_data` rows, optionally bounding-box filtered (always clamped to stay within the SRM campus box regardless of what's requested).

| Param | Type | Required |
|---|---|---|
| `min_lat`, `max_lat`, `min_lon`, `max_lon` | float (query) | No — defaults to the full campus box |

**Response 200** — array of (verified live sample):
```json
[
  {
    "id": 121,
    "latitude": 12.822345,
    "longitude": 80.048169,
    "temperature": 34.2,
    "humidity": 45.6,
    "uv_index": 8.9,
    "vegetation_index": 0.75,
    "building_density": 0.89,
    "shade_score": 0.5,
    "heat_risk": 50.28,
    "risk_level": "High",
    "timestamp": "2026-09-22T09:41:12.280899"
  }
]
```

**Note:** as of the current committed database file, only a small subset of the 256 seeded rows fall inside the campus box this endpoint filters to — see [PROJECT_DOCUMENTATION.md §14](PROJECT_DOCUMENTATION.md#14-limitations--honest-assessment).

---

## `POST /api/location-heat-detail`

**Request body** (`LocationDetailRequest`)
```json
{"lat": 12.82, "lon": 80.04, "location_name": "City Center"}
```
(`lat`/`lon` required; `location_name` optional, defaults to `"Selected Area"`.)

**Response 200** (`LocationDetailResponse`) — verified live sample (truncated):
```json
{
  "location_name": "Selected Area",
  "heat_risk_score": 48,
  "risk_level": "Moderate Heat Risk",
  "temperature": 34.4,
  "humidity": 66.9,
  "uv_index_label": "Very High (8.0)",
  "vegetation_cover": "72%",
  "building_density": "High (Dense Urban)",
  "surface_type": "Mostly paved / built-up",
  "warning_message": "Heat conditions are manageable. Maintain normal hydration.",
  "forecast": [
    {"time": "Now", "temp": 34, "heat_risk": 48, "risk_level": "Moderate"},
    {"time": "6 AM", "temp": 27, "heat_risk": 30, "risk_level": "Moderate"}
  ],
  "recommendations": [
    {"title": "Find Shade", "description": "Choose routes with more trees and canopy coverage.", "icon": "tree"}
  ],
  "environment": {"temperature": 34.4, "humidity": 66.9, "uv_index": 8.0, "vegetation_index": 0.72, "building_density": 0.65, "shade_score": 0.5}
}
```

**Note on `forecast`:** `"Now"` followed by the same 6-point model-driven diurnal curve that `/api/heat-trend` returns (the ML model re-run per hour). It is not a real weather forecast. `recommendations` here is a **static** 3-item list, unlike the endpoint below.

**Note on `uv_index_label` / `surface_type`:** `uv_index_label` uses the WHO UV bands. `surface_type` is a coarse label comparing the point's building density with its vegetation index, not real surface-classification data.

**Note on `environment`:** the raw numeric inputs (0-1 ratios, °C, %) behind the display strings above. The frontend uses these instead of re-estimating them.

**Note on `live_weather` / `observed_at`:** when Open-Meteo is reachable (cached 10 minutes, `LIVE_WEATHER=0` disables it), the current campus temperature, humidity and UV replace the dataset values and the score is re-predicted with the location's own vegetation, building density and shade. `live_weather` is then `true` and `observed_at` is the observation time; otherwise the dataset is used and `observed_at` is `null`.

**Errors:** `400` if outside campus; `500` on unexpected error.

---

## `GET /api/heat-trend`

Re-runs the ML model per hour (the same curve `forecast` above embeds) — see [DATA_AND_ENVIRONMENTAL_ANALYSIS.md](DATA_AND_ENVIRONMENTAL_ANALYSIS.md) for the diurnal-curve formula it feeds the model.

| Param | Type | Required |
|---|---|---|
| `lat`, `lon` | float (query) | Yes, `-90..90` / `-180..180` |
| `location_name` | string (query) | No, default `"Selected Area"` |

**Response 200** (`HeatTrendResponse`) — verified live sample:
```json
{
  "location_name": "Selected Area",
  "peak_hour": "3 PM",
  "peak_heat_risk": 51.9,
  "points": [
    {"hour": "6 AM", "temperature": 27.4, "heat_risk": 26.7, "risk_level": "Moderate"},
    {"hour": "9 AM", "temperature": 31.4, "heat_risk": 38.5, "risk_level": "Moderate"},
    {"hour": "12 PM", "temperature": 35.9, "heat_risk": 51.7, "risk_level": "High"},
    {"hour": "3 PM", "temperature": 36.9, "heat_risk": 51.9, "risk_level": "High"},
    {"hour": "6 PM", "temperature": 33.4, "heat_risk": 34.5, "risk_level": "Moderate"},
    {"hour": "9 PM", "temperature": "..." }
  ]
}
```
*(response truncated for brevity — `points` always has 6 entries, one per hour in the diurnal curve defined in `heat_service.compute_hourly_trend`)*

**Errors:** `400` if outside campus; `500` on unexpected error.

---

## `GET /api/recommendations`

Rule-based recommendations driven by the location's real interpolated/stored environmental factors (not static — see `heat_service.build_recommendations()`).

| Param | Type | Required |
|---|---|---|
| `lat`, `lon` | float (query) | Yes |
| `location_name` | string (query) | No, default `"Selected Area"` |

**Response 200** (`RecommendationsResponse`) — verified live sample (truncated):
```json
{
  "location_name": "Selected Area",
  "heat_risk_score": 47.8,
  "risk_level": "Moderate",
  "recommendations": [
    {
      "title": "Avoid Peak Concrete Exposure",
      "description": "Building/pavement density here is high (70%), which traps and re-radiates heat. Avoid lingering outdoors between 12-3 PM.",
      "icon": "building",
      "priority": "high",
      "reason": "high_building_density"
    }
  ]
}
```
Candidate rules and thresholds (all in `heat_service.build_recommendations`): low vegetation (<35%) → "Seek Tree Canopy"; high building density (>60%) → "Avoid Peak Concrete Exposure"; low shade (<30%) → "Use Shaded Walkways"; high UV (≥8) → "Apply Sun Protection"; always appended: "Stay Hydrated", "Travel Smart". Sorted by priority (`high` → `medium` → `low`).

---

## `POST /api/recommend-route`

Full algorithm documented in [ROUTE_OPTIMIZATION.md](ROUTE_OPTIMIZATION.md). Summary here.

**Request body** (`RouteRequest`)
```json
{
  "start_lat": 12.8232, "start_lon": 80.0450,
  "end_lat": 12.8246527, "end_lon": 80.0452877
}
```

**Response 200** (`RouteRecommendationResponse`) — shape:
```json
{
  "coolest_route": {
    "route_name": "Coolest Route", "route_type": "coolest",
    "distance_km": 0.19, "duration_minutes": 2.5,
    "average_heat_risk": 50.3, "maximum_heat_risk": 50.3,
    "heat_risk_level": "High", "shaded_area_percentage": 48,
    "heat_profile": [{"position": 0, "score": 50.3}],
    "final_score": 0.752,
    "geometry": [[12.8232, 80.044883]],
    "sampled_points": [{"lat": 12.8232, "lon": 80.044883, "distance_km": 0.0, "heat_risk": 50.3, "risk_level": "High", "temperature": 34.2, "humidity": 56.4, "uv_index": 8.6, "vegetation_index": 0.75, "building_density": 0.8, "shade_score": 0.48}],
    "turn_by_turn": [{"instruction": "depart", "distance": "138m"}]
  },
  "balanced_route": { "...same shape..." },
  "fastest_route": { "...same shape..." },
  "recommended_route": "coolest_route",
  "comparison": {
    "heat_reduction_points": 0.0,
    "extra_time_minutes": 0.0,
    "mapped_route_count": 1,
    "alternatives_available": false,
    "start_snap_distance_m": 12.7,
    "end_snap_distance_m": 9.0,
    "pins_snapped": true,
    "summary": "Every mapped path between these points has similar heat exposure, so the fastest one is also the coolest."
  }
}
```

**Errors**
- `400` — identical start/end, or either point outside campus
- `422` — a pin is more than 250 m from any mapped campus path, both pins snap to the same node, or the points are not connected (see [ROUTE_OPTIMIZATION.md](ROUTE_OPTIMIZATION.md))
- `500` — unexpected server error

---

## `POST /api/route-heat`

Ad-hoc heat analysis for an arbitrary coordinate path (no routing involved).

**Request body** (`RouteHeatDetailRequest`)
```json
{"coordinates": [[12.82, 80.044], [12.823, 80.046], [12.825, 80.048]]}
```

**Response 200** — same per-route shape as one entry of `/api/recommend-route` (see above), with `route_name: "Custom Route Path"`, `route_type: "custom"`.

**Errors:** `400` — fewer than 2 coordinates, or any coordinate outside campus.

---

## External API Dependencies (Backend)

| Service | Called from | Auth required | Notes |
|---|---|---|---|
| Open-Meteo `api.open-meteo.com/v1/forecast` | `weather_service.py` | No | Current temperature, humidity, UV; cached 10 min |
| Overpass API (OpenStreetMap) | `scripts/build_campus_graph.py` only | No | One-off download of campus paths; not called at runtime |
| OpenStreetMap Nominatim | `api/heat.py::search_campus_locations` | No (public, rate-limited by usage policy) | Bounded viewbox + campus post-filter |

No backend call is ever made to Open-Meteo or Mapbox.

## External API Dependencies (Frontend)

| Service | Called from | Notes |
|---|---|---|
| Open-Meteo `api.open-meteo.com/v1/forecast` | `frontend/src/services/weatherService.js` | Client-side only; Home page live-weather widget |
| OpenStreetMap raster tiles | Leaflet `TileLayer` in `InteractiveHeatMap.jsx` / `MapView.jsx` | Standard `{s}.tile.openstreetmap.org` |

---

## Environment Variables (reference)

| Variable | Where | Default | Actually used? |
|---|---|---|---|
| `VITE_API_BASE_URL` | frontend `.env` | `http://localhost:8000` | Yes (`services/api.js`) |
| `POSTGRES_DB/USER/PASSWORD/HOST/PORT` | backend `.env` | see `.env.example` | Yes (`database/connection.py`) |
| `CORS_ORIGINS` | backend `.env` | localhost dev ports | Yes (`app/main.py`) |
| `MODEL_PATH` | backend `.env` | `ml/heat_risk_model.joblib` | **No** — `ml/predict.py` hardcodes its own path; this variable is read from nowhere in the code |
| `USE_XGBOOST` | shell env, training only | `false` | Yes, but only inside `ml/train_model.py` — has no effect at request time |

No secret values are reproduced here; `.env.example` files in both `frontend/` and `backend/` contain placeholder/local-dev-only defaults and should never be committed with real production credentials.
