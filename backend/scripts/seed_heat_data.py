import json
import os
import sys
import numpy as np
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.connection import SessionLocal, init_db
from app.database.models import HeatData
from ml.predict import classify_risk_level

MEASURED_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "measured_points.json")

LST_WEIGHT = 0.5

def calculate_seed_heat_risk(temp, hum, uv, veg, bld, shade):
    temp_factor = max(0.0, min(1.0, (temp - 25.0) / 20.0)) * 35.0
    hum_factor = max(0.0, min(1.0, (hum - 30.0) / 60.0)) * 15.0
    uv_factor = max(0.0, min(1.0, uv / 12.0)) * 20.0
    bld_factor = max(0.0, min(1.0, bld)) * 30.0
    veg_factor = max(0.0, min(1.0, veg)) * 25.0
    shade_factor = max(0.0, min(1.0, shade)) * 25.0

    score = 20.0 + temp_factor + hum_factor + uv_factor + bld_factor - veg_factor - shade_factor
    score = float(np.clip(score, 0.0, 100.0))
    return round(score, 2)

def seed_database():
    print("🌱 Initializing database schema...")
    init_db()

    db = SessionLocal()
    try:
        # Check existing count
        existing_count = db.query(HeatData).count()
        if existing_count > 0:
            print(f"ℹ️ Database already contains {existing_count} heat data records. Clearing existing records to re-seed...")
            db.query(HeatData).delete()
            db.commit()

        print("Loading measured satellite/weather cells (run scripts/fetch_measured_heat.py to refresh)...")
        with open(MEASURED_PATH, encoding="utf-8") as f:
            cells = json.load(f)["points"]

        # Air temperature is one value per ~10 km weather cell; Landsat surface temperature
        # varies per 1 km cell. Add the cell's surface-temp anomaly within its area, scaled by
        # LST_WEIGHT, so hotter pavement raises that cell's temperature and cooler parkland lowers it.
        # ponytail: LST_WEIGHT is an uncalibrated knob; tune against ground-station data if available.
        by_area = {}
        for c in cells:
            by_area.setdefault(c["area"], []).append(c["surface_temp_c"])
        area_lst = {a: sum(v) / len(v) for a, v in by_area.items()}

        heat_points = []
        for c in cells:
            c["temperature"] = round(c["temperature"] + LST_WEIGHT * (c["surface_temp_c"] - area_lst[c["area"]]), 1)
            heat_risk = calculate_seed_heat_risk(
                c["temperature"], c["humidity"], c["uv_index"], c["vegetation_index"], c["building_density"], c["shade_score"]
            )
            heat_points.append(HeatData(
                latitude=c["latitude"], longitude=c["longitude"], temperature=c["temperature"], humidity=c["humidity"],
                uv_index=c["uv_index"], vegetation_index=c["vegetation_index"], building_density=c["building_density"],
                shade_score=c["shade_score"], heat_risk=heat_risk, risk_level=classify_risk_level(heat_risk),
                timestamp=datetime.utcnow(),
            ))

        db.bulk_save_objects(heat_points)
        db.commit()
        print(f"✅ Successfully seeded {len(heat_points)} environmental heat records into heat_data table.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
