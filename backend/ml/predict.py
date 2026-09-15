import os
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "heat_risk_model.joblib")

_model = None

def get_loaded_model():
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            try:
                _model = joblib.load(MODEL_PATH)
            except Exception as e:
                print(f"⚠️ Error loading model from {MODEL_PATH}: {e}")
                _model = None
    return _model

def classify_risk_level(score: float) -> str:
    if score <= 25.0:
        return "Low"
    elif score <= 50.0:
        return "Moderate"
    elif score <= 75.0:
        return "High"
    else:
        return "Extreme"

def predict_heat_risk(
    temperature: float,
    humidity: float,
    uv_index: float,
    vegetation_index: float,
    building_density: float,
    shade_score: float
) -> tuple[float, str]:
    """
    Predicts Heat Risk Score (0 - 100) and returns (predicted_heat_risk, risk_level).
    Uses joblib model if available, otherwise falls back to exact analytical formula.
    """
    model = get_loaded_model()
    features = np.array([[temperature, humidity, uv_index, vegetation_index, building_density, shade_score]])

    if model is not None:
        try:
            pred = float(model.predict(features)[0])
            score = float(np.clip(pred, 0.0, 100.0))
            return score, classify_risk_level(score)
        except Exception as e:
            print(f"⚠️ Prediction inference error: {e}. Falling back to analytical formula.")

    # Analytical fallback formula
    temp_factor = np.clip((temperature - 25.0) / 20.0, 0, 1) * 35.0
    hum_factor = np.clip((humidity - 30.0) / 60.0, 0, 1) * 15.0
    uv_factor = np.clip(uv_index / 12.0, 0, 1) * 20.0
    bld_factor = np.clip(building_density, 0, 1) * 30.0
    veg_factor = np.clip(vegetation_index, 0, 1) * 25.0
    shade_factor = np.clip(shade_score, 0, 1) * 25.0

    score = float(np.clip(20.0 + temp_factor + hum_factor + uv_factor + bld_factor - veg_factor - shade_factor, 0.0, 100.0))
    return score, classify_risk_level(score)
