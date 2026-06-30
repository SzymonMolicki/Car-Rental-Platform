from uuid import UUID

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.models.address import Address
from app.models.car import Car
from app.models.customer import Customer
from app.models.discount import Discount
from app.models.invoice import Invoice
from app.models.location import Location
from app.models.rental import Rental


def delete_car_with_related_records(db: Session, car: Car) -> None:
    rental_ids = db.execute(select(Rental.rental_id).where(Rental.car_id == car.car_id)).scalars().all()

    if rental_ids:
        db.execute(delete(Invoice).where(Invoice.rental_id.in_(rental_ids)))
        db.execute(delete(Rental).where(Rental.rental_id.in_(rental_ids)))

    db.delete(car)


def delete_customer_with_related_records(db: Session, customer: Customer) -> None:
    customer_id: UUID = customer.customer_id
    address_id: UUID = customer.address_id
    rental_ids = db.execute(select(Rental.rental_id).where(Rental.customer_id == customer_id)).scalars().all()

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


def delete_discount_preserving_invoices(db: Session, discount: Discount) -> None:
    db.execute(update(Invoice).where(Invoice.discount_id == discount.discount_id).values(discount_id=None))
    db.delete(discount)
