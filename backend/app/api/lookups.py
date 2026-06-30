from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_payload
from app.core.database import get_db
from app.models.car_status import CarStatus
from app.models.car_type import CarType
from app.models.fuel_type import FuelType
from app.models.invoice_status import InvoiceStatus
from app.models.location import Location
from app.models.payment_method import PaymentMethod
from app.models.payment_status import PaymentStatus
from app.models.rental_status import RentalStatus
from app.models.transmission import Transmission
from app.schemas import LookupItemResponse, LookupsResponse


router = APIRouter(tags=["lookups"], dependencies=[Depends(get_current_payload)])


def _lookup_items(db: Session, model: type[Any], id_field: str) -> list[LookupItemResponse]:
    items = db.execute(select(model).order_by(model.name)).scalars().all()

    return [LookupItemResponse(id=getattr(item, id_field), name=item.name) for item in items]


def build_lookups_response(db: Session) -> LookupsResponse:
    locations = db.execute(select(Location).order_by(Location.name)).scalars().all()

    return LookupsResponse(
        car_statuses=_lookup_items(db, CarStatus, "car_status_id"),
        car_types=_lookup_items(db, CarType, "car_type_id"),
        fuel_types=_lookup_items(db, FuelType, "fuel_type_id"),
        invoice_statuses=_lookup_items(db, InvoiceStatus, "invoice_status_id"),
        locations=[LookupItemResponse(id=location.location_id, name=location.name) for location in locations],
        payment_methods=_lookup_items(db, PaymentMethod, "payment_method_id"),
        payment_statuses=_lookup_items(db, PaymentStatus, "payment_status_id"),
        rental_statuses=_lookup_items(db, RentalStatus, "rental_status_id"),
        transmissions=_lookup_items(db, Transmission, "transmission_id")
    )


@router.get("/lookups", response_model=LookupsResponse)
def get_lookups(db: Session = Depends(get_db)) -> LookupsResponse:
    return build_lookups_response(db)
