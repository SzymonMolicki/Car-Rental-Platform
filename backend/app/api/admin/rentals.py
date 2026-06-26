from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.core.database import get_db
from app.models.invoice import Invoice
from app.models.rental import Rental
from app.models.rental_status import RentalStatus
from app.schemas import RentalResponse
from app.services.invoice.invoice_service import RentalInvoiceError, generate_rental_invoice_pdf


router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])
ACTIVE_RENTAL_STATUS = "active"


def _sync_active_paid_rentals(db: Session) -> None:
    active_status = db.execute(
        select(RentalStatus).where(RentalStatus.name == ACTIVE_RENTAL_STATUS)
    ).scalar_one_or_none()

    if active_status is None:
        return

    now = datetime.now()
    rentals = (
        db.execute(select(Rental).join(Invoice, Rental.rental_id == Invoice.rental_id))
        .scalars()
        .all()
    )
    changed = False

    for rental in rentals:
        effective_end = rental.actual_end_date or rental.planned_end_date

        if rental.start_date <= now < effective_end and rental.rental_status_id != active_status.rental_status_id:
            rental.rental_status_id = active_status.rental_status_id
            changed = True

    if changed:
        db.commit()


@router.get("/rentals", response_model=list[RentalResponse])
def get_rentals(db: Session = Depends(get_db)) -> list[Rental]:
    _sync_active_paid_rentals(db)
    return db.execute(select(Rental)).scalars().all()


@router.get("/rentals/{rental_id}", response_model=RentalResponse)
def get_rental(rental_id: UUID, db: Session = Depends(get_db)) -> Rental:
    rental = db.get(Rental, rental_id)

    if rental is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rental not found")

    return rental


@router.get("/rentals/{rental_id}/invoice", response_class=StreamingResponse, responses={200: {"content": {"application/pdf": {}}}})
def download_rental_invoice(rental_id: UUID, db: Session = Depends(get_db)) -> StreamingResponse:
    try:
        invoice_file = generate_rental_invoice_pdf(db, rental_id)
    except RentalInvoiceError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.detail) from exc

    return StreamingResponse(iter([invoice_file.content]), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{invoice_file.filename}"'})
