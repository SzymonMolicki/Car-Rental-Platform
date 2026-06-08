from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.models import Address, Customer
from app.schemas.signup import SignupRequest


router = APIRouter(tags=["signup"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: SignupRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    existing_customer = db.query(Customer).filter(Customer.email == user.email).first()

    if existing_customer is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    address = Address(
        street=user.street,
        city=user.city,
        postal_code=user.postal_code,
        country=user.country,
    )
    db.add(address)
    db.flush()

    customer = Customer(
        address_id=address.address_id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password_hash=hash_password(user.password),
        phone=user.phone,
        date_of_birth=user.date_of_birth,
        driver_license_no=user.driver_license_no,
        license_expiry_date=user.license_expiry_date,
    )
    db.add(customer)
    db.commit()

    return {"message": f"User {customer.first_name} {customer.last_name} created successfully"}
