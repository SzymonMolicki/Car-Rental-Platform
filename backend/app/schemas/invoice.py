from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

class RentalPaymentRequest(BaseModel):
    rental_id: UUID
    payment_method_id: UUID
    discount_code: str | None = None
    

class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    invoice_id: UUID
    rental_id: UUID
    discount_id: UUID | None
    invoice_status_id: UUID
    payment_method_id: UUID | None
    payment_status_id: UUID
    invoice_number: str
    invoice_issue_date: date
    base_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    paid_at: datetime | None
    created_at: datetime

