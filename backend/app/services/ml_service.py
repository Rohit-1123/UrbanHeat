import sys
import logging
from ml.predict import predict_heat_risk, get_loaded_model

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

logger = logging.getLogger(__name__)

class MLService:
    def __init__(self):
        self.model_loaded = False

    def load_model(self):
        model = get_loaded_model()
        if model is not None:
            self.model_loaded = True
            logger.info("ML Heat Risk Prediction Model initialized successfully.")
        else:
            logger.warning("ML Model file not found or failed to load. Using analytical prediction fallback.")

    def predict(
        self,
        temperature: float,
        humidity: float,
        uv_index: float,
        vegetation_index: float,
        building_density: float,
        shade_score: float
    ):
        return predict_heat_risk(
            temperature=temperature,
            humidity=humidity,
            uv_index=uv_index,
            vegetation_index=vegetation_index,
            building_density=building_density,
            shade_score=shade_score
        )

ml_service = MLService()
