from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi import Depends
from .utils import verify_token, oauth2_scheme
from .database import SessionLocal
from . import models
from .schemas import PatientCreate
from .utils import create_access_token
from fastapi.security import OAuth2PasswordRequestForm
router = APIRouter()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)
def get_current_user(token: str = Depends(oauth2_scheme)):
    return verify_token(token)
# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = db.query(models.Patient)\
        .filter(models.Patient.email == form_data.username)\
        .first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid Email")

    if not pwd_context.verify(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid Password")

    access_token = create_access_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

    user = db.query(models.Patient).filter(models.Patient.email == data.email).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid Email")

    if not pwd_context.verify(data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid Password")

    access_token = create_access_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }