from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.core.database import get_db
from app.models.car import Car
from app.schemas import CarCreate, CarResponse, CarUpdate


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/cars", response_model=list[CarResponse])
def get_cars(db: Session = Depends(get_db)) -> list[Car]:
    return db.execute(select(Car)).scalars().all()


@router.get("/cars/{car_id}", response_model=CarResponse)
def get_car(car_id: UUID, db: Session = Depends(get_db)) -> Car:
    car = db.get(Car, car_id)

    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    return car


@router.post("/cars", response_model=CarResponse, status_code=status.HTTP_201_CREATED)
def create_car(car: CarCreate, db: Session = Depends(get_db)) -> Car:
    create_data = car.model_dump()

    new_car = Car(**create_data)
    db.add(new_car)
    db.commit()
    db.refresh(new_car)

    return new_car


@router.delete("/cars/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_car(car_id: UUID, db: Session = Depends(get_db)) -> None:
    car = db.get(Car, car_id)

    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    db.delete(car)
    db.commit()


@router.patch("/cars/{car_id}", response_model=CarResponse)
def update_car(car_id: UUID, car_data: CarUpdate, db: Session = Depends(get_db)) -> Car:
    car = db.get(Car, car_id)

    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    update_data = car_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(car, field, value)

    car.updated_at = datetime.now()

    db.commit()
    db.refresh(car)

    return car
