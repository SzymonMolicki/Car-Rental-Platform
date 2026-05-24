from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class RentalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    car_id: int
    pickup_location_id: int
    return_location_id: int
    discount_id: int | None
    start_date: datetime
    planned_end_date: datetime
    actual_end_date: datetime | None
    base_cost: float
    discount_amount: float
    total_cost: float
    status: str
    invoice_number: str | None
    invoice_issue_date: date | None
    paid_amount: float
    payment_method: str | None
    payment_status: str | None
    paid_at: datetime | None
    created_at: datetime
