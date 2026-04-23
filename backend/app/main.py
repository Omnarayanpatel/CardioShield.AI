from datetime import datetime
import csv
import io
import json
import secrets

import numpy as np
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import String, cast, inspect, or_, text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from . import models
from .auth import ensure_bootstrap_admin, get_current_admin, get_current_clinician, get_current_user, get_db, pwd_context, router as auth_router
from .database import engine
from .model_loader import load_model_bundle
from .schemas import (
    DoctorPatientCreateRequest,
    DoctorPatientCreateResponse,
    DoctorPatientUpdateRequest,
    FairnessReportResponse,
    PatientData,
    PredictionRecordResponse,
    PredictionResponse,
    UserResponse,
    UserUpdateRequest,
)

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
            if "doctor_id" not in patient_columns:
                safe_alter("ALTER TABLE patients ADD COLUMN doctor_id INTEGER")
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
ensure_bootstrap_admin()

MODEL_BUNDLE = load_model_bundle()
MODEL = MODEL_BUNDLE["model"]
SCALER = MODEL_BUNDLE["scaler"]
CALIBRATOR = MODEL_BUNDLE["calibrator"]
MODEL_METADATA = MODEL_BUNDLE["metadata"]

RISK_DISCLAIMER = "Risk estimation tool — not diagnostic."
COMMON_EMAIL_DOMAIN_TYPOS = {
    "gmil.com",
    "gmial.com",
    "gmai.com",
    "gmail.co",
    "gmail.con",
    "gnail.com",
    "hotnail.com",
    "yaho.com",
    "outlok.com",
}


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


def _validate_email_domain(email: str):
    domain = email.split("@")[-1].lower().strip()
    if domain in COMMON_EMAIL_DOMAIN_TYPOS:
        raise HTTPException(
            status_code=422,
            detail="Email domain looks incorrect. Please check spelling.",
        )


def _format_filename(prefix: str, extension: str) -> str:
    stamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_{stamp}.{extension}"


def _normalize_format(fmt: str) -> str:
    value = fmt.lower().strip()
    if value not in {"csv", "json", "txt"}:
        raise HTTPException(status_code=400, detail="Format must be csv, json, or txt")
    return value


def _rows_to_csv(rows: list[dict]) -> str:
    if not rows:
        return ""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()


def _export_response(*, fmt: str, data: list[dict] | dict, prefix: str) -> Response:
    rows = [data] if isinstance(data, dict) else data
    if fmt == "csv":
        content = _rows_to_csv(rows)
        media_type = "text/csv"
        ext = "csv"
    elif fmt == "txt":
        content = json.dumps(data, indent=2, default=str)
        media_type = "text/plain"
        ext = "txt"
    else:
        content = json.dumps(data, indent=2, default=str)
        media_type = "application/json"
        ext = "json"
    headers = {"Content-Disposition": f'attachment; filename="{_format_filename(prefix, ext)}"'}
    return Response(content=content, media_type=media_type, headers=headers)


def _prediction_to_dict(row: models.Prediction) -> dict:
    return {
        "id": row.id,
        "user_id": row.user_id,
        "user_email": row.user_email,
        "age_days": row.age,
        "gender": row.gender,
        "height_cm": row.height,
        "weight_kg": row.weight,
        "ap_hi": row.ap_hi,
        "ap_lo": row.ap_lo,
        "cholesterol": row.cholesterol,
        "gluc": row.gluc,
        "smoke": row.smoke,
        "alco": row.alco,
        "active": row.active,
        "risk_probability": row.risk_probability,
        "risk_category_code": row.risk_category,
        "confidence_low": row.confidence_low,
        "confidence_high": row.confidence_high,
        "top_risk_factors": ", ".join(row.top_risk_factors or []),
        "explanation_text": row.explanation_text,
        "recommendation": row.recommendation,
        "escalation_required": row.escalation_required,
        "created_at": row.created_at,
    }


