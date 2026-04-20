import os


def _get_required_env(name: str, min_length: int | None = None) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} environment variable is not set")
    if min_length is not None and len(value) < min_length:
        raise RuntimeError(f"{name} must be at least {min_length} characters long")
    return value


SECRET_KEY = _get_required_env(name="SECRET_KEY", min_length=32)
ADMIN_USERNAME = _get_required_env("ADMIN_USERNAME").strip()
ADMIN_PASSWORD_HASH = _get_required_env("ADMIN_PASSWORD_HASH")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
