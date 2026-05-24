from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.database import engine, SessionLocal
from app.models.base import Base
from app.models.car import Car
from app.schemas.car import CarCreate

from app.api import *


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login_router)
app.include_router(admin_cars_router)
app.include_router(admin_customers_router)
app.include_router(admin_discounts_router)
app.include_router(admin_rentals_router)
app.include_router(signup_router)

@app.get("/")
def root():
    return {"message": "System is running"}

@app.get("/cars")
def get_cars():
    db = SessionLocal()
    try:
        cars = db.execute(select(Car)).scalars().all()
        return [
            {
                "id": car.id,
                "brand": car.brand,
                "model": car.model,
                "production_year": car.production_year,
                "daily_rate": float(car.daily_rate),
                "status": car.status,
            }
            for car in cars
        ]
    finally:
        db.close()

@app.post("/cars")
def create_car(car_data: CarCreate):
    db = SessionLocal()
    try:
        car = Car(
            brand=car_data.brand,
            model=car_data.model,
            production_year=car_data.production_year,
            daily_rate=car_data.daily_rate,
            status=car_data.status,
        )

        db.add(car)
        db.commit()
        db.refresh(car)

        return {
            "id": car.id,
            "brand": car.brand,
            "model": car.model,
            "production_year": car.production_year,
            "daily_rate": float(car.daily_rate),
            "status": car.status,
        }
    finally:
        db.close()