def _apply_prediction_search(query, q: str | None):
    if not q or not q.strip():
        return query
    normalized = q.strip().lower()

    # User-friendly direct category filtering.
    if normalized in {"low", "low risk", "low-risk"}:
        return query.filter(models.Prediction.risk_category == 0)
    if normalized in {"moderate", "moderate risk", "medium", "medium risk"}:
        return query.filter(models.Prediction.risk_category == 1)
    if normalized in {"high", "high risk", "high-risk"}:
        return query.filter(models.Prediction.risk_category == 2)

    # User-friendly escalation filter.
    if normalized in {"escalation yes", "escalate", "yes", "true"}:
        return query.filter(models.Prediction.escalation_required.is_(True))
    if normalized in {"escalation no", "no", "false"}:
        return query.filter(models.Prediction.escalation_required.is_(False))

    value = f"%{normalized}%"
    return query.filter(
        or_(
            models.Prediction.user_email.ilike(value),
            cast(models.Prediction.user_id, String).ilike(value),
            cast(models.Prediction.risk_category, String).ilike(value),
            cast(models.Prediction.risk_probability, String).ilike(value),
            cast(models.Prediction.ap_hi, String).ilike(value),
            cast(models.Prediction.ap_lo, String).ilike(value),
            cast(models.Prediction.escalation_required, String).ilike(value),
            cast(models.Prediction.top_risk_factors, String).ilike(value),
            models.Prediction.explanation_text.ilike(value),
            models.Prediction.recommendation.ilike(value),
        )
    )


def _only_valid_predictions(query):
    return query.filter(
        models.Prediction.created_at.is_not(None),
        models.Prediction.user_id.is_not(None),
        models.Prediction.user_email.is_not(None),
        models.Prediction.age.is_not(None),
        models.Prediction.ap_hi.is_not(None),
        models.Prediction.ap_lo.is_not(None),
        models.Prediction.risk_probability.is_not(None),
        models.Prediction.risk_category.is_not(None),
    )


