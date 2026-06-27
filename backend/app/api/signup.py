from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.models import Address, Customer
from app.schemas.signup import SignupRequest


router = APIRouter(tags=["signup"])

MIN_AGE_YEARS = 18


def _calculate_age(birth_date: date, today: date | None = None) -> int:
    today = today or date.today()
    age = today.year - birth_date.year
    # Adjust if birthday hasn't occurred yet this year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: SignupRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    email = user.email.strip().lower()

    # --- Fix #5: validate sensitive fields server-side ---
    # Even if SignupRequest already validates these, the route shouldn't
    # rely solely on the client-supplied schema for legally-relevant checks.
    today = date.today()

    if user.date_of_birth >= today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Date of birth must be in the past",
        )

    if _calculate_age(user.date_of_birth, today) < MIN_AGE_YEARS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer must be at least {MIN_AGE_YEARS} years old",
        )

    if user.license_expiry_date <= today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver's license is expired",
        )

    # --- Fix #1 (part 1): optimization/early-exit, not the real guard ---
    existing_customer = db.query(Customer).filter(Customer.email == email).first()
    if existing_customer is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

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
        email=email,  # Fix #4: normalized email stored
        password_hash=hash_password(user.password),
        phone=user.phone,
        date_of_birth=user.date_of_birth,
        driver_license_no=user.driver_license_no,
        license_expiry_date=user.license_expiry_date,
    )
    db.add(customer)

    # --- Fix #1 (part 2): IntegrityError is the real guard against races ---
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    return {"message": f"User {customer.first_name} {customer.last_name} created successfully"}