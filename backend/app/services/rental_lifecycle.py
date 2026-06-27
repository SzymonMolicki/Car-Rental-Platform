from datetime import datetime, timedelta
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
UNPAID_RENTAL_STATUSES = (RESERVED_STATUS, ACTIVE_STATUS)
RESERVATION_HOLD_MINUTES = 5


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


def is_reservation_hold_active(*, created_at: datetime, now: datetime, hold_minutes: int = RESERVATION_HOLD_MINUTES) -> bool:
    return created_at <= now < created_at + timedelta(minutes=hold_minutes)


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


def cancel_unpaid_rentals_for_available_car(db: Session, car_id: UUID) -> bool:
    statuses_by_name = _rental_statuses_by_name(db)
    cancelled_status = statuses_by_name.get(CANCELLED_STATUS)

    if cancelled_status is None:
        raise RuntimeError(f"Missing rental status lookup value: {CANCELLED_STATUS}")

    target_status_ids = [
        statuses_by_name[name].rental_status_id
        for name in UNPAID_RENTAL_STATUSES
        if name in statuses_by_name
    ]

    if not target_status_ids:
        return False

    rentals = db.execute(select(Rental).where(Rental.car_id == car_id, Rental.rental_status_id.in_(target_status_ids))).scalars().all()

    if not rentals:
        return False

    paid_ids = _paid_rental_ids(db, [rental.rental_id for rental in rentals])
    changed = False

    for rental in rentals:
        if rental.rental_id in paid_ids or rental.rental_status_id == cancelled_status.rental_status_id:
            continue

        rental.rental_status_id = cancelled_status.rental_status_id
        changed = True

    return changed
