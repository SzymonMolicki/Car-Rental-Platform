"""enforce customer and numeric validation

Revision ID: a7b8c9d0e1f2
Revises: 9f2a6b7c8d9e
Create Date: 2026-06-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "9f2a6b7c8d9e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _invalid_count(sql: str) -> int:
    return int(op.get_bind().execute(sa.text(sql)).scalar_one())


def upgrade() -> None:
    """Upgrade schema."""
    invalid_customers = _invalid_count(
        """
        SELECT COUNT(*)
        FROM customer
        WHERE date_of_birth IS NULL
           OR driver_license_no IS NULL
           OR length(trim(driver_license_no)) = 0
        """
    )
    if invalid_customers:
        raise RuntimeError(
            "Cannot require customer.date_of_birth and customer.driver_license_no while existing customers have missing values."
        )

    invalid_cars = _invalid_count(
        """
        SELECT COUNT(*)
        FROM car
        WHERE production_year < 1886
           OR seats NOT BETWEEN 1 AND 60
           OR mileage < 0
           OR daily_rate <= 0
           OR length(trim(vin)) = 0
           OR length(trim(plate_number)) = 0
        """
    )
    if invalid_cars:
        raise RuntimeError("Cannot add car validation constraints while existing cars contain invalid values.")

    invalid_discounts = _invalid_count(
        """
        SELECT COUNT(*)
        FROM discount
        WHERE percent_value <= 0
           OR percent_value > 100
           OR (valid_from IS NOT NULL AND valid_to IS NOT NULL AND valid_from > valid_to)
           OR length(trim(name)) = 0
           OR length(trim(code)) = 0
        """
    )
    if invalid_discounts:
        raise RuntimeError("Cannot add discount validation constraints while existing discounts contain invalid values.")

    op.alter_column("customer", "date_of_birth", existing_type=sa.Date(), nullable=False)
    op.alter_column("customer", "driver_license_no", existing_type=sa.String(), nullable=False)

    op.create_check_constraint(
        "ck_customer_driver_license_no_not_blank",
        "customer",
        "length(trim(driver_license_no)) > 0",
    )
    op.create_check_constraint("ck_car_production_year_min", "car", "production_year >= 1886")
    op.create_check_constraint("ck_car_seats_range", "car", "seats BETWEEN 1 AND 60")
    op.create_check_constraint("ck_car_mileage_non_negative", "car", "mileage >= 0")
    op.create_check_constraint("ck_car_daily_rate_positive", "car", "daily_rate > 0")
    op.create_check_constraint("ck_car_vin_not_blank", "car", "length(trim(vin)) > 0")
    op.create_check_constraint("ck_car_plate_number_not_blank", "car", "length(trim(plate_number)) > 0")
    op.create_check_constraint("ck_discount_percent_value_range", "discount", "percent_value > 0 AND percent_value <= 100")
    op.create_check_constraint(
        "ck_discount_valid_date_range",
        "discount",
        "valid_from IS NULL OR valid_to IS NULL OR valid_from <= valid_to",
    )
    op.create_check_constraint("ck_discount_name_not_blank", "discount", "length(trim(name)) > 0")
    op.create_check_constraint("ck_discount_code_not_blank", "discount", "length(trim(code)) > 0")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("ck_discount_code_not_blank", "discount", type_="check")
    op.drop_constraint("ck_discount_name_not_blank", "discount", type_="check")
    op.drop_constraint("ck_discount_valid_date_range", "discount", type_="check")
    op.drop_constraint("ck_discount_percent_value_range", "discount", type_="check")
    op.drop_constraint("ck_car_plate_number_not_blank", "car", type_="check")
    op.drop_constraint("ck_car_vin_not_blank", "car", type_="check")
    op.drop_constraint("ck_car_daily_rate_positive", "car", type_="check")
    op.drop_constraint("ck_car_mileage_non_negative", "car", type_="check")
    op.drop_constraint("ck_car_seats_range", "car", type_="check")
    op.drop_constraint("ck_car_production_year_min", "car", type_="check")
    op.drop_constraint("ck_customer_driver_license_no_not_blank", "customer", type_="check")

    op.alter_column("customer", "driver_license_no", existing_type=sa.String(), nullable=True)
    op.alter_column("customer", "date_of_birth", existing_type=sa.Date(), nullable=True)
