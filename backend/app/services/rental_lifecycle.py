from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.time import utc_now
from app.models.invoice import Invoice
from app.models.payment_status import PaymentStatus
from app.models.rental import Rental
from app.models.rental_status import RentalStatus


RESERVED_STATUS = "reserved"
ACTIVE_STATUS = "active"
COMPLETED_STATUS = "completed"
CANCELLED_STATUS = "cancelled"
PAID_PAYMENT_STATUS = "paid"


class RentalLifecycleConfigurationError(RuntimeError):
    pass


def _rental_statuses_by_name(db: Session) -> dict[str, RentalStatus]:
    statuses = db.execute(select(RentalStatus)).scalars().all()
    return {status.name: status for status in statuses}


def rental_status_names_by_id(db: Session) -> dict[UUID, str]:
    statuses = db.execute(select(RentalStatus)).scalars().all()
    return {status.rental_status_id: status.name for status in statuses}


def _paid_rental_ids(db: Session, rental_ids: list[UUID]) -> set[UUID]:
    if not rental_ids:
        return set()

    return set(
        db.execute(select(Invoice.rental_id).join(PaymentStatus, Invoice.payment_status_id == PaymentStatus.payment_status_id).where(Invoice.rental_id.in_(rental_ids), PaymentStatus.name == PAID_PAYMENT_STATUS)).scalars().all())


def _target_status_name(rental: Rental, now: datetime) -> str:
    effective_end = rental.actual_end_date or rental.planned_end_date

    if effective_end <= now:
        return COMPLETED_STATUS

    if rental.start_date <= now < effective_end:
        return ACTIVE_STATUS

    return RESERVED_STATUS


def apply_paid_rental_lifecycle_status(db: Session, rental: Rental, *, now: datetime | None = None, statuses_by_name: dict[str, RentalStatus] | None = None, status_names_by_id: dict[UUID, str] | None = None) -> bool:
    now = now or utc_now()
    statuses_by_name = statuses_by_name or _rental_statuses_by_name(db)
    status_names_by_id = status_names_by_id or {status.rental_status_id: status.name for status in statuses_by_name.values()}
    current_status_name = status_names_by_id.get(rental.rental_status_id)

    if current_status_name == CANCELLED_STATUS:
        return False

    target_status_name = _target_status_name(rental, now)
    target_status = statuses_by_name.get(target_status_name)

    if target_status is None:
        raise RentalLifecycleConfigurationError(f"Missing rental status lookup value: {target_status_name}")

    if rental.rental_status_id == target_status.rental_status_id:
        return False

    rental.rental_status_id = target_status.rental_status_id
    return True


def apply_paid_rental_lifecycle_statuses(db: Session, rentals: list[Rental], *, now: datetime | None = None) -> bool:
    now = now or utc_now()
    paid_ids = _paid_rental_ids(db, [rental.rental_id for rental in rentals])
    statuses_by_name = _rental_statuses_by_name(db)
    status_names_by_id = {status.rental_status_id: status.name for status in statuses_by_name.values()}
    changed = False

    for rental in rentals:
        if rental.rental_id not in paid_ids:
            continue

        changed = apply_paid_rental_lifecycle_status(db, rental, now=now, statuses_by_name=statuses_by_name, status_names_by_id=status_names_by_id) or changed

    return changed
