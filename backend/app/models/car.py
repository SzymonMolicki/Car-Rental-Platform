from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, SmallInteger, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utc_now
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.car_status import CarStatus
    from app.models.car_type import CarType
    from app.models.fuel_type import FuelType
    from app.models.location import Location
    from app.models.transmission import Transmission


class Car(Base):
    __tablename__ = "car"

    car_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    current_location_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("location.location_id"), nullable=False)
    fuel_type_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("fuel_type.fuel_type_id"), nullable=False)
    transmission_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("transmission.transmission_id"), nullable=False)
    car_type_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("car_type.car_type_id"), nullable=False)
    car_status_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("car_status.car_status_id"), nullable=False)
    vin: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    plate_number: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    brand: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String, nullable=False)
    production_year: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False)
    seats: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    mileage: Mapped[int] = mapped_column(Integer, nullable=False)
    daily_rate: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    current_location: Mapped["Location"] = relationship()
    fuel_type: Mapped["FuelType"] = relationship(back_populates="cars")
    transmission: Mapped["Transmission"] = relationship(back_populates="cars")
    car_type: Mapped["CarType"] = relationship(back_populates="cars")
    car_status: Mapped["CarStatus"] = relationship(back_populates="cars")
