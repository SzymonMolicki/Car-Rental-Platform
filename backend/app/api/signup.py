from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Customer
from app.schemas.signup import SignupRequest
from app.core.security import hash_password

router = APIRouter(tags=["signup"])

@router.post("/signup")
def signup(user: SignupRequest, db: Session = Depends(get_db)):
    db_user = db.query(Customer).filter(Customer.email == user.email).first()
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