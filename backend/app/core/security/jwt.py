"""Low-level JWT utility functions using pyjwt."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from app.core.config import get_settings
from app.core.security.exceptions import ExpiredToken, InvalidToken


def encode_jwt(payload: dict[str, Any], expires_delta: timedelta) -> str:
    """Encode a JWT with the given payload and expiration.

    Args:
        payload: The payload claims.
        expires_delta: The duration until expiration.

    Returns:
        The encoded JWT.
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)
    to_encode = payload.copy()
    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    })
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_jwt(token: str) -> dict[str, Any]:
    """Decode and validate a JWT.

    Args:
        token: The encoded JWT.

    Returns:
        The decoded claims payload.

    Raises:
        ExpiredToken: If the token signature is expired.
        InvalidToken: If the token is invalid or malformed.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "iat"]},
            leeway=30,
        )
        return payload
    except ExpiredSignatureError as exc:
        raise ExpiredToken() from exc
    except InvalidTokenError as exc:
        raise InvalidToken() from exc
