from datetime import date, datetime

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import re
from app.core.database import get_db
from app.models import Customer
from app.schemas.signup import SignupRequest
from app.core.security import hash_password

router = APIRouter(tags=["signup"])
PHONE_REGEX = r'^\+?1?\d{9,15}$'
NAME_REGEX = r'^[a-zA-Z]+$'

@router.post("/signup")
def signup(user: SignupRequest, db: Session = Depends(get_db)):
    db_user = db.query(Customer).filter(Customer.email == user.email).first()
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if len(user.first_name) < 1 or len(user.first_name) > 50 or len(user.last_name) < 1 or len(user.last_name) > 50:
        raise HTTPException(status_code=400, detail="Name must be between 1 and 50 characters")
    if not re.match(PHONE_REGEX, user.phone):
        raise HTTPException(status_code=400, detail="Invalid phone number")
    if not re.match(NAME_REGEX, user.first_name) or not re.match(NAME_REGEX, user.last_name):
        raise HTTPException(status_code=400, detail="Name can only contain letters")
    if user.date_of_birth >= datetime.today():
        raise HTTPException(status_code=400, detail="Invalid date of birth")
    if user.license_expiry_date and user.license_expiry_date <= datetime.today():
        raise HTTPException(status_code=400, detail="Invalid license expiry date")

    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash = hash_password(user.password)
    del user.password, user.confirm_password
    new_user = Customer(**user.dict())
    new_user.password_hash = password_hash
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": f"User {user.first_name} {user.last_name} created successfully"}