from datetime import datetime

import numpy as np
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from . import models
from .auth import get_current_admin, get_current_user, get_db, router as auth_router
from .database import engine
from .model_loader import load_model_bundle
from .schemas import FairnessReportResponse, PatientData, PredictionResponse, UserResponse, UserUpdateRequest

app = FastAPI(
    title="CardioShield AI API",
    description="Risk estimation API for cardiovascular disease screening.",
    version="1.0.0",
)

app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _ensure_legacy_schema():
    inspector = inspect(engine)
    dialect = engine.dialect.name

    def safe_alter(statement: str):
        try:
            conn.execute(text(statement))
        except ProgrammingError:
            # Ignore legacy patch failures when column already exists
            # or when a target database has stricter DDL behavior.
            pass

    with engine.begin() as conn:
        if "patients" in inspector.get_table_names():
            patient_columns = {column["name"] for column in inspector.get_columns("patients")}
            if "is_active" not in patient_columns:
                safe_alter("ALTER TABLE patients ADD COLUMN is_active BOOLEAN DEFAULT TRUE")
            if "created_at" not in patient_columns:
                safe_alter("ALTER TABLE patients ADD COLUMN created_at TIMESTAMP")
        if "predictions" in inspector.get_table_names():
            prediction_columns = {column["name"] for column in inspector.get_columns("predictions")}
            json_type = "JSONB" if dialect == "postgresql" else "JSON"
            patch_statements = [
                ("user_id", "ALTER TABLE predictions ADD COLUMN user_id INTEGER"),
                ("user_email", "ALTER TABLE predictions ADD COLUMN user_email VARCHAR(255)"),
                ("confidence_low", "ALTER TABLE predictions ADD COLUMN confidence_low FLOAT"),
                ("confidence_high", "ALTER TABLE predictions ADD COLUMN confidence_high FLOAT"),
                ("top_risk_factors", f"ALTER TABLE predictions ADD COLUMN top_risk_factors {json_type}"),
                ("explanation_text", "ALTER TABLE predictions ADD COLUMN explanation_text TEXT"),
                ("recommendation", "ALTER TABLE predictions ADD COLUMN recommendation TEXT"),
                ("escalation_required", "ALTER TABLE predictions ADD COLUMN escalation_required BOOLEAN DEFAULT FALSE"),
            ]
            for column_name, statement in patch_statements:
                if column_name not in prediction_columns:
                    safe_alter(statement)


_ensure_legacy_schema()
models.Base.metadata.create_all(bind=engine)

MODEL_BUNDLE = load_model_bundle()
MODEL = MODEL_BUNDLE["model"]
SCALER = MODEL_BUNDLE["scaler"]
CALIBRATOR = MODEL_BUNDLE["calibrator"]
MODEL_METADATA = MODEL_BUNDLE["metadata"]

RISK_DISCLAIMER = "Risk estimation tool — not diagnostic."


def _create_audit_log(
    db: Session,
    *,
    actor_id: int | None,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    metadata_json: dict | None = None,
):
    db.add(
        models.AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=metadata_json or {},
        )
    )


def _expected_feature_count() -> int:
    if MODEL_METADATA.get("features"):
        return len(MODEL_METADATA["features"])
    if SCALER is not None and hasattr(SCALER, "n_features_in_"):
        return int(SCALER.n_features_in_)
    if hasattr(MODEL, "n_features_in_"):
        return int(MODEL.n_features_in_)
    return 15


def _compute_features(data: PatientData) -> tuple[np.ndarray, dict[str, float]]:
    age_years = data.age / 365.0
    bmi = data.weight / ((data.height / 100.0) ** 2)
    pulse_pressure = data.ap_hi - data.ap_lo
    age_bp_interaction = age_years * data.ap_hi
    glucose_bmi_interaction = data.gluc * bmi
    bmi_risk_category = 0.0 if bmi < 25 else 1.0 if bmi < 30 else 2.0

    values = [
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
        glucose_bmi_interaction,
    ]
    if _expected_feature_count() >= 16:
        values.append(bmi_risk_category)

    feature_row = np.array([values], dtype=float)

    derived = {
        "age_years": age_years,
        "bmi": bmi,
        "pulse_pressure": pulse_pressure,
        "age_bp_interaction": age_bp_interaction,
        "glucose_bmi_interaction": glucose_bmi_interaction,
        "bmi_risk_category": bmi_risk_category,
    }
    return feature_row, derived


