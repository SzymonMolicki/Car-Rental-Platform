from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_customer
from app.core.database import get_db
from app.models.car import Car
from app.models.customer import Customer
from app.models.discount import Discount
from app.models.invoice import Invoice
from app.models.invoice_status import InvoiceStatus
from app.models.payment_method import PaymentMethod
from app.models.payment_status import PaymentStatus
from app.models.rental import Rental
from app.schemas import InvoiceResponse, RentalPaymentRequest


router = APIRouter(prefix="/rent", tags=["customer"])

COMPLETED_PAYMENT_STATUS = "paid"
PAID_INVOICE_STATUS = "paid"


@router.post("/payment", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def pay_for_rental(
    payload: RentalPaymentRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> Invoice:
    rental = db.get(Rental, payload.rental_id)
    if rental is None or rental.customer_id != current_customer.customer_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rental not found")

    existing_invoice = db.execute(select(Invoice).where(Invoice.rental_id == rental.rental_id)).scalar_one_or_none()
    if existing_invoice is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This rental has already been invoiced")

    car = db.get(Car, rental.car_id)
    if car is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")

    payment_method = db.get(PaymentMethod, payload.payment_method_id)
    if payment_method is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment method not found")

    nights = max((rental.planned_end_date.date() - rental.start_date.date()).days, 1)
    base_amount = (car.daily_rate * nights).quantize(Decimal("0.01"))

    discount_amount = Decimal("0.00")
    discount_id = None

    if payload.discount_code:
        discount = db.execute(select(Discount).where(Discount.code == payload.discount_code)).scalar_one_or_none()

        if discount is None or not discount.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or inactive discount code")

        now = datetime.now()
        if discount.valid_from and now < discount.valid_from:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount code is not yet valid")
        if discount.valid_to and now > discount.valid_to:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount code has expired")

        discount_amount = (base_amount * discount.percent_value / Decimal("100")).quantize(Decimal("0.01"))
        discount_id = discount.discount_id

    paid_status = db.execute(select(PaymentStatus).where(PaymentStatus.name == COMPLETED_PAYMENT_STATUS)).scalar_one()
    paid_invoice_status = db.execute(select(InvoiceStatus).where(InvoiceStatus.name == PAID_INVOICE_STATUS)).scalar_one()

    invoice = Invoice(
        rental_id=rental.rental_id,
        discount_id=discount_id,
        invoice_status_id=paid_invoice_status.invoice_status_id,
        payment_method_id=payload.payment_method_id,
        payment_status_id=paid_status.payment_status_id,
        invoice_number=f"INV-{rental.rental_id.hex[:8].upper()}",
        invoice_issue_date=datetime.now().date(),
        base_amount=base_amount,
        discount_amount=discount_amount,
        total_amount=base_amount - discount_amount,
        paid_at=datetime.now(),
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    return invoice