"""Contraseñas con bcrypt y tokens JWT."""

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import get_settings

# Hash de una clave cualquiera: se usa para que el login tarde lo mismo
# cuando el correo no existe y no se pueda deducir qué correos están registrados.
_HASH_FALSO = bcrypt.hashpw(b"clave-de-relleno", bcrypt.gensalt())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str | None) -> bool:
    objetivo = hashed.encode("utf-8") if hashed else _HASH_FALSO
    coincide = bcrypt.checkpw(password.encode("utf-8"), objetivo)
    return coincide and hashed is not None


def create_access_token(user_id: int) -> str:
    settings = get_settings()
    ahora = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": ahora,
        "exp": ahora + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int | None:
    """Devuelve el id de usuario si el token es válido y no expiró; si no, None."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "sub"]},
        )
        return int(payload["sub"])
    except (jwt.PyJWTError, ValueError):
        return None