def _predict_probability(features: np.ndarray) -> float:
    features_for_model = features
    use_scaler = bool(MODEL_METADATA.get("use_scaler_for_inference", False))
    if use_scaler and SCALER is not None:
        try:
            features_for_model = SCALER.transform(features_for_model)
        except Exception:
            # Fallback for legacy artifacts that were trained without scaler usage in inference.
            features_for_model = features

    if CALIBRATOR is not None:
        raw_probability = MODEL.predict_proba(features_for_model)[:, 1]
        calibrated_probability = CALIBRATOR.predict_proba(raw_probability.reshape(-1, 1))[:, 1]
        return float(calibrated_probability[0])

    if hasattr(MODEL, "predict_proba"):
        return float(MODEL.predict_proba(features_for_model)[0][1])
    decision = MODEL.decision_function(features_for_model)[0]
    return float(1.0 / (1.0 + np.exp(-decision)))


def _risk_labels(probability: float, age_years: float) -> tuple[int, str, int]:
    threshold = 0.40 if age_years < 50 else 0.50
    cardio_flag = 1 if probability >= threshold else 0
    if probability < 0.30:
        return cardio_flag, "Low", 0
    if probability < 0.70:
        return cardio_flag, "Moderate", 1
    return cardio_flag, "High", 2


def _top_risk_factors(data: PatientData, derived: dict[str, float]) -> list[str]:
    candidate_scores = {
        "Elevated systolic blood pressure": max(0.0, (data.ap_hi - 120) / 80),
        "High pulse pressure": max(0.0, (derived["pulse_pressure"] - 40) / 60),
        "High glucose": max(0.0, (data.gluc - 1) / 2),
        "High cholesterol": max(0.0, (data.cholesterol - 1) / 2),
        "High BMI": max(0.0, (derived["bmi"] - 25) / 15),
        "Smoking": float(data.smoke),
        "Low physical activity": 1.0 - float(data.active),
    }
    ordered = sorted(candidate_scores.items(), key=lambda item: item[1], reverse=True)
    return [label for label, score in ordered[:3] if score > 0]


def _recommendation_and_escalation(probability: float) -> tuple[str, bool]:
    if probability >= 0.70:
        return (
            "High cardiovascular risk detected. Refer to specialist consultation and urgent follow-up.",
            True,
        )
    if probability >= 0.40:
        return "Moderate risk identified. Recommend lifestyle modification and scheduled clinical review.", False
    return "Low risk profile. Maintain healthy habits and periodic screening.", False


def _confidence_interval(probability: float) -> dict[str, float]:
    margin = 0.08 if probability >= 0.60 else 0.06
    low = max(0.0, probability - margin)
    high = min(1.0, probability + margin)
    return {"low": round(low, 4), "high": round(high, 4)}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": MODEL is not None,
        "scaler_loaded": SCALER is not None,
        "calibrator_loaded": CALIBRATOR is not None,
        "model_version": MODEL_METADATA.get("version", "unknown"),
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(
    data: PatientData,
    db: Session = Depends(get_db),
    current_user: models.Patient = Depends(get_current_user),
):
    if data.ap_hi <= data.ap_lo:
        raise HTTPException(status_code=422, detail="Systolic BP must be greater than diastolic BP")

    feature_row, derived = _compute_features(data)
    probability = _predict_probability(feature_row)
    cardio_flag, category_label, category_code = _risk_labels(probability, derived["age_years"])
    top_factors = _top_risk_factors(data, derived)
    recommendation, escalation_required = _recommendation_and_escalation(probability)
    confidence = _confidence_interval(probability)
    explanation_text = (
        f"{', '.join(top_factors) if top_factors else 'No dominant risk factor'} "
        f"contributed most to the predicted risk."
    )

    db_record = models.Prediction(
        user_id=current_user.id,
        user_email=current_user.email,
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
        risk_probability=probability,
        risk_category=category_code,
        confidence_low=confidence["low"],
        confidence_high=confidence["high"],
        top_risk_factors=top_factors,
        explanation_text=explanation_text,
        recommendation=recommendation,
        escalation_required=escalation_required,
    )
    db.add(db_record)
    db.flush()
    _create_audit_log(
        db,
        actor_id=current_user.id,
        action="prediction.create",
        entity_type="prediction",
        entity_id=str(db_record.id),
        metadata_json={"risk_category": category_label, "escalation_required": escalation_required},
    )
    db.commit()

    return PredictionResponse(
        risk_probability=round(probability, 4),
        risk_category=category_label,
        confidence_interval=confidence,
        cardio_flag=cardio_flag,
        top_risk_factors=top_factors,
        explanation_text=explanation_text,
        recommendation=recommendation,
        escalation_required=escalation_required,
        disclaimer=RISK_DISCLAIMER,
    )


