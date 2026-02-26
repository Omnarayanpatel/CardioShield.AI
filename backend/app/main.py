from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
import numpy as np

from .database import SessionLocal, engine
from .schemas import PatientData, PatientCreate
from .model_loader import load_model
from .auth import router as auth_router, get_current_user, get_current_admin
from . import models

# ==============================
# App Setup
# ==============================

app = FastAPI()
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

model, scaler = load_model()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# ==============================
# DB Dependency
# ==============================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==============================
# REGISTER
# ==============================

@app.post("/register")
def register(data: PatientCreate, db: Session = Depends(get_db)):

    existing_user = db.query(models.Patient)\
        .filter(models.Patient.email == data.email)\
        .first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(data.password[:72])

    new_user = models.Patient(
        name=data.name,
        email=data.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Registration successful"}

# ==============================
# PREDICT (Protected)
# ==============================

@app.post("/predict")
def predict(
    data: PatientData,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Feature Engineering
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

    probability = model.predict_proba(input_data)[0][1]

    threshold = 0.40 if age_years < 50 else 0.50
    predicted_label = 1 if probability >= threshold else 0

    if probability < 0.30:
        category_label = "Low"
        category_code = 0
    elif probability < 0.70:
        category_label = "Moderate"
        category_code = 1
    else:
        category_label = "High"
        category_code = 2

    if probability >= 0.70:
        recommendation = "High cardiovascular risk detected. Immediate consultation recommended."
    elif probability >= 0.40:
        recommendation = "Moderate cardiovascular risk. Lifestyle modification advised."
    else:
        recommendation = "Low cardiovascular risk. Maintain healthy habits."

    # Save to DB (linked to logged user)
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
        risk_category=category_code,
        user_email=current_user
    )

    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    return {
        "risk_probability": float(probability),
        "risk_category": category_label,
        "cardio": predicted_label,
        "recommendation": recommendation
    }
@app.get("/admin/users")
def get_all_users(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return db.query(models.Patient).all()


@app.get("/admin/predictions")
def get_all_predictions(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return db.query(models.Prediction).all()
# ==============================
# HISTORY (Per User)
# ==============================

@app.get("/history")
def get_history(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    records = db.query(models.Prediction)\
        .filter(models.Prediction.user_email == current_user)\
        .all()

    return records