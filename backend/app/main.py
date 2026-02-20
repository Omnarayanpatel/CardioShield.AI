from fastapi import FastAPI
import numpy as np
from .schemas import PatientData
from .model_loader import load_model

app = FastAPI()

model, scaler = load_model()

@app.post("/predict")
def predict(data: PatientData):

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
        category = "Low Risk"
    elif probability < 0.7:
        category = "Moderate Risk"
    else:
        category = "High Risk"

    return {
        "risk_probability": float(probability),
        "risk_category": category
    }