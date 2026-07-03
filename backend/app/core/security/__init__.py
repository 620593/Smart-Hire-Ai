"""Security module interface for password utilities, JWT tokens, and dependencies."""

from __future__ import annotations

from app.core.security.dependencies import (
    get_current_active_user,
    get_current_admin,
    get_current_user,
)
from app.core.security.exceptions import (
    ExpiredToken,
    Forbidden,
    InvalidCredentials,
    InvalidToken,
    SecurityException,
    TokenTypeMismatch,
    Unauthorized,
)
from app.core.security.jwt import decode_jwt, encode_jwt
from app.core.security.password import PasswordManager
from app.core.security.permissions import verify_user_has_role
from app.core.security.tokens import (
    create_access_token,
    create_refresh_token,
    verify_token,
)

__all__ = [
    "PasswordManager",
    "encode_jwt",
    "decode_jwt",
    "create_access_token",
    "create_refresh_token",
    "verify_token",
    "verify_user_has_role",
    "get_current_user",
    "get_current_active_user",
    "get_current_admin",
    "SecurityException",
    "Unauthorized",
    "Forbidden",
    "InvalidCredentials",
    "InvalidToken",
    "ExpiredToken",
    "TokenTypeMismatch",
]
