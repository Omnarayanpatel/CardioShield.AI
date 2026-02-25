# CardioShield AI
AI-Powered Cardiovascular Risk Prediction System

---

##  Overview

CardioShield AI is a machine learning-based cardiovascular risk prediction system designed to provide accurate, explainable, and fair risk assessments.

The system integrates:
- Advanced ML models
- Fairness auditing
- Bias mitigation
- Explainable AI (SHAP)
- FastAPI backend
- PostgreSQL database logging

---

##  Features

- Cardiovascular risk prediction API
- Feature engineering (BMI, Pulse Pressure, Interaction Features)
- Multi-model comparison (Random Forest, XGBoost, LightGBM, Neural Network)
- ROC-AUC based model selection
- Probability calibration (Isotonic Regression)
- SHAP explainability
- Gender & Age fairness audit
- Threshold-based bias mitigation
- Prediction history logging
- REST API integration

---

## System Architecture

Frontend (React/Vite)
⬇
FastAPI Backend
⬇
Calibrated ML Model
⬇
PostgreSQL Database

---

##  ML Pipeline

### Feature Engineering
- BMI
- Pulse Pressure
- Age × BP Interaction
- Glucose × BMI Interaction

### Model Evaluation
- ROC-AUC scoring
- Best model auto-selection
- Calibration applied

### Ethical AI
- Gender fairness evaluation
- Age group fairness evaluation
- Disparate impact ratio calculation
- Threshold-based mitigation applied

---

##  Tech Stack

Backend:
- FastAPI
- SQLAlchemy
- PostgreSQL
- Scikit-learn
- XGBoost
- LightGBM
- SHAP

Frontend:
- React + Vite
- Axios

---

##  Setup Instructions

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload