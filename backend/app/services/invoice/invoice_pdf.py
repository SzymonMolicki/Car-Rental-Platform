from datetime import date, datetime
from decimal import Decimal
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from re import sub
from typing import Any

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


PAGE_HEIGHT = A4[1]
LEFT_MARGIN = 50
TOP_MARGIN = int(PAGE_HEIGHT) - 50
BOTTOM_MARGIN = 50
LINE_HEIGHT = 18
REGULAR_FONT_NAME = "InvoiceRegular"
BOLD_FONT_NAME = "InvoiceBold"
FONT_DIR = Path(__file__).resolve().parent / "fonts"
REGULAR_FONT_PATH = FONT_DIR / "Nexa-ExtraLight.ttf"
BOLD_FONT_PATH = FONT_DIR / "Nexa-Heavy.ttf"


def _format_value(value: Any) -> str:
    if value is None:
        return "-"

    if isinstance(value, Decimal):
        return f"{value:.2f} PLN"

    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M")

    if isinstance(value, date):
        return value.strftime("%Y-%m-%d")

    return str(value)


@lru_cache
def _register_fonts() -> None:
    pdfmetrics.registerFont(TTFont(REGULAR_FONT_NAME, str(REGULAR_FONT_PATH)))
    pdfmetrics.registerFont(TTFont(BOLD_FONT_NAME, str(BOLD_FONT_PATH)))


def _draw_line(pdf: canvas.Canvas, text: str, y: int, font: str = REGULAR_FONT_NAME, size: int = 11) -> int:
    if y < BOTTOM_MARGIN:
        pdf.showPage()
        y = TOP_MARGIN

    pdf.setFont(font, size)
    pdf.drawString(LEFT_MARGIN, y, text)
    return y - LINE_HEIGHT


def _build_pdf(lines: list[tuple[str, str, int]]) -> bytes:
    _register_fonts()

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    y = TOP_MARGIN

    for text, font, size in lines:
        y = _draw_line(pdf, text, y, font, size)

    pdf.save()
    return buffer.getvalue()


def safe_invoice_filename(invoice_number: str) -> str:
    safe_number = sub(r'[\\/:*?"<>|\\s]+', "_", invoice_number).strip("_")
    return f"invoice_{safe_number or 'download'}.pdf"


def build_invoice_pdf(*, invoice: Any, rental: Any, customer: Any, car: Any, pickup_location: Any, return_location: Any, rental_status: Any, invoice_status: Any, payment_status: Any, payment_method: Any, discount: Any) -> bytes:
    customer_name = "-"
    if customer is not None:
        customer_name = f"{customer.first_name} {customer.last_name}".strip()

    car_name = "-"
    if car is not None:
        car_name = f"{car.brand} {car.model}".strip()

    lines = [
        ("Metrocars", BOLD_FONT_NAME, 18),
        ("Invoice", BOLD_FONT_NAME, 16),
        (f"Invoice number: {_format_value(invoice.invoice_number)}", REGULAR_FONT_NAME, 11),
        (f"Issue date: {_format_value(invoice.invoice_issue_date)}", REGULAR_FONT_NAME, 11),
        ("", REGULAR_FONT_NAME, 11),
        ("Customer", BOLD_FONT_NAME, 13),
        (f"Name: {customer_name}", REGULAR_FONT_NAME, 11),
        (f"Email: {_format_value(getattr(customer, 'email', None))}", REGULAR_FONT_NAME, 11),
        (f"Phone: {_format_value(getattr(customer, 'phone', None))}", REGULAR_FONT_NAME, 11),
        ("", REGULAR_FONT_NAME, 11),
        ("Rental", BOLD_FONT_NAME, 13),
        (f"Rental ID: {_format_value(rental.rental_id)}", REGULAR_FONT_NAME, 10),
        (f"Status: {_format_value(getattr(rental_status, 'name', None))}", REGULAR_FONT_NAME, 11),
        (f"Start date: {_format_value(rental.start_date.date())}", REGULAR_FONT_NAME, 11),
        (f"Planned end date: {_format_value(rental.planned_end_date.date())}", REGULAR_FONT_NAME, 11),
        (f"Actual end date: {_format_value(rental.actual_end_date.date() if rental.actual_end_date else None)}", REGULAR_FONT_NAME, 11),
        (f"Pickup location: {_format_value(getattr(pickup_location, 'name', None))}", REGULAR_FONT_NAME, 11),
        (f"Return location: {_format_value(getattr(return_location, 'name', None))}", REGULAR_FONT_NAME, 11),
        ("", REGULAR_FONT_NAME, 11),
        ("Vehicle", BOLD_FONT_NAME, 13),
        (f"Car: {car_name}", REGULAR_FONT_NAME, 11),
        (f"Plate number: {_format_value(getattr(car, 'plate_number', None))}", REGULAR_FONT_NAME, 11),
        (f"VIN: {_format_value(getattr(car, 'vin', None))}", REGULAR_FONT_NAME, 11),
        ("", REGULAR_FONT_NAME, 11),
        ("Payment", BOLD_FONT_NAME, 13),
        (f"Invoice status: {_format_value(getattr(invoice_status, 'name', None))}", REGULAR_FONT_NAME, 11),
        (f"Payment status: {_format_value(getattr(payment_status, 'name', None))}", REGULAR_FONT_NAME, 11),
        (f"Payment method: {_format_value(getattr(payment_method, 'name', None))}", REGULAR_FONT_NAME, 11),
        (f"Discount: {_format_value(getattr(discount, 'code', None))}", REGULAR_FONT_NAME, 11),
        (f"Base amount: {_format_value(invoice.base_amount)}", REGULAR_FONT_NAME, 11),
        (f"Discount amount: {_format_value(invoice.discount_amount)}", REGULAR_FONT_NAME, 11),
        (f"Total amount: {_format_value(invoice.total_amount)}", BOLD_FONT_NAME, 12),
        (f"Paid at: {_format_value(invoice.paid_at)}", REGULAR_FONT_NAME, 11),
    ]

    return _build_pdf(lines)
