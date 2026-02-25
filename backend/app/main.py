from fastapi import FastAPI, Depends,HTTPException
import numpy as np
from sqlalchemy.orm import Session

from .schemas import PatientData
from .schemas import PatientCreate  # new added
from .model_loader import load_model
from .database import SessionLocal, engine
from . import models
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # frontend url
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create DB tables
models.Base.metadata.create_all(bind=engine)

model, scaler = load_model()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/predict")
def predict(data: PatientData, db: Session = Depends(get_db)):


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

    if probability < 0.3:
        category = 0
    elif probability < 0.7:
        category = 1
    else:
        category = 2

    # Save to DB
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
        risk_category=category
    )

    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    

    return {
        "risk_probability": float(probability),
        "risk_category": category
    }

@app.post("/register")
def register(data: PatientCreate, db: Session = Depends(get_db)):
    
    # Check if user exists
    existing_user = db.query(models.Patient).filter(models.Patient.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = pwd_context.hash(data.password[:72])

    # Create user
    new_user = models.Patient(
        name=data.name,
        email=data.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Registration successful"}
@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    records = db.query(models.Prediction).all()
    return records