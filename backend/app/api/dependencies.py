from typing import Any
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError

from app.core.database import get_db
from app.models.customer import Customer
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import SECRET_KEY
from app.core.security import ALGORITHM


bearer_scheme = HTTPBearer()

def get_current_payload(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict[str, Any]:
    try:
        return jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

def require_admin(payload: dict[str, Any] = Depends(get_current_payload)) -> dict[str, Any]:
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    return payload

def require_customer(payload: dict[str, Any] = Depends(get_current_payload)) -> dict[str, Any]:
    if payload.get("account_type") != "customer" or payload.get("role") == "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer access required")

    return payload

def get_current_customer(
    payload: dict[str, Any] = Depends(require_customer),
    db: Session = Depends(get_db),
) -> Customer:
    customer_id = payload.get("sub")
    if customer_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    customer = db.get(Customer, UUID(customer_id))
    if customer is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Customer not found")

    return customer
