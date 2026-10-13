from sqlalchemy import Column, Integer, Float, Boolean, String, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    is_correct = Column(Boolean, nullable=False)
    topic = Column(String(40), nullable=False)
    comment = Column(String(500))
    location_name = Column(String(120))
    created_at = Column(DateTime, default=datetime.utcnow)

class HeatData(Base):
    __tablename__ = "heat_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    uv_index = Column(Float, nullable=False)
    vegetation_index = Column(Float, nullable=False)
    building_density = Column(Float, nullable=False)
    shade_score = Column(Float, nullable=False)
    heat_risk = Column(Float, nullable=False, index=True)
    risk_level = Column(String(20), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "uv_index": self.uv_index,
            "vegetation_index": self.vegetation_index,
            "building_density": self.building_density,
            "shade_score": self.shade_score,
            "heat_risk": self.heat_risk,
            "risk_level": self.risk_level,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
