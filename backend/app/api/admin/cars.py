from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_admin
from app.core.database import get_db
from app.core.time import utc_now
from app.models.car import Car
from app.models.car_status import CarStatus
from app.models.car_type import CarType
from app.models.fuel_type import FuelType
from app.models.location import Location
from app.models.transmission import Transmission
from app.schemas import CarCreate, CarResponse, CarUpdate
from app.services.deletion import delete_car_with_related_records
from app.services.rental_lifecycle import cancel_unpaid_rentals_for_available_car


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])

CAR_RELATION_OPTIONS = (selectinload(Car.current_location), selectinload(Car.fuel_type), selectinload(Car.transmission), selectinload(Car.car_type), selectinload(Car.car_status))

REFERENCE_FIELDS = (("current_location_id", Location, "Location"), ("fuel_type_id", FuelType, "Fuel type"), ("transmission_id", Transmission, "Transmission"), ("car_type_id", CarType, "Car type"), ("car_status_id", CarStatus, "Car status"))


def _get_car_or_404(db: Session, car_id: UUID) -> Car:
    car = db.execute(select(Car).options(*CAR_RELATION_OPTIONS).where(Car.car_id == car_id)).scalars().first()

    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    return car


def _validate_references(db: Session, data: dict[str, object]) -> None:
    for field, model, label in REFERENCE_FIELDS:
        value = data.get(field)

        if value is not None and db.get(model, value) is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{label} not found")


@router.get("/cars", response_model=list[CarResponse])
def get_cars(db: Session = Depends(get_db)) -> list[Car]:
    return db.execute(select(Car).options(*CAR_RELATION_OPTIONS)).scalars().all()


@router.get("/cars/{car_id}", response_model=CarResponse)
def get_car(car_id: UUID, db: Session = Depends(get_db)) -> Car:
    return _get_car_or_404(db, car_id)


@router.post("/cars", response_model=CarResponse, status_code=status.HTTP_201_CREATED)
def create_car(car: CarCreate, db: Session = Depends(get_db)) -> Car:
    create_data = car.model_dump()
    _validate_references(db, create_data)

    new_car = Car(**create_data)
    db.add(new_car)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="VIN or plate number already exists") from exc

    return _get_car_or_404(db, new_car.car_id)


@router.delete("/cars/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_car(car_id: UUID, db: Session = Depends(get_db)) -> None:
    car = db.get(Car, car_id)

    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    delete_car_with_related_records(db, car)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Car cannot be deleted because it is used by existing records") from exc


@router.patch("/cars/{car_id}", response_model=CarResponse)
def update_car(car_id: UUID, car_data: CarUpdate, db: Session = Depends(get_db)) -> Car:
    car = _get_car_or_404(db, car_id)

    update_data = car_data.model_dump(exclude_unset=True)
    _validate_references(db, update_data)

    for field, value in update_data.items():
        setattr(car, field, value)

    car.updated_at = utc_now()

    should_cancel_unpaid_rentals = False
    if "car_status_id" in update_data:
        available_status = db.execute(select(CarStatus).where(CarStatus.name == "available")).scalar_one_or_none()
        should_cancel_unpaid_rentals = available_status is not None and car.car_status_id == available_status.car_status_id

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="VIN or plate number already exists") from exc

    if should_cancel_unpaid_rentals:
        cancel_unpaid_rentals_for_available_car(db, car.car_id)
        db.commit()

    return _get_car_or_404(db, car_id)
