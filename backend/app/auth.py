from fastapi import APIRouter, Depends, HTTPException, Request, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import models
from .database import SessionLocal
from .schemas import LoginResponse, RegisterRequest, RegisterResponse, UserResponse, UserUpdateRequest
from .utils import create_access_token, oauth2_scheme, verify_token

router = APIRouter(prefix="/auth", tags=["auth"])

# Keep bcrypt verify support for legacy hashes but use pbkdf2 for new hashes.
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _create_audit_log(
    db: Session,
    *,
    actor_id: int | None,
    action: str,
    entity_type: str,
    entity_id: str | None,
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


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.Patient:
    payload = verify_token(token)
    user = db.query(models.Patient).filter(models.Patient.email == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive or invalid user")
    return user


def get_current_admin(current_user: models.Patient = Depends(get_current_user)) -> models.Patient:
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return current_user


@router.post("/register", response_model=RegisterResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    role = data.role.lower().strip()
    if role not in {"patient", "doctor"}:
        raise HTTPException(status_code=400, detail="Role must be patient or doctor")
    _validate_email_domain(str(data.email))

    existing_user = db.query(models.Patient).filter(models.Patient.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.Patient(
        name=data.name.strip(),
        email=data.email.lower(),
        password_hash=pwd_context.hash(data.password[:72]),
        role=role,
        is_active=True,
    )

    db.add(new_user)
    db.flush()
    _create_audit_log(
        db,
        actor_id=new_user.id,
        action="auth.register",
        entity_type="patient",
        entity_id=str(new_user.id),
        metadata_json={"email": new_user.email, "role": role},
    )
    db.commit()
    db.refresh(new_user)

    return RegisterResponse(
        message="Registration successful",
        user_id=new_user.id,
        role=new_user.role,
        account_status="active" if new_user.is_active else "inactive",
    )


@router.post("/login", response_model=LoginResponse)
async def login(request: Request, db: Session = Depends(get_db)):
    content_type = request.headers.get("content-type", "")

    email = None
    password = None
    if "application/x-www-form-urlencoded" in content_type:
        form_data = await request.form()
        email = form_data.get("username") or form_data.get("email")
        password = form_data.get("password")
    else:
        try:
            payload = await request.json()
        except Exception:
            payload = {}
        email = payload.get("email") or payload.get("username")
        password = payload.get("password")

    if not email or not password:
        raise HTTPException(status_code=422, detail="Email/username and password are required")

    user = db.query(models.Patient).filter(models.Patient.email == str(email).lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
    if not pwd_context.verify(str(password), user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid password")

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "uid": user.id})
    _create_audit_log(
        db,
        actor_id=user.id,
        action="auth.login",
        entity_type="patient",
        entity_id=str(user.id),
        metadata_json={"email": user.email},
    )
    db.commit()

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: models.Patient = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
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
        if role not in {"patient", "doctor"}:
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = role
    if payload.is_active is not None:
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
            "is_active": user.is_active,
        },
    )
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)
