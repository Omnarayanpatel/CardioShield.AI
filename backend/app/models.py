 # DB tables

from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.sql import func
from .database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    age = Column(Float)
    gender = Column(Integer)
    height = Column(Float)
    weight = Column(Float)
    ap_hi = Column(Integer)
    ap_lo = Column(Integer)
    cholesterol = Column(Integer)
    gluc = Column(Integer)
    smoke = Column(Integer)
    alco = Column(Integer)
    active = Column(Integer)

    risk_probability = Column(Float)
    risk_category = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())