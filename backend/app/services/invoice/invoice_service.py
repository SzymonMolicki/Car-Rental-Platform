from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.car import Car
from app.models.customer import Customer
from app.models.discount import Discount
from app.models.invoice import Invoice
from app.models.invoice_status import InvoiceStatus
from app.models.location import Location
from app.models.payment_method import PaymentMethod
from app.models.payment_status import PaymentStatus
from app.models.rental import Rental
from app.models.rental_status import RentalStatus
from app.services.invoice.invoice_pdf import build_invoice_pdf, safe_invoice_filename


class RentalInvoiceError(Exception):
    detail: str


class RentalInvoiceRentalNotFoundError(RentalInvoiceError):
    detail = "Rental not found"


class RentalInvoiceNotFoundError(RentalInvoiceError):
    detail = "Invoice not found for rental"


@dataclass(frozen=True)
class InvoicePdfFile:
    content: bytes
    filename: str


def generate_rental_invoice_pdf(db: Session, rental_id: UUID) -> InvoicePdfFile:
    rental = db.get(Rental, rental_id)

    if rental is None:
        raise RentalInvoiceRentalNotFoundError

    invoice = (db.execute(select(Invoice).where(Invoice.rental_id == rental_id).order_by(Invoice.created_at.desc())).scalars().first())

    if invoice is None:
        raise RentalInvoiceNotFoundError

    pdf = build_invoice_pdf(
        invoice=invoice,
        rental=rental,
        customer=db.get(Customer, rental.customer_id),
        car=db.get(Car, rental.car_id),
        pickup_location=db.get(Location, rental.pickup_location_id),
        return_location=db.get(Location, rental.return_location_id),
        rental_status=db.get(RentalStatus, rental.rental_status_id),
        invoice_status=db.get(InvoiceStatus, invoice.invoice_status_id),
        payment_status=db.get(PaymentStatus, invoice.payment_status_id),
        payment_method=(db.get(PaymentMethod, invoice.payment_method_id) if invoice.payment_method_id is not None else None),
        discount=db.get(Discount, invoice.discount_id) if invoice.discount_id is not None else None,
    )

    return InvoicePdfFile(content=pdf, filename=safe_invoice_filename(invoice.invoice_number))
