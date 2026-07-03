"""Security exceptions for SmartHire AI authentication domain."""

from __future__ import annotations

from typing import Any
from fastapi import status


class SecurityException(Exception):
    """Base exception for all security and authentication errors."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Any | None = None,
    ) -> None:
        """Initialize the security exception.

        Args:
            status_code: HTTP status code.
            code: Unique machine-readable error code.
            message: Safe human-readable error message.
            details: Optional error details.
        """
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or []


class Unauthorized(SecurityException):
    """Raised when authentication is required but missing or invalid."""

    def __init__(
        self,
        message: str = "Authentication credentials were not provided or are invalid.",
        code: str = "UNAUTHORIZED",
        details: Any | None = None,
    ) -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code=code,
            message=message,
            details=details,
        )


class Forbidden(SecurityException):
    """Raised when user has authentication but lacks required permissions."""

    def __init__(
        self,
        message: str = "You do not have permission to perform this action.",
        code: str = "FORBIDDEN",
        details: Any | None = None,
    ) -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code=code,
            message=message,
            details=details,
        )


class InvalidCredentials(Unauthorized):
    """Raised when username/email and password combination is incorrect."""

    def __init__(
        self,
        message: str = "Incorrect email/username or password.",
        details: Any | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="INVALID_CREDENTIALS",
            details=details,
        )


class InvalidToken(Unauthorized):
    """Raised when a provided JWT is invalid, malformed, or cannot be parsed."""

    def __init__(
        self,
        message: str = "The authentication token is invalid or malformed.",
        details: Any | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="INVALID_TOKEN",
            details=details,
        )


class ExpiredToken(Unauthorized):
    """Raised when a provided JWT has expired."""

    def __init__(
        self,
        message: str = "The authentication token has expired.",
        details: Any | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="EXPIRED_TOKEN",
            details=details,
        )


class TokenTypeMismatch(Unauthorized):
    """Raised when a token type claim does not match what was expected."""

    def __init__(
        self,
        message: str = "The token type claim is invalid for this endpoint.",
        details: Any | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="TOKEN_TYPE_MISMATCH",
            details=details,
        )
