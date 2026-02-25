from fastapi import FastAPI, Depends
import numpy as np
from sqlalchemy.orm import Session

from .schemas import PatientData
from .model_loader import load_model
from .database import SessionLocal, engine
from . import models
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend url
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables
models.Base.metadata.create_all(bind=engine)

model, scaler = load_model()

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
@app.get("/predictions")
def get_predictions(db: Session = Depends(get_db)):
    records = db.query(models.Prediction).all()
    return records



@app.post("/predict")
def predict(data: PatientData, db: Session = Depends(get_db)):

    # ==============================
    # Feature Engineering
    # ==============================

    age_years = data.age / 365
    bmi = data.weight / ((data.height / 100) ** 2)
    pulse_pressure = data.ap_hi - data.ap_lo
    age_bp_interaction = age_years * data.ap_hi
    glucose_bmi_interaction = data.gluc * bmi

    input_data = np.array([[ 
        age_years,
        data.gender,
        data.height,
        data.weight,
        data.ap_hi,
        data.ap_lo,
        data.cholesterol,
        data.gluc,
        data.smoke,
        data.alco,
        data.active,
        bmi,
        pulse_pressure,
        age_bp_interaction,
        glucose_bmi_interaction
    ]])

    # ==============================
    # Get Probability
    # ==============================

    probability = model.predict_proba(input_data)[0][1]

    # ==============================
    # AGE-BASED THRESHOLD MITIGATION
    # ==============================

    if age_years < 50:
        threshold = 0.40
    else:
        threshold = 0.50

    predicted_label = 1 if probability >= threshold else 0

    # ==============================
    # Risk Category Mapping
    # ==============================

    if probability < 0.30:
        category_label = "Low"
        category_code = 0
    elif probability < 0.70:
        category_label = "Moderate"
        category_code = 1
    else:
        category_label = "High"
        category_code = 2

    # ==============================
    # Ethical Escalation Logic
    # ==============================

    if probability >= 0.70:
        recommendation = "High cardiovascular risk detected. Immediate consultation with a cardiologist is strongly recommended."
    elif probability >= 0.40:
        recommendation = "Moderate cardiovascular risk. Lifestyle modification and periodic medical evaluation advised."
    else:
        recommendation = "Low cardiovascular risk. Maintain a healthy lifestyle and regular check-ups."

    # ==============================
    # Save to DB (Audit Logging)
    # ==============================

    db_record = models.Prediction(
        age=data.age,
        gender=data.gender,
        height=data.height,
        weight=data.weight,
        ap_hi=data.ap_hi,
        ap_lo=data.ap_lo,
        cholesterol=data.cholesterol,
        gluc=data.gluc,
        smoke=data.smoke,
        alco=data.alco,
        active=data.active,
        risk_probability=float(probability),
        risk_category=category_code
    )

    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    # ==============================
    # Final Response (Ethical Layer)
    # ==============================

    return {
        "risk_probability": float(probability),
        "risk_category": category_label,
        "recommendation": recommendation,
        "disclaimer": "This is a cardiovascular risk estimation tool and not a medical diagnosis. Clinical decisions should be made by a licensed healthcare professional."
    }