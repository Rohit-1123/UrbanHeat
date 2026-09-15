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

        print("🌍 Generating realistic spatial heat data for SRM Kattankulathur / Chennai region...")
        
        # Grid parameters centered on SRM University / Kattankulathur (12.823, 80.045)
        min_lat, max_lat = 12.780, 12.870
        min_lon, max_lon = 80.000, 80.090

        lat_steps = np.linspace(min_lat, max_lat, 16)
        lon_steps = np.linspace(min_lon, max_lon, 16)

        heat_points = []
        random.seed(42)
        np.random.seed(42)

        for lat in lat_steps:
            for lon in lon_steps:
                # Add slight spatial jitter
                lat_j = round(lat + random.uniform(-0.001, 0.001), 6)
                lon_j = round(lon + random.uniform(-0.001, 0.001), 6)

                # Distance from urban center (SRM Main Gate / GST Road ~ 12.823, 80.045)
                dist_from_urban = np.sqrt((lat_j - 12.823)**2 + (lon_j - 80.045)**2)
                
                # Distance from lake / green park area (~ 12.815, 80.030)
                dist_from_green = np.sqrt((lat_j - 12.815)**2 + (lon_j - 80.030)**2)

                # High building density near urban center
                building_density = round(float(np.clip(0.85 - dist_from_urban * 8.0 + random.uniform(-0.1, 0.1), 0.1, 0.95)), 2)
                
                # High vegetation near green area / lake
                vegetation_index = round(float(np.clip(0.80 - dist_from_green * 7.0 + random.uniform(-0.1, 0.1), 0.05, 0.90)), 2)
                
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
