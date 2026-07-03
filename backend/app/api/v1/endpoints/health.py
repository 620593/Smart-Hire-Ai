"""Health endpoint for SmartHire AI backend."""

from __future__ import annotations

from fastapi import APIRouter

from app.db.health import check_database_health

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", summary="Health check")
async def read_health() -> dict[str, str]:
    """Return the health status payload.

    Returns:
        A JSON payload indicating service health.
    """

    return {"status": "healthy"}


@router.get("/database", summary="Database health check")
async def read_database_health() -> dict[str, str]:
    """Return the database health status payload.

    Returns:
        A JSON payload indicating database health.
    """

    return await check_database_health()