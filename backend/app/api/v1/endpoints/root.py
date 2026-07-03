"""Root application endpoint for SmartHire AI backend."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(tags=["Root"])


@router.get("/", summary="Application status")
async def read_root() -> dict[str, str]:
    """Return the application status payload.

    Returns:
        A JSON payload describing the running application.
    """

    settings = get_settings()
    return {
        "application": settings.app_name,
        "version": settings.app_version,
        "status": "running",
    }