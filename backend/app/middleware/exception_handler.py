"""Global exception handlers for SmartHire AI backend."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging import logger_factory


def _error_payload(
    error_type: str,
    message: str,
    details: Any | None = None,
) -> dict[str, Any]:
    """Build a standard JSON error payload.

    Args:
        error_type: Machine-readable error type.
        message: Human-readable error message.
        details: Optional validation or debugging details.

    Returns:
        A JSON-serializable error payload.
    """

    payload: dict[str, Any] = {
        "error": {
            "type": error_type,
            "message": message,
        }
    }
    if details is not None:
        payload["error"]["details"] = details
    return payload


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI application.

    Args:
        app: The FastAPI application instance.
    """

    logger = logger_factory("app.middleware.exception")

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        """Handle FastAPI HTTP exceptions with a JSON payload."""

        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload(
                error_type="HTTPException",
                message=str(exc.detail),
            ),
        )

    from app.core.security.exceptions import SecurityException

    @app.exception_handler(SecurityException)
    async def security_exception_handler(request: Request, exc: SecurityException) -> JSONResponse:
        """Handle security domain exceptions with standard error envelope."""

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        """Handle request validation errors with a JSON payload."""

        return JSONResponse(
            status_code=422,
            content=_error_payload(
                error_type="ValidationError",
                message="Request validation failed.",
                details=exc.errors(),
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Handle unexpected exceptions with a safe JSON payload."""

        logger.exception("Unhandled application error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=_error_payload(
                error_type="InternalServerError",
                message="An unexpected error occurred.",
            ),
        )