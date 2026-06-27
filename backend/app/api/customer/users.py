from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_customer
from app.core.database import get_db
from app.core.time import utc_now
from app.models.address import Address
from app.models.car import Car
from app.models.car_status import CarStatus
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.location import Location
from app.models.rental import Rental
from app.schemas import CustomerProfileResponse, CustomerProfileUpdate, RentalHistoryResponse
from app.services.invoice.invoice_service import RentalInvoiceError, generate_rental_invoice_pdf
from app.services.rental_lifecycle import apply_paid_rental_lifecycle_statuses, cancel_unpaid_rentals_for_available_car, rental_status_names_by_id


router = APIRouter(tags=["customer"], dependencies=[Depends(require_customer)])


def _ensure_own_profile(user_id: UUID, payload: dict) -> None:
    if str(user_id) != str(payload.get("sub")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only access your own profile")


def _get_customer_or_404(db: Session, user_id: UUID) -> Customer:
    customer = db.get(Customer, user_id)

    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    return customer


def _profile_response(db: Session, customer: Customer) -> CustomerProfileResponse:
    address = db.get(Address, customer.address_id)

    if address is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer address not found")

    return CustomerProfileResponse(
        customer_id=customer.customer_id,
        address_id=customer.address_id,
        first_name=customer.first_name,
        last_name=customer.last_name,
        email=customer.email,
        phone=customer.phone,
        date_of_birth=customer.date_of_birth,
        driver_license_no=customer.driver_license_no,
        license_expiry_date=customer.license_expiry_date,
        created_at=customer.created_at,
        updated_at=customer.updated_at,
        street=address.street,
        city=address.city,
        postal_code=address.postal_code,
        country=address.country
    )


@router.get("/user/{user_id}", response_model=CustomerProfileResponse)
def get_profile(user_id: UUID, db: Session = Depends(get_db), payload: dict = Depends(require_customer)) -> CustomerProfileResponse:
    _ensure_own_profile(user_id, payload)
    return _profile_response(db, _get_customer_or_404(db, user_id))


@router.patch("/user/{user_id}", response_model=CustomerProfileResponse)
def update_profile(user_id: UUID, profile_data: CustomerProfileUpdate, db: Session = Depends(get_db), payload: dict = Depends(require_customer)) -> CustomerProfileResponse:
    _ensure_own_profile(user_id, payload)
    customer = _get_customer_or_404(db, user_id)
    address = db.get(Address, customer.address_id)

    if address is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer address not found")

    update_data = profile_data.model_dump(exclude_unset=True)
    customer_fields = {"first_name", "last_name", "email", "phone", "date_of_birth", "driver_license_no", "license_expiry_date"}
    address_fields = {"street", "city", "postal_code", "country"}

    if "email" in update_data and update_data["email"] != customer.email:
        existing_customer = db.execute(select(Customer).where(Customer.email == update_data["email"])).scalars().first()

        if existing_customer is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    for field in customer_fields & update_data.keys():
        setattr(customer, field, update_data[field])

    for field in address_fields & update_data.keys():
        setattr(address, field, update_data[field])

    customer.updated_at = utc_now()
    db.commit()
    db.refresh(customer)

    return _profile_response(db, customer)


@router.delete("/user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(user_id: UUID, db: Session = Depends(get_db), payload: dict = Depends(require_customer)) -> None:
    _ensure_own_profile(user_id, payload)
    customer = _get_customer_or_404(db, user_id)
    address_id = customer.address_id
    rental_ids = db.execute(select(Rental.rental_id).where(Rental.customer_id == user_id)).scalars().all()

    if rental_ids:
        db.execute(delete(Invoice).where(Invoice.rental_id.in_(rental_ids)))
        db.execute(delete(Rental).where(Rental.rental_id.in_(rental_ids)))

    db.delete(customer)
    db.flush()

    address_is_used = db.execute(select(Customer.customer_id).where(Customer.address_id == address_id).limit(1)).first() or db.execute(select(Location.location_id).where(Location.address_id == address_id).limit(1)).first()

    if not address_is_used:
        address = db.get(Address, address_id)

        if address is not None:
            db.delete(address)

    db.commit()


@router.get("/user/{user_id}/history", response_model=list[RentalHistoryResponse])
def get_rental_history(user_id: UUID, db: Session = Depends(get_db), payload: dict = Depends(require_customer)) -> list[RentalHistoryResponse]:
    _ensure_own_profile(user_id, payload)
    _get_customer_or_404(db, user_id)

    pickup_location = Location.__table__.alias("pickup_location")
    return_location = Location.__table__.alias("return_location")
    rows = db.execute(
        select(
            Rental,
            Car.brand,
            Car.model,
            Car.plate_number,
            CarStatus.name.label("car_status_name"),
            pickup_location.c.name.label("pickup_location_name"),
            return_location.c.name.label("return_location_name"),
        )
        .join(Car, Rental.car_id == Car.car_id)
        .join(CarStatus, Car.car_status_id == CarStatus.car_status_id)
        .join(pickup_location, Rental.pickup_location_id == pickup_location.c.location_id)
        .join(return_location, Rental.return_location_id == return_location.c.location_id)
        .where(Rental.customer_id == user_id)
        .order_by(Rental.start_date.desc())
    ).all()

    available_car_ids = {
        rental.car_id
        for rental, _, _, _, car_status_name, _, _ in rows
        if car_status_name == "available"
    }

    if available_car_ids:
        for car_id in available_car_ids:
            if cancel_unpaid_rentals_for_available_car(db, car_id):
                db.commit()

        # Refresh rental objects after possible cancellation
        rows = db.execute(
            select(
                Rental,
                Car.brand,
                Car.model,
                Car.plate_number,
                CarStatus.name.label("car_status_name"),
                pickup_location.c.name.label("pickup_location_name"),
                return_location.c.name.label("return_location_name"),
            )
            .join(Car, Rental.car_id == Car.car_id)
            .join(CarStatus, Car.car_status_id == CarStatus.car_status_id)
            .join(pickup_location, Rental.pickup_location_id == pickup_location.c.location_id)
            .join(return_location, Rental.return_location_id == return_location.c.location_id)
            .where(Rental.customer_id == user_id)
            .order_by(Rental.start_date.desc())
        ).all()

    rental_ids = [rental.rental_id for rental, *_ in rows]
    invoiced_rental_ids = set(db.execute(select(Invoice.rental_id).where(Invoice.rental_id.in_(rental_ids))).scalars().all()) if rental_ids else set()
    rentals = [rental for rental, *_ in rows]
    apply_paid_rental_lifecycle_statuses(db, rentals)
    status_names_by_id = rental_status_names_by_id(db)

    return [
        RentalHistoryResponse(
            rental_id=rental.rental_id,
            car_id=rental.car_id,
            car=f"{brand} {model}",
            plate_number=plate_number,
            status=status_names_by_id.get(rental.rental_status_id, "unknown"),
            has_invoice=rental.rental_id in invoiced_rental_ids,
            pickup_location=pickup_location_name,
            return_location=return_location_name,
            start_date=rental.start_date,
            planned_end_date=rental.planned_end_date,
            actual_end_date=rental.actual_end_date,
            created_at=rental.created_at
        )
        for rental, brand, model, plate_number, _, pickup_location_name, return_location_name in rows
    ]


@router.get("/user/{user_id}/history/{rental_id}/invoice", response_class=StreamingResponse, responses={200: {"content": {"application/pdf": {}}}})
def download_customer_rental_invoice(user_id: UUID, rental_id: UUID, db: Session = Depends(get_db), payload: dict = Depends(require_customer)) -> StreamingResponse:
    _ensure_own_profile(user_id, payload)
    rental = db.get(Rental, rental_id)

    if rental is None or rental.customer_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rental not found")

    try:
        invoice_file = generate_rental_invoice_pdf(db, rental_id)
    except RentalInvoiceError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail) from exc

    return StreamingResponse(iter([invoice_file.content]), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{invoice_file.filename}"'})
