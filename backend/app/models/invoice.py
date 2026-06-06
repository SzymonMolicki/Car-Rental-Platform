from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Invoice(Base):
    __tablename__ = "invoice"

    invoice_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    rental_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("rental.rental_id"), nullable=False)
    discount_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("discount.discount_id"), nullable=True)
    invoice_status_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("invoice_status.invoice_status_id"), nullable=False)
    payment_method_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("payment_method.payment_method_id"), nullable=True)
    payment_status_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("payment_status.payment_status_id"), nullable=False)
    invoice_number: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    invoice_issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    base_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now)