def _doctor_patient_query(db: Session, doctor_id: int):
    return db.query(models.Patient.id).filter(
        models.Patient.role == "patient",
        models.Patient.doctor_id == doctor_id,
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
        prediction_id=db_record.id,
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


@app.get("/history", response_model=list[PredictionRecordResponse])
def history(
    db: Session = Depends(get_db),
    current_user: models.Patient = Depends(get_current_user),
    q: str | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    risk_category: int | None = Query(default=None, ge=0, le=2),
    escalation_required: bool | None = Query(default=None),
    min_probability: float | None = Query(default=None, ge=0, le=1),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
):
    query = _only_valid_predictions(db.query(models.Prediction))

    if current_user.role == "doctor":
        assigned_patients = _doctor_patient_query(db, current_user.id)
        query = query.filter(models.Prediction.user_id.in_(assigned_patients))
        if patient_id is not None:
            query = query.filter(models.Prediction.user_id == patient_id)
    elif current_user.role == "admin":
        if patient_id is not None:
            query = query.filter(models.Prediction.user_id == patient_id)
    else:
        query = query.filter(models.Prediction.user_id == current_user.id)

    if risk_category is not None:
        query = query.filter(models.Prediction.risk_category == risk_category)
    if escalation_required is not None:
        query = query.filter(models.Prediction.escalation_required == escalation_required)
    if min_probability is not None:
        query = query.filter(models.Prediction.risk_probability >= min_probability)
    if start_date is not None:
        query = query.filter(models.Prediction.created_at >= start_date)
    if end_date is not None:
        query = query.filter(models.Prediction.created_at <= end_date)
    query = _apply_prediction_search(query, q)

    rows = query.order_by(models.Prediction.created_at.desc()).all()
    return [PredictionRecordResponse.model_validate(row) for row in rows]


@app.get("/history/export")
def history_export(
    fmt: str = Query(default="csv", alias="format"),
    db: Session = Depends(get_db),
    current_user: models.Patient = Depends(get_current_user),
    q: str | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    risk_category: int | None = Query(default=None, ge=0, le=2),
    escalation_required: bool | None = Query(default=None),
    min_probability: float | None = Query(default=None, ge=0, le=1),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
):
    fmt = _normalize_format(fmt)
    query = _only_valid_predictions(db.query(models.Prediction))
    if current_user.role == "doctor":
        assigned_patients = _doctor_patient_query(db, current_user.id)
        query = query.filter(models.Prediction.user_id.in_(assigned_patients))
        if patient_id is not None:
            query = query.filter(models.Prediction.user_id == patient_id)
    elif current_user.role == "admin":
        if patient_id is not None:
            query = query.filter(models.Prediction.user_id == patient_id)
    else:
        query = query.filter(models.Prediction.user_id == current_user.id)
    if risk_category is not None:
        query = query.filter(models.Prediction.risk_category == risk_category)
    if escalation_required is not None:
        query = query.filter(models.Prediction.escalation_required == escalation_required)
    if min_probability is not None:
        query = query.filter(models.Prediction.risk_probability >= min_probability)
    if start_date is not None:
        query = query.filter(models.Prediction.created_at >= start_date)
    if end_date is not None:
        query = query.filter(models.Prediction.created_at <= end_date)
    query = _apply_prediction_search(query, q)
    rows = query.order_by(models.Prediction.created_at.desc()).all()
    data = [_prediction_to_dict(row) for row in rows]
    return _export_response(fmt=fmt, data=data, prefix="history")


@app.get("/doctor/patients", response_model=list[UserResponse])
def doctor_patients(
    db: Session = Depends(get_db),
    current_user: models.Patient = Depends(get_current_user),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")
    patients = (
        db.query(models.Patient)
        .filter(models.Patient.role == "patient", models.Patient.doctor_id == current_user.id)
        .order_by(models.Patient.created_at.desc())
        .all()
    )
    return [UserResponse.model_validate(patient) for patient in patients]


@app.post("/doctor/patients", response_model=DoctorPatientCreateResponse, status_code=201)
def doctor_create_patient(
    payload: DoctorPatientCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.Patient = Depends(get_current_clinician),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")

    normalized_email = str(payload.email).lower().strip()
    _validate_email_domain(normalized_email)

    existing = db.query(models.Patient).filter(models.Patient.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    raw_password = (payload.password or "").strip() or secrets.token_urlsafe(10)
    patient = models.Patient(
        name=payload.name.strip(),
        email=normalized_email,
        password_hash=pwd_context.hash(raw_password[:72]),
        role="patient",
        doctor_id=current_user.id,
        is_active=True,
    )

    db.add(patient)
    db.flush()
    _create_audit_log(
        db,
        actor_id=current_user.id,
        action="doctor.patient.create",
        entity_type="patient",
        entity_id=str(patient.id),
        metadata_json={"email": patient.email, "doctor_id": current_user.id},
    )
    db.commit()
    db.refresh(patient)

    return DoctorPatientCreateResponse(
        message="Patient account created successfully",
        user=UserResponse.model_validate(patient),
        temporary_password=None if payload.password else raw_password,
    )


@app.patch("/doctor/patients/{patient_id}", response_model=UserResponse)
def doctor_update_patient(
    patient_id: int,
    payload: DoctorPatientUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.Patient = Depends(get_current_clinician),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")

    patient = (
        db.query(models.Patient)
        .filter(
            models.Patient.id == patient_id,
            models.Patient.role == "patient",
            models.Patient.doctor_id == current_user.id,
        )
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if payload.name is not None:
        patient.name = payload.name.strip()
    if payload.email is not None:
        normalized_email = str(payload.email).lower().strip()
        _validate_email_domain(normalized_email)
        existing = (
            db.query(models.Patient)
            .filter(models.Patient.email == normalized_email, models.Patient.id != patient_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        patient.email = normalized_email
    if payload.password is not None and payload.password.strip():
        patient.password_hash = pwd_context.hash(payload.password.strip()[:72])
    if payload.is_active is not None:
        patient.is_active = payload.is_active

    _create_audit_log(
        db,
        actor_id=current_user.id,
        action="doctor.patient.update",
        entity_type="patient",
        entity_id=str(patient.id),
        metadata_json={
            "name": patient.name,
            "email": patient.email,
            "doctor_id": current_user.id,
            "is_active": patient.is_active,
        },
    )
    db.commit()
    db.refresh(patient)
    return UserResponse.model_validate(patient)


@app.delete("/doctor/patients/{patient_id}")
def doctor_delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.Patient = Depends(get_current_clinician),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")

    patient = (
        db.query(models.Patient)
        .filter(
            models.Patient.id == patient_id,
            models.Patient.role == "patient",
            models.Patient.doctor_id == current_user.id,
        )
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.query(models.Prediction).filter(models.Prediction.user_id == patient.id).update(
        {models.Prediction.user_id: None},
        synchronize_session=False,
    )
    db.query(models.AuditLog).filter(models.AuditLog.actor_id == patient.id).update(
        {models.AuditLog.actor_id: None},
        synchronize_session=False,
    )
    _create_audit_log(
        db,
        actor_id=current_user.id,
        action="doctor.patient.delete",
        entity_type="patient",
        entity_id=str(patient.id),
        metadata_json={"email": patient.email, "doctor_id": current_user.id},
    )
    db.delete(patient)
    db.commit()
    return {"message": "Patient deleted successfully", "patient_id": patient_id}


@app.get("/predictions/{prediction_id}/export")
def prediction_export(
    prediction_id: int,
    fmt: str = Query(default="csv", alias="format"),
    db: Session = Depends(get_db),
    current_user: models.Patient = Depends(get_current_user),
):
    fmt = _normalize_format(fmt)
    row = db.query(models.Prediction).filter(models.Prediction.id == prediction_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Prediction not found")
    if current_user.role == "doctor":
        assigned_patients = _doctor_patient_query(db, current_user.id)
        if row.user_id not in {patient_id for (patient_id,) in assigned_patients.all()}:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role != "admin" and row.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return _export_response(fmt=fmt, data=_prediction_to_dict(row), prefix=f"prediction_{prediction_id}")


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


@app.get("/admin/users/export")
def export_users(
    fmt: str = Query(default="csv", alias="format"),
    db: Session = Depends(get_db),
    admin: models.Patient = Depends(get_current_admin),
):
    fmt = _normalize_format(fmt)
    users = db.query(models.Patient).order_by(models.Patient.created_at.desc()).all()
    data = [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
        }
        for user in users
    ]
    _create_audit_log(
        db,
        actor_id=admin.id,
        action="admin.users.export",
        entity_type="patient",
        metadata_json={"count": len(data), "format": fmt},
    )
    db.commit()
    return _export_response(fmt=fmt, data=data, prefix="users")


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
    if payload.name is not None:
        user.name = payload.name.strip()
    if payload.email is not None:
        normalized_email = str(payload.email).lower().strip()
        _validate_email_domain(normalized_email)
        existing = (
            db.query(models.Patient)
            .filter(models.Patient.email == normalized_email, models.Patient.id != user_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = normalized_email
    if payload.role is not None:
        role = payload.role.lower().strip()
        if role not in {"patient", "doctor", "admin"}:
            raise HTTPException(status_code=400, detail="Role must be patient, doctor, or admin")
        user.role = role
        if role != "patient":
            user.doctor_id = None
    if "doctor_id" in payload.model_fields_set:
        if payload.doctor_id is None:
            user.doctor_id = None
        else:
            if user.role != "patient":
                raise HTTPException(status_code=400, detail="Only patients can be assigned to doctors")
            doctor = db.query(models.Patient).filter(models.Patient.id == payload.doctor_id).first()
            if not doctor or doctor.role != "doctor":
                raise HTTPException(status_code=400, detail="Assigned doctor must be a doctor account")
            user.doctor_id = doctor.id
    if payload.is_active is not None:
        if user.role == "admin" and payload.is_active is False:
            raise HTTPException(status_code=400, detail="Admin accounts must remain active")
        user.is_active = payload.is_active

    _create_audit_log(
        db,
        actor_id=admin.id,
        action="admin.user.update",
        entity_type="patient",
        entity_id=str(user.id),
        metadata_json={
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "doctor_id": user.doctor_id,
            "is_active": user.is_active,
        },
    )
    db.commit()
    db.refresh(user)
    return user


@app.delete("/admin/users/{user_id}")
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.Patient = Depends(get_current_admin),
):
    user = db.query(models.Patient).filter(models.Patient.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    db.query(models.Prediction).filter(models.Prediction.user_id == user.id).update(
        {models.Prediction.user_id: None},
        synchronize_session=False,
    )
    db.query(models.Patient).filter(models.Patient.doctor_id == user.id).update(
        {models.Patient.doctor_id: None},
        synchronize_session=False,
    )
    db.query(models.AuditLog).filter(models.AuditLog.actor_id == user.id).update(
        {models.AuditLog.actor_id: None},
        synchronize_session=False,
    )

    _create_audit_log(
        db,
        actor_id=admin.id,
        action="admin.user.delete",
        entity_type="patient",
        entity_id=str(user.id),
        metadata_json={"email": user.email, "role": user.role},
    )
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully", "user_id": user_id}


@app.get("/admin/predictions", response_model=list[PredictionRecordResponse])
def admin_predictions(
    db: Session = Depends(get_db),
    admin: models.Patient = Depends(get_current_admin),
    q: str | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    user_email: str | None = Query(default=None),
    risk_category: int | None = Query(default=None, ge=0, le=2),
    escalation_required: bool | None = Query(default=None),
    min_probability: float | None = Query(default=None, ge=0, le=1),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
):
    query = _only_valid_predictions(db.query(models.Prediction))
    if patient_id is not None:
        query = query.filter(models.Prediction.user_id == patient_id)
    if user_email:
        query = query.filter(models.Prediction.user_email.contains(user_email.strip()))
    if risk_category is not None:
        query = query.filter(models.Prediction.risk_category == risk_category)
    if escalation_required is not None:
        query = query.filter(models.Prediction.escalation_required == escalation_required)
    if min_probability is not None:
        query = query.filter(models.Prediction.risk_probability >= min_probability)
    if start_date is not None:
        query = query.filter(models.Prediction.created_at >= start_date)
    if end_date is not None:
        query = query.filter(models.Prediction.created_at <= end_date)
    query = _apply_prediction_search(query, q)

    rows = query.order_by(models.Prediction.created_at.desc()).all()
    _create_audit_log(
        db,
        actor_id=admin.id,
        action="admin.predictions.list",
        entity_type="prediction",
        metadata_json={"count": len(rows)},
    )
    db.commit()
    return [PredictionRecordResponse.model_validate(row) for row in rows]


@app.get("/admin/predictions/export")
def export_admin_predictions(
    fmt: str = Query(default="csv", alias="format"),
    db: Session = Depends(get_db),
    admin: models.Patient = Depends(get_current_admin),
    q: str | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    user_email: str | None = Query(default=None),
    risk_category: int | None = Query(default=None, ge=0, le=2),
    escalation_required: bool | None = Query(default=None),
    min_probability: float | None = Query(default=None, ge=0, le=1),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
):
    fmt = _normalize_format(fmt)
    query = _only_valid_predictions(db.query(models.Prediction))
    if patient_id is not None:
        query = query.filter(models.Prediction.user_id == patient_id)
    if user_email:
        query = query.filter(models.Prediction.user_email.contains(user_email.strip()))
    if risk_category is not None:
        query = query.filter(models.Prediction.risk_category == risk_category)
    if escalation_required is not None:
        query = query.filter(models.Prediction.escalation_required == escalation_required)
    if min_probability is not None:
        query = query.filter(models.Prediction.risk_probability >= min_probability)
    if start_date is not None:
        query = query.filter(models.Prediction.created_at >= start_date)
    if end_date is not None:
        query = query.filter(models.Prediction.created_at <= end_date)
    query = _apply_prediction_search(query, q)
    rows = query.order_by(models.Prediction.created_at.desc()).all()
    data = [_prediction_to_dict(row) for row in rows]
    _create_audit_log(
        db,
        actor_id=admin.id,
        action="admin.predictions.export",
        entity_type="prediction",
        metadata_json={"count": len(data), "format": fmt},
    )
    db.commit()
    return _export_response(fmt=fmt, data=data, prefix="predictions")


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


@app.get("/admin/fairness/report/export")
def export_fairness_report(
    fmt: str = Query(default="json", alias="format"),
    db: Session = Depends(get_db),
    admin: models.Patient = Depends(get_current_admin),
):
    fmt = _normalize_format(fmt)
    report = db.query(models.FairnessReport).order_by(models.FairnessReport.created_at.desc()).first()
    if not report:
        raise HTTPException(status_code=404, detail="No fairness report available")
    payload = {
        "id": report.id,
        "model_version": report.model_version,
        "metrics": report.metrics,
        "created_at": report.created_at,
    }
    _create_audit_log(
        db,
        actor_id=admin.id,
        action="admin.fairness.export",
        entity_type="fairness_report",
        entity_id=str(report.id),
        metadata_json={"format": fmt},
    )
    db.commit()
    return _export_response(fmt=fmt, data=payload, prefix="fairness_report")
