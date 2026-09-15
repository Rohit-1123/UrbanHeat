import os
import sys
import numpy as np
import pandas as pd
import joblib

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def compute_heat_risk(temp, hum, uv, veg, bld, shade, noise=True):
    """
    Calculates Heat Risk Score (0 - 100) based on domain formula:
    Heat Risk = Temp Factor + Humidity Factor + UV Factor + Building Density Factor - Vegetation Factor - Shade Factor
    """
    temp_factor = np.clip((temp - 25.0) / 20.0, 0, 1) * 35.0
    hum_factor = np.clip((hum - 30.0) / 60.0, 0, 1) * 15.0
    uv_factor = np.clip(uv / 12.0, 0, 1) * 20.0
    bld_factor = np.clip(bld, 0, 1) * 30.0
    veg_factor = np.clip(veg, 0, 1) * 25.0
    shade_factor = np.clip(shade, 0, 1) * 25.0

    raw_risk = (temp_factor + hum_factor + uv_factor + bld_factor - veg_factor - shade_factor) + 20.0
    if noise:
        raw_risk += np.random.normal(0, 2.5, size=raw_risk.shape if isinstance(raw_risk, np.ndarray) else 1)
    
    return np.clip(raw_risk, 0.0, 100.0)

def classify_risk_level(score):
    if score <= 25.0:
        return "Low"
    elif score <= 50.0:
        return "Moderate"
    elif score <= 75.0:
        return "High"
    else:
        return "Extreme"

def generate_synthetic_data(num_samples=3000):
    np.random.seed(42)
    temperatures = np.random.uniform(26.0, 44.0, num_samples)
    humidity = np.random.uniform(35.0, 85.0, num_samples)
    uv_index = np.random.uniform(2.0, 11.0, num_samples)
    vegetation_index = np.random.uniform(0.05, 0.95, num_samples)
    building_density = np.random.uniform(0.1, 0.95, num_samples)
    shade_score = np.random.uniform(0.05, 0.90, num_samples)

    heat_risk = compute_heat_risk(
        temperatures, humidity, uv_index, vegetation_index, building_density, shade_score, noise=True
    )

    df = pd.DataFrame({
        "temperature": temperatures,
        "humidity": humidity,
        "uv_index": uv_index,
        "vegetation_index": vegetation_index,
        "building_density": building_density,
        "shade_score": shade_score,
        "heat_risk": heat_risk
    })
    return df

def train_heat_model():
    print("🤖 Generating synthetic environmental heat dataset...")
    df = generate_synthetic_data(num_samples=4000)

    feature_cols = ["temperature", "humidity", "uv_index", "vegetation_index", "building_density", "shade_score"]
    X = df[feature_cols]
    y = df["heat_risk"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Try XGBoost if available, fallback to RandomForestRegressor
    use_xgboost = os.getenv("USE_XGBOOST", "false").lower() == "true"
    model = None

    if use_xgboost:
        try:
            import xgboost as xgb
            print("🚀 Training with XGBoost Regressor...")
            model = xgb.XGBRegressor(n_estimators=150, max_depth=6, learning_rate=0.08, random_state=42)
        except ImportError:
            print("⚠️ XGBoost requested but not installed. Falling back to RandomForestRegressor.")

    if model is None:
        print("🌲 Training with Random Forest Regressor...")
        model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    print("📊 Model Evaluation Metrics:")
    print(f"   Mean Absolute Error (MAE) : {mae:.4f}")
    print(f"   Root Mean Squared Error (RMSE): {rmse:.4f}")

    save_dir = os.path.dirname(__file__)
    os.makedirs(save_dir, exist_ok=True)
    model_path = os.path.join(save_dir, "heat_risk_model.joblib")

    joblib.dump(model, model_path)
    print(f"✅ Successfully trained and saved heat risk model to: {model_path}")

if __name__ == "__main__":
    train_heat_model()
