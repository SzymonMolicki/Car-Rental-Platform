from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.models import Address, Customer
from app.schemas.signup import SignupRequest
from app.services.customer_validation import normalize_email, validate_customer_birth_date, validate_driver_license


router = APIRouter(tags=["signup"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: SignupRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    email = normalize_email(user.email)

    try:
        validate_customer_birth_date(user.date_of_birth)
        driver_license_no = validate_driver_license(user.driver_license_no, user.license_expiry_date)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

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
        email=email,
        password_hash=hash_password(user.password),
        phone=user.phone,
        date_of_birth=user.date_of_birth,
        driver_license_no=driver_license_no,
        license_expiry_date=user.license_expiry_date,
    )
    db.add(customer)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    return {"message": f"User {customer.first_name} {customer.last_name} created successfully"}
