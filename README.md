# UrbanHeat

### SRM KTR Environmental Intelligence & Heat-Aware Campus Routing Platform

> Predicts heat-exposure risk across the SRM Institute of Science and Technology, Kattankulathur (SRM KTR) campus and recommends walking routes that minimize predicted heat exposure — not just distance or time.

Full technical documentation lives in [`docs/`](docs/) and is linked throughout this README. Start there for anything beyond a quick overview.

---

## 1. What This Is

Conventional navigation apps optimize only for distance and travel time. UrbanHeat adds a third factor — **predicted heat exposure** — using a trained machine-learning model, real OSRM-derived walking routes, and a spatial heat dataset, all scoped to the SRM KTR campus boundary.

It is **not** a general city-wide router: every endpoint hard-rejects coordinates outside the SRM KTR bounding box.

## 2. Core Features

- **Interactive Leaflet heat map** (OpenStreetMap tiles) with 5 selectable layers — heat intensity, surface temperature, vegetation, built-up density, heat risk.
- **Trained ML heat-risk model** — a `RandomForestRegressor` predicting a 0–100 heat-risk score from temperature, humidity, UV index, vegetation index, building density, and shade score, with an analytical-formula fallback if the model can't load.
- **Real walking routes via OSRM** — start/end pins snapped to the actual OSM footpath graph, with alternatives filtered to those that stay fully inside campus.
- **Three-way route comparison** — Fastest / Coolest / Balanced, scored as `0.50×heat + 0.25×distance + 0.25×duration` (normalized per-request), with Coolest recommended by default.
- **Campus location search** — a curated 30-place POI list plus a backend-proxied, campus-bounded OpenStreetMap Nominatim search.
- **ML "what-if" simulator** — four sliders call the live prediction endpoint in real time.
- **Live weather widget (frontend-only)** — Open-Meteo current conditions + 24h forecast on the Home page, independent of the heat-risk pipeline.
- **Hourly diurnal heat-trend curve**, location-specific mitigation recommendations, printable heat-report modal, light/dark theme.

