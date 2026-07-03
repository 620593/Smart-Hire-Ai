"""Process-time middleware for SmartHire AI backend."""

from __future__ import annotations

from time import perf_counter

from fastapi import Request, Response
from starlette.middleware.base import RequestResponseEndpoint


async def process_time_middleware(
    request: Request,
    call_next: RequestResponseEndpoint,
) -> Response:
    """Add an ``X-Process-Time`` header to each response.

    Args:
        request: Incoming request.
        call_next: Next middleware or route handler.

    Returns:
        The generated response with process-time metadata.
    """

    start_time = perf_counter()
    response = await call_next(request)
    process_time = perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.6f}"
    return response