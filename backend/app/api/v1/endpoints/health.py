"""Health endpoint for SmartHire AI backend."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", summary="Health check")
async def read_health() -> dict[str, str]:
    """Return the health status payload.

    Returns:
        A JSON payload indicating service health.
    """

    return {"status": "healthy"}