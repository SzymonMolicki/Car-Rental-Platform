from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.api.dependencies import require_admin
from app.models.car import Car
from app.schemas import CarResponse, CarCreate, CarUpdate


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])

@router.get("/cars", response_model=list[CarResponse])
def get_cars(db: Session = Depends(get_db)) -> list[Car]:
    return db.execute(select(Car)).scalars().all()

@router.get("/cars/{car_id}", response_model=CarResponse)
def get_car(car_id: int, db: Session = Depends(get_db)) -> Car:
    car = db.get(Car, car_id)

    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    return car

@router.post("/cars")
def create_car(car: CarCreate, db: Session = Depends(get_db)) -> None:
    new_car = Car(**car.dict())
    db.add(new_car)
    db.commit()
    db.refresh(new_car)

@router.delete("/cars/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_car(car_id: int, db: Session = Depends(get_db)) -> None:
    car = db.get(Car, car_id)

    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    db.delete(car)
    db.commit()

@router.patch("/cars/{car_id}", response_model=CarResponse)
def update_car(car_id: int, car_data: CarUpdate, db: Session = Depends(get_db)) -> Car:
    car = db.get(Car, car_id)

    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    update_data = car_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(car, field, value)

    car.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(car)

    return car