**Not implemented** (see [docs/PROJECT_DOCUMENTATION.md §14–16](docs/PROJECT_DOCUMENTATION.md#14-limitations--honest-assessment) for the full, honest list): air quality/AQI, traffic data, safety scoring, vehicle/cycling routing, satellite/sensor-derived environmental data, authentication.

## 3. Technology Stack

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite 6, Leaflet / react-leaflet / `leaflet.heat`, plain CSS design tokens, axios |
| Backend | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0 |
| Database | PostgreSQL if reachable, automatic local SQLite fallback (`backend/urban_heat.db`) |
| ML | scikit-learn `RandomForestRegressor`, trained on a synthetic formula-generated dataset |
| Routing | Public OSRM `routed-foot` service (walking profile) |
| Geocoding | OpenStreetMap Nominatim, backend-proxied and campus-bounded |
| Weather | Open-Meteo (frontend-only) |

**Not used:** Mapbox, Tailwind CSS, HTTPX, PostGIS geometry types (despite `geoalchemy2`/`psycopg2` being listed dependencies), any AI/satellite imagery service. Verified directly against the source — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#4-technology-stack) for the full accounting.

## 4. Architecture

```mermaid
flowchart TD
    U[Browser] --> FE[React / Vite Frontend]
    FE -->|axios REST| BE[FastAPI Backend]
    BE --> DB[(heat_data\nPostgreSQL or SQLite)]
    BE --> ML[RandomForest\nheat_risk_model.joblib]
    BE -->|HTTP| OSRM[Public OSRM routed-foot]
    BE -->|HTTP| NOM[OSM Nominatim]
    FE -->|client-side only| OM[Open-Meteo]
```

Full diagrams and per-file breakdown: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 5. Project Structure

```text
UrbanHeat/
├── frontend/
│   ├── src/
│   │   ├── components/     InteractiveHeatMap, MapView, RouteFinderView,
│   │   │                   LocationSearch, SimulatorView, charts, ...
│   │   ├── pages/          HomePage, HeatMapPage, RoutesPage,
│   │   │                   AnalyticsPage, InsightsPage, ...
│   │   ├── services/       api.js, heatService.js, weatherService.js
│   │   ├── utils/          riskCalculator.js
│   │   ├── config/         campus.js (SRM KTR bounds + POIs)
│   │   └── data/           mockData.js (offline fallback content)
│   ├── package.json, vite.config.js, .env.example
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/             heat.py, routes.py
│   │   ├── services/        heat_service.py, route_service.py,
│   │   │                    ml_service.py, campus_config.py
│   │   ├── database/        connection.py, models.py
│   │   └── schemas/         schemas.py
│   ├── ml/                  train_model.py, predict.py, heat_risk_model.joblib
│   ├── scripts/              seed_heat_data.py
│   ├── requirements.txt, .env.example
│
├── docs/                    Full technical documentation (see below)
├── docker-compose.yml       PostgreSQL/PostGIS container only (optional)
└── README.md
```

## 6. Setup

### Database (optional — SQLite is used automatically if skipped)

```bash
docker-compose up -d
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python scripts/seed_heat_data.py
python ml/train_model.py
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

API docs (Swagger UI): `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### Environment Variables

`frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

`backend/.env`:
```env
POSTGRES_DB=urban_heat
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Never commit real credentials — both `.env` files are git-ignored; only `.env.example` (placeholder values) is committed. Full variable reference, including one documented dead/unused variable: [docs/API_DOCUMENTATION.md §Environment Variables](docs/API_DOCUMENTATION.md#environment-variables-reference).

## 7. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/location-search` | Campus-bounded place search |
| POST | `/api/predict-heat` | Raw ML prediction from 6 inputs |
| GET | `/api/heatmap` | Seeded heat data points |
| POST | `/api/location-heat-detail` | Full detail card for a coordinate |
| GET | `/api/heat-trend` | Model-driven hourly heat-risk curve |
| GET | `/api/recommendations` | Mitigation recommendations |
| POST | `/api/recommend-route` | Fastest / Coolest / Balanced route comparison |
| POST | `/api/route-heat` | Heat analysis of a custom coordinate path |

Full request/response schemas and verified live examples: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

## 8. Route Optimization — In Brief

Real algorithm (verified from source, **not** a generic "shortest + 20% detour" model):

```text
Snap start/end → OSRM route alternatives → keep only alternatives
whose full geometry stays inside the campus boundary → sample up to
16 points/route → score heat risk per point (ML model) → aggregate
per route → label Fastest / Coolest / Balanced → recommend Coolest
```

Balanced route score: `0.50 × (avg heat risk / 100) + 0.25 × (distance / max distance) + 0.25 × (duration / max duration)`, normalized against the candidates in that request only.

Full step-by-step derivation, the exact heat formula, and a worked example from live testing: [docs/ROUTE_OPTIMIZATION.md](docs/ROUTE_OPTIMIZATION.md).

## 9. Documentation Index

| Document | Covers |
|---|---|
| [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md) | Full project report: abstract, objectives, comparison table, implemented vs. planned |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System/frontend/backend architecture, file-by-file reference, diagrams |
| [docs/ROUTE_OPTIMIZATION.md](docs/ROUTE_OPTIMIZATION.md) | The exact routing & scoring algorithm |
| [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | Every endpoint, request/response shapes, error cases |
| [docs/DATA_AND_ENVIRONMENTAL_ANALYSIS.md](docs/DATA_AND_ENVIRONMENTAL_ANALYSIS.md) | Data sources, the ML model, real vs. synthetic data — the most important read before presenting this project |
| [docs/VIVA_QA.md](docs/VIVA_QA.md) | 30 rehearsed viva/review questions with code-verified answers |

## 10. Known Limitations (see docs for full detail)

- Heat data is formula-generated/synthetic, not satellite- or sensor-derived.
- The committed `urban_heat.db` predates the current seed script and only sparsely covers the campus box — re-run `scripts/seed_heat_data.py` to regenerate a dense, in-bounds dataset.
- Routing depends on a public, unauthenticated OSRM server with no SLA.
- No authentication, rate limiting, or automated tests exist yet.

## 11. Future Enhancements

- Real satellite NDVI / land-surface-temperature data in place of the anchor-distance formula.
- Self-hosted OSRM instance for routing reliability.
- Air quality and safety-aware routing.
- Automated test suite.
- Unify the backend (Python) and frontend (JS) heat-risk formulas into one source of truth.
