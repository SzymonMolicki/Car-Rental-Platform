from sqlalchemy.orm import Session

from app.core.config import ADMIN_PASSWORD_HASH, ADMIN_USERNAME
from app.core.security import verify_password, create_access_token
from app.models.customer import Customer


def login_customer(db: Session, email: str, password: str) -> str | None:
    normalized_email = email.strip()

    if normalized_email == ADMIN_USERNAME:
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

    customer = db.query(Customer).filter(Customer.email == normalized_email).first()

    if customer is None:
        return None

    if not verify_password(password, customer.password_hash):
        return None

    token = create_access_token(
        data={
            "sub": str(customer.id),
            "email": customer.email,
            "account_type": "customer",
        }
    )

    return token
