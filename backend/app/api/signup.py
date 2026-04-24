from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Customer
from app.schemas.signup import SignupRequest
from app.core.security import hash_password
from datetime import datetime

router = APIRouter(tags=["signup"])

@router.post("/signup")
def signup(user: SignupRequest, db: Session = Depends(get_db)):
    db_user = db.query(Customer).filter(Customer.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    password_hash = hash_password(user.password)
    created_at = datetime.now()
    new_user = Customer(first_name=user.first_name, last_name=user.last_name, email=user.email, password_hash=password_hash, phone=user.phone, date_of_birth=user.date_of_birth, driver_license_no=user.driver_license_no, license_expiry_date=user.license_expiry_date, street=user.street, city=user.city, postal_code=user.postal_code, country=user.country, created_at=created_at, updated_at=created_at)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": f"User {user.first_name} {user.last_name} created successfully"}