from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Car(Base):
    __tablename__ = "cars"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    current_location_id: Mapped[int | None] = mapped_column(
        ForeignKey("locations.id"),
        nullable=True,
    )
    vin: Mapped[str | None] = mapped_column(String(50), nullable=True, unique=True)
    plate_number: Mapped[str | None] = mapped_column(String(20), nullable=True, unique=True)
    brand: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(50), nullable=False)
    production_year: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[str | None] = mapped_column(String(30), nullable=True)
    fuel_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    transmission: Mapped[str | None] = mapped_column(String(30), nullable=True)
    seats: Mapped[int | None] = mapped_column(Integer, nullable=True)
    type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    mileage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    daily_rate: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="available")
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )