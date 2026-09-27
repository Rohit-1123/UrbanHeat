import os
import sys
import random
import numpy as np
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.connection import SessionLocal, init_db
from app.database.models import HeatData
from ml.predict import classify_risk_level

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

        print("🌍 Generating realistic spatial heat data for the SRM Kattankulathur campus...")

        # Grid parameters covering the actual campus area the app displays and
        # routes within (see SRM_CAMPUS_BOUNDS in app/services/campus_config.py).
        # Earlier this grid spanned a much wider 10km-square "Chennai region" at
        # ~666m spacing, so only ~4 of 256 points ever landed inside the tight
        # campus box the frontend/backend actually query against. Match the grid
        # to the real display area instead so it's densely covered.
        min_lat, max_lat = 12.8188, 12.8280
        min_lon, max_lon = 80.0372, 80.0516

        lat_steps = np.linspace(min_lat, max_lat, 16)
        lon_steps = np.linspace(min_lon, max_lon, 16)

        heat_points = []
        random.seed(42)
        np.random.seed(42)

        for lat in lat_steps:
            for lon in lon_steps:
                # Add slight spatial jitter (scaled down to fit the smaller grid spacing)
                lat_j = round(lat + random.uniform(-0.0002, 0.0002), 6)
                lon_j = round(lon + random.uniform(-0.0003, 0.0003), 6)

                # Distance from the dense academic/tech-park core (~12.823, 80.045)
                dist_from_urban = np.sqrt((lat_j - 12.823)**2 + (lon_j - 80.045)**2)

                # Distance from the sports complex / cricket ground green belt (~12.8255, 80.0470)
                dist_from_green = np.sqrt((lat_j - 12.8255)**2 + (lon_j - 80.0470)**2)

                # High building density near the academic/tech-park core.
                # Multiplier rescaled for the campus-sized grid (~0.017 deg diagonal,
                # vs. the ~0.13 deg diagonal this formula was originally tuned for).
                building_density = round(float(np.clip(0.85 - dist_from_urban * 45.0 + random.uniform(-0.1, 0.1), 0.1, 0.95)), 2)

                # High vegetation near the sports complex green belt
                vegetation_index = round(float(np.clip(0.80 - dist_from_green * 44.0 + random.uniform(-0.1, 0.1), 0.05, 0.90)), 2)
                
                shade_score = round(float(np.clip(vegetation_index * 0.7 + random.uniform(-0.05, 0.15), 0.05, 0.85)), 2)
                
                # Environmental variations
                temperature = round(float(32.0 + building_density * 6.0 - vegetation_index * 3.5 + random.uniform(-1.0, 1.0)), 1)
                humidity = round(float(55.0 + random.uniform(-10.0, 15.0)), 1)
                uv_index = round(float(7.5 + building_density * 2.0 - shade_score * 1.5 + random.uniform(-0.5, 0.5)), 1)

                heat_risk = calculate_seed_heat_risk(
                    temperature, humidity, uv_index, vegetation_index, building_density, shade_score
                )
                risk_level = classify_risk_level(heat_risk)

                point = HeatData(
                    latitude=lat_j,
                    longitude=lon_j,
                    temperature=temperature,
                    humidity=humidity,
                    uv_index=uv_index,
                    vegetation_index=vegetation_index,
                    building_density=building_density,
                    shade_score=shade_score,
                    heat_risk=heat_risk,
                    risk_level=risk_level,
                    timestamp=datetime.utcnow()
                )
                heat_points.append(point)

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
