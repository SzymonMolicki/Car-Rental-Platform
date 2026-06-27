from datetime import datetime
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_customer
from app.core.database import get_db
from app.core.time import utc_now
from app.models.car import Car
from app.models.customer import Customer
from app.models.discount import Discount
from app.models.invoice import Invoice
from app.models.invoice_status import InvoiceStatus
from app.models.payment_method import PaymentMethod
from app.models.payment_status import PaymentStatus
from app.models.rental import Rental
from app.models.rental_status import RentalStatus
from app.schemas import InvoiceResponse, RentalPaymentRequest
from app.services.rental_lifecycle import apply_paid_rental_lifecycle_status, is_reservation_hold_active


router = APIRouter(prefix="/rent", tags=["customer"])

COMPLETED_PAYMENT_STATUS = "paid"
PAID_INVOICE_STATUS = "paid"


def _get_lookup_by_name(db: Session, model: type[Any], name: str, label: str) -> Any:
    item = db.execute(select(model).where(model.name == name)).scalar_one_or_none()

    if item is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Missing {label} lookup value: {name}")

    return item


def _mark_invoice_paid(invoice: Invoice, *, payment_method: PaymentMethod, paid_status: PaymentStatus, paid_invoice_status: InvoiceStatus, now: datetime) -> None:
    invoice.payment_method_id = payment_method.payment_method_id
    invoice.payment_status_id = paid_status.payment_status_id
    invoice.invoice_status_id = paid_invoice_status.invoice_status_id
    invoice.paid_at = invoice.paid_at or now


@router.post("/payment", response_model=InvoiceResponse)
def pay_for_rental(
    payload: RentalPaymentRequest,
    response: Response,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> Invoice:
    rental = db.get(Rental, payload.rental_id)
    if rental is None or rental.customer_id != current_customer.customer_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rental not found")

    car = db.get(Car, rental.car_id)
    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    payment_method = db.get(PaymentMethod, payload.payment_method_id)
    if payment_method is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment method not found")

    now = utc_now()
    if not is_reservation_hold_active(created_at=rental.created_at, now=now):
        cancelled_status = _get_lookup_by_name(db, RentalStatus, "cancelled", "rental status")
        if rental.rental_status_id != cancelled_status.rental_status_id:
            rental.rental_status_id = cancelled_status.rental_status_id
            db.commit()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Reservation expired. Please create a new reservation.")

    paid_status = _get_lookup_by_name(db, PaymentStatus, COMPLETED_PAYMENT_STATUS, "payment status")
    paid_invoice_status = _get_lookup_by_name(db, InvoiceStatus, PAID_INVOICE_STATUS, "invoice status")
    existing_invoice = db.execute(select(Invoice).where(Invoice.rental_id == rental.rental_id)).scalar_one_or_none()

    if existing_invoice is not None:
        _mark_invoice_paid(existing_invoice, payment_method=payment_method, paid_status=paid_status, paid_invoice_status=paid_invoice_status, now=now)
        db.commit()
        db.refresh(existing_invoice)
        apply_paid_rental_lifecycle_status(db, rental, now=now)
        db.commit()
        response.status_code = status.HTTP_200_OK
        return existing_invoice

    nights = max((rental.planned_end_date.date() - rental.start_date.date()).days, 1)
    base_amount = (car.daily_rate * nights).quantize(Decimal("0.01"))

    discount_amount = Decimal("0.00")
    discount_id = None

    if payload.discount_code:
        discount = db.execute(select(Discount).where(Discount.code == payload.discount_code)).scalar_one_or_none()

        if discount is None or not discount.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or inactive discount code")

        if discount.valid_from and now < discount.valid_from:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount code is not yet valid")
        if discount.valid_to and now > discount.valid_to:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount code has expired")

        discount_amount = (base_amount * discount.percent_value / Decimal("100")).quantize(Decimal("0.01"))
        discount_id = discount.discount_id

    invoice = Invoice(
        rental_id=rental.rental_id,
        discount_id=discount_id,
        invoice_status_id=paid_invoice_status.invoice_status_id,
        payment_method_id=payload.payment_method_id,
        payment_status_id=paid_status.payment_status_id,
        invoice_number=f"INV-{rental.rental_id.hex[:8].upper()}",
        invoice_issue_date=now.date(),
        base_amount=base_amount,
        discount_amount=discount_amount,
        total_amount=base_amount - discount_amount,
        paid_at=now,
    )

    db.add(invoice)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        existing_invoice = db.execute(select(Invoice).where(Invoice.rental_id == payload.rental_id)).scalar_one_or_none()

        if existing_invoice is None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Payment could not be completed. Please try again.") from exc

        _mark_invoice_paid(existing_invoice, payment_method=payment_method, paid_status=paid_status, paid_invoice_status=paid_invoice_status, now=now)
        db.commit()
        db.refresh(existing_invoice)
        apply_paid_rental_lifecycle_status(db, rental, now=now)
        db.commit()
        response.status_code = status.HTTP_200_OK
        return existing_invoice

    db.refresh(invoice)
    apply_paid_rental_lifecycle_status(db, rental, now=now)
    db.commit()
    response.status_code = status.HTTP_201_CREATED

    return invoice
