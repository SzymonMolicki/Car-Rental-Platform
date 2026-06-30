from datetime import date


MIN_CUSTOMER_AGE_YEARS = 18


def normalize_email(email: str) -> str:
    return str(email).strip().lower()


def normalize_required_text(value: str | None, label: str) -> str:
    if value is None:
        raise ValueError(f"{label} is required")

    normalized = str(value).strip()

    if not normalized:
        raise ValueError(f"{label} is required")

    return normalized


def calculate_age(birth_date: date, today: date | None = None) -> int:
    today = today or date.today()
    age = today.year - birth_date.year

    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1

    return age


def validate_customer_birth_date(birth_date: date | None, today: date | None = None) -> None:
    today = today or date.today()

    if birth_date is None:
        raise ValueError("Date of birth is required")

    if birth_date >= today:
        raise ValueError("Date of birth must be in the past")

    if calculate_age(birth_date, today) < MIN_CUSTOMER_AGE_YEARS:
        raise ValueError(f"Customer must be at least {MIN_CUSTOMER_AGE_YEARS} years old")


def validate_driver_license(driver_license_no: str | None, license_expiry_date: date | None, today: date | None = None) -> str:
    today = today or date.today()
    normalized_license_no = normalize_required_text(driver_license_no, "Driver's license number")

    if license_expiry_date is not None and license_expiry_date < today:
        raise ValueError("Driver's license is expired")

    return normalized_license_no
