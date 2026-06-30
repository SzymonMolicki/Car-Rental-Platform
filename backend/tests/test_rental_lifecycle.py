import os
from datetime import datetime, timedelta

os.environ.setdefault("SECRET_KEY", "12345678901234567890123456789012")
os.environ.setdefault("ADMIN_USERNAME", "admin")
os.environ.setdefault("ADMIN_PASSWORD_HASH", "hash")

from app.services.rental_lifecycle import is_reservation_hold_active


def test_reservation_hold_is_active_within_five_minutes() -> None:
    now = datetime(2024, 1, 1, 12, 0, 0)
    created_at = now - timedelta(minutes=4)

    assert is_reservation_hold_active(created_at=created_at, now=now)


def test_reservation_hold_is_expired_after_five_minutes() -> None:
    now = datetime(2024, 1, 1, 12, 0, 0)
    created_at = now - timedelta(minutes=5, seconds=1)

    assert not is_reservation_hold_active(created_at=created_at, now=now)
