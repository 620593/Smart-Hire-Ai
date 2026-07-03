"""Request logging middleware for SmartHire AI backend."""

from __future__ import annotations

from fastapi import Request, Response
from starlette.middleware.base import RequestResponseEndpoint

from app.core.logging import logger_factory


async def request_logging_middleware(
    request: Request,
    call_next: RequestResponseEndpoint,
) -> Response:
    """Log request method, path, and status code.

    Args:
        request: Incoming request.
        call_next: Next middleware or route handler.

    Returns:
        The generated response.
    """

    logger = logger_factory("app.middleware.request")
    response = await call_next(request)
    logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
    return response