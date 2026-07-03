"""High-level token helpers for access and refresh tokens."""

from __future__ import annotations

from datetime import timedelta
from typing import Any
import uuid

from app.core.config import get_settings
from app.core.security.jwt import encode_jwt, decode_jwt
from app.core.security.exceptions import TokenTypeMismatch, InvalidToken


def create_access_token(subject: str, email: str, role: str) -> str:
    """Create a short-lived access token.

    Args:
        subject: The user ID.
        email: The user's email address.
        role: The user's role.

    Returns:
        The encoded access token.
    """
    settings = get_settings()
    payload = {
        "sub": str(subject),
        "email": email,
        "role": role,
        "type": "access",
        "jti": str(uuid.uuid4()),
    }
    return encode_jwt(payload, timedelta(minutes=settings.access_token_expire_minutes))


def create_refresh_token(subject: str) -> str:
    """Create a longer-lived refresh token.

    Args:
        subject: The user ID.

    Returns:
        The encoded refresh token.
    """
    settings = get_settings()
    payload = {
        "sub": str(subject),
        "type": "refresh",
        "jti": str(uuid.uuid4()),
    }
    return encode_jwt(payload, timedelta(days=settings.refresh_token_expire_days))


def verify_token(token: str, expected_type: str) -> dict[str, Any]:
    """Decode and verify a token has the correct type.

    Args:
        token: The encoded JWT.
        expected_type: The expected value of the 'type' claim ("access" or "refresh").

    Returns:
        The decoded token payload.

    Raises:
        TokenTypeMismatch: If the type claim doesn't match the expected type.
        InvalidToken: If the token payload has no type claim or is invalid.
    """
    payload = decode_jwt(token)
    token_type = payload.get("type")
    if not token_type:
        raise InvalidToken("Token is missing the type claim.")

    if token_type != expected_type:
        raise TokenTypeMismatch(
            f"Expected token type '{expected_type}', but got '{token_type}'."
        )

    return payload
