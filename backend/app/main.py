import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure root backend directory is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.connection import init_db
from app.services.ml_service import ml_service
from app.api.heat import router as heat_router
from app.api.routes import router as routes_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("🚀 Initializing Urban Heat System Backend...")
    try:
        init_db()
    except Exception as e:
        print(f"⚠️ Database initialization warning: {e}")
    
    # Load ML Model once at startup
    ml_service.load_model()
    
    yield
    # Shutdown logic
    print("🛑 Shutting down Urban Heat Backend...")

app = FastAPI(
    title="Urban Heat Risk Prediction & Cool-Route Recommendation API",
    description="Smart Routes. Cooler Future.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(heat_router)
app.include_router(routes_router)

@app.get("/health", tags=["Health"])
def health_check():
    """Returns the operational health status of the API service."""
    return {"status": "running", "service": "Urban Heat Risk Prediction API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