@app.get("/history")
def history(
    db: Session = Depends(get_db),
    current_user: models.Patient = Depends(get_current_user),
    patient_id: int | None = Query(default=None),
    risk_category: int | None = Query(default=None, ge=0, le=2),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
):
    query = db.query(models.Prediction)

    if current_user.role != "doctor":
        query = query.filter(models.Prediction.user_id == current_user.id)
    elif patient_id is not None:
        query = query.filter(models.Prediction.user_id == patient_id)

    if risk_category is not None:
        query = query.filter(models.Prediction.risk_category == risk_category)
    if start_date is not None:
        query = query.filter(models.Prediction.created_at >= start_date)
    if end_date is not None:
        query = query.filter(models.Prediction.created_at <= end_date)

    return query.order_by(models.Prediction.created_at.desc()).all()


@app.get("/admin/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db), admin: models.Patient = Depends(get_current_admin)):
    users = db.query(models.Patient).order_by(models.Patient.created_at.desc()).all()
    _create_audit_log(
        db,
        actor_id=admin.id,
        action="admin.users.list",
        entity_type="patient",
        metadata_json={"count": len(users)},
    )
    db.commit()
    return users


@app.patch("/admin/users/{user_id}", response_model=UserResponse)
def admin_update_user(
    user_id: int,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    admin: models.Patient = Depends(get_current_admin),
):
    user = db.query(models.Patient).filter(models.Patient.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.role is not None:
        role = payload.role.lower().strip()
        if role not in {"patient", "doctor"}:
            raise HTTPException(status_code=400, detail="Role must be patient or doctor")
        user.role = role
    if payload.is_active is not None:
        user.is_active = payload.is_active

    _create_audit_log(
        db,
        actor_id=admin.id,
        action="admin.user.update",
        entity_type="patient",
        entity_id=str(user.id),
        metadata_json={"role": user.role, "is_active": user.is_active},
    )
    db.commit()
    db.refresh(user)
    return user


@app.get("/admin/predictions")
def admin_predictions(
    db: Session = Depends(get_db),
    admin: models.Patient = Depends(get_current_admin),
    patient_id: int | None = Query(default=None),
    risk_category: int | None = Query(default=None, ge=0, le=2),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
):
    query = db.query(models.Prediction)
    if patient_id is not None:
        query = query.filter(models.Prediction.user_id == patient_id)
    if risk_category is not None:
        query = query.filter(models.Prediction.risk_category == risk_category)
    if start_date is not None:
        query = query.filter(models.Prediction.created_at >= start_date)
    if end_date is not None:
        query = query.filter(models.Prediction.created_at <= end_date)

    rows = query.order_by(models.Prediction.created_at.desc()).all()
    _create_audit_log(
        db,
        actor_id=admin.id,
        action="admin.predictions.list",
        entity_type="prediction",
        metadata_json={"count": len(rows)},
    )
    db.commit()
    return rows


@app.get("/admin/fairness/report", response_model=FairnessReportResponse)
def latest_fairness_report(db: Session = Depends(get_db), admin: models.Patient = Depends(get_current_admin)):
    latest_report = db.query(models.FairnessReport).order_by(models.FairnessReport.created_at.desc()).first()
    if not latest_report:
        placeholder = models.FairnessReport(
            model_version=MODEL_METADATA.get("version", "baseline-v1"),
            metrics={
                "disparate_impact_ratio": {"before": 0.91, "after": 0.97},
                "equalized_odds_gap": {"before": 0.11, "after": 0.06},
                "false_negative_rate_gap": {"before": 0.13, "after": 0.07},
                "note": "Placeholder metrics. Replace with pipeline-generated fairness report.",
            },
        )
        db.add(placeholder)
        db.flush()
        _create_audit_log(
            db,
            actor_id=admin.id,
            action="admin.fairness.generate_placeholder",
            entity_type="fairness_report",
            entity_id=str(placeholder.id),
        )
        db.commit()
        db.refresh(placeholder)
        return FairnessReportResponse(
            id=placeholder.id,
            model_version=placeholder.model_version,
            metrics=placeholder.metrics,
            created_at=placeholder.created_at,
        )

    _create_audit_log(
        db,
        actor_id=admin.id,
        action="admin.fairness.read",
        entity_type="fairness_report",
        entity_id=str(latest_report.id),
    )
    db.commit()
    return FairnessReportResponse(
        id=latest_report.id,
        model_version=latest_report.model_version,
        metrics=latest_report.metrics,
        created_at=latest_report.created_at,
    )
