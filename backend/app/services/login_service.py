from sqlalchemy.orm import Session

from app.core.config import ADMIN_PASSWORD_HASH, ADMIN_USERNAME
from app.core.security import create_access_token, verify_password
from app.models.customer import Customer
from app.services.customer_validation import normalize_email


def login_customer(db: Session, email: str, password: str) -> str | None:
    normalized_identifier = email.strip()

    if normalized_identifier == ADMIN_USERNAME:
        if not verify_password(password, ADMIN_PASSWORD_HASH):
            return None

        return create_access_token(
            data={
                "sub": ADMIN_USERNAME,
                "username": ADMIN_USERNAME,
                "account_type": "admin",
                "role": "admin",
            }
        )

    normalized_email = normalize_email(normalized_identifier)
    customer = db.query(Customer).filter(Customer.email == normalized_email).first()

    if customer is None:
        return None

    if not verify_password(password, customer.password_hash):
        return None

    return create_access_token(data={"sub": str(customer.customer_id), "email": customer.email, "account_type": "customer"})
