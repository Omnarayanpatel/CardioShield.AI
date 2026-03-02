from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="patient")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime | None = None


class RegisterResponse(BaseModel):
    message: str
    user_id: int
    role: str
    account_status: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PatientData(BaseModel):
    age: float = Field(ge=0, le=130 * 365, description="Age in days")
    gender: int = Field(ge=1, le=2)
    height: float = Field(ge=30, le=230)
    weight: float = Field(ge=2, le=250)
    ap_hi: int = Field(ge=40, le=260)
    ap_lo: int = Field(ge=20, le=180)
    cholesterol: int = Field(ge=1, le=3)
    gluc: int = Field(ge=1, le=3)
    smoke: int = Field(ge=0, le=1)
    alco: int = Field(ge=0, le=1)
    active: int = Field(ge=0, le=1)


class PredictionResponse(BaseModel):
    prediction_id: int
    risk_probability: float
    risk_category: str
    confidence_interval: dict[str, float]
    cardio_flag: int
    top_risk_factors: list[str]
    explanation_text: str
    recommendation: str
    escalation_required: bool
    disclaimer: str


class PredictionRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    user_email: str | None
    age: float
    gender: int
    height: float
    weight: float
    ap_hi: int
    ap_lo: int
    cholesterol: int
    gluc: int
    smoke: int
    alco: int
    active: int
    risk_probability: float
    risk_category: int
    confidence_low: float | None = None
    confidence_high: float | None = None
    top_risk_factors: list[str] | None = None
    explanation_text: str | None = None
    recommendation: str | None = None
    escalation_required: bool
    created_at: datetime | None = None


class UserUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    role: str | None = None
    is_active: bool | None = None


class AdminPredictionFilters(BaseModel):
    patient_id: int | None = None
    risk_category: int | None = Field(default=None, ge=0, le=2)
    start_date: datetime | None = None
    end_date: datetime | None = None


class FairnessReportResponse(BaseModel):
    id: int
    model_version: str
    metrics: dict[str, Any]
    created_at: datetime
