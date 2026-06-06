"""seed lookup tables

Revision ID: 1c2f3a4b5d6e
Revises: c828a5b82cf5
Create Date: 2026-06-06 12:25:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "1c2f3a4b5d6e"
down_revision: Union[str, Sequence[str], None] = "c828a5b82cf5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


LOOKUP_SEEDS = {
    "car_status": (
        "car_status_id",
        [
            ("180179fb-e59d-5774-b986-74c000c8501d", "available"),
            ("44de8018-1b88-5236-b067-27cd99650af9", "rented"),
            ("f3b237eb-2286-5bed-a450-314f14740255", "maintenance"),
            ("c23b024c-0b60-5364-bbc3-a2fecb5b59ce", "unavailable"),
        ],
    ),
    "car_type": (
        "car_type_id",
        [
            ("8d877559-124b-5897-b4b8-4643fcc94716", "economy"),
            ("a776ad86-4b52-5fe1-b09d-a08f1cdd6517", "compact"),
            ("500eea37-71e3-5284-8094-240b8c321fde", "sedan"),
            ("0c8432e9-d00e-5e6c-9328-bb898f3c59ed", "suv"),
            ("39b7d93a-4d2c-5065-b850-da220870b793", "van"),
            ("5d3e4a4e-c908-5820-93c9-f1d3384778a3", "luxury"),
        ],
    ),
    "fuel_type": (
        "fuel_type_id",
        [
            ("29c8ca9c-abed-5c9c-afa3-88619bdbdc0d", "petrol"),
            ("0c36cb7c-db1b-5841-adf9-79edb40786d0", "diesel"),
            ("fe04f26a-8824-5b89-947f-d8d26734fdc3", "hybrid"),
            ("2c18c7af-f02b-54f1-bfdd-5a87654d26c6", "electric"),
        ],
    ),
    "invoice_status": (
        "invoice_status_id",
        [
            ("765dd5ed-70a9-5e50-a2ab-9a751c9b45cd", "draft"),
            ("7a8cb000-19bc-5adb-9e32-e2620dc6b5aa", "issued"),
            ("3b4bebce-c279-54d9-ba4b-5c25123841cd", "cancelled"),
            ("96b98742-d0e4-51a9-a175-a5249b7eab21", "paid"),
        ],
    ),
    "payment_method": (
        "payment_method_id",
        [
            ("deedddf0-eac9-5930-a23c-8e2649b47e11", "Blik"),
            ("c10b61af-0db4-5a08-a309-6201957cf7e7", "card"),
            ("ef6a025b-b387-5ec8-b188-9effbc46ac0e", "Apple Pay"),
            ("5bddf6c9-64fd-52a4-a140-b4d0931ea566", "Google Pay"),
        ],
    ),
    "payment_status": (
        "payment_status_id",
        [
            ("bee18f19-7077-523f-8111-f914d5cbb30e", "pending"),
            ("134e50bf-6833-537a-826a-38b2e9f67a05", "paid"),
            ("a9b0adfd-04ab-53af-89e0-9aec82f71682", "failed"),
        ],
    ),
    "rental_status": (
        "rental_status_id",
        [
            ("87f94d5b-81bf-56ba-9d85-ede5a2f9d811", "reserved"),
            ("f1c56474-3aa4-5f0a-90d9-6954a218cd25", "active"),
            ("404f045c-bb8b-55b1-8cbf-61f3c0f32304", "completed"),
            ("97c5f55f-a551-566f-8b69-3ae4db27cee7", "cancelled"),
        ],
    ),
    "transmission": (
        "transmission_id",
        [
            ("42ca4d36-d1e8-5e5e-9356-0330b255087a", "manual"),
            ("e850d3ca-be5e-59d9-8b8c-7616cdbe1785", "automatic"),
        ],
    ),
}


def _sql_values(rows: list[tuple[str, str]]) -> str:
    return ",\n        ".join(f"('{row_id}', '{name}')" for row_id, name in rows)


def upgrade() -> None:
    for table_name, (id_column, rows) in LOOKUP_SEEDS.items():
        op.execute(
            f"""
            INSERT INTO {table_name} ({id_column}, name)
            VALUES
                {_sql_values(rows)}
            ON CONFLICT (name) DO NOTHING
            """
        )


def downgrade() -> None:
    for table_name, (_, rows) in reversed(LOOKUP_SEEDS.items()):
        names = ", ".join(f"'{name}'" for _, name in rows)
        op.execute(f"DELETE FROM {table_name} WHERE name IN ({names})")
