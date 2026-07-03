"""Version 1 API router aggregation for SmartHire AI backend."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints.health import router as health_router


def create_api_v1_router(api_v1_prefix: str) -> APIRouter:
    """Create the aggregated API v1 router.

    Args:
        api_v1_prefix: Prefix for the versioned API routes.

    Returns:
        An APIRouter containing all v1 endpoints.
    """

    router = APIRouter(prefix=api_v1_prefix)
    router.include_router(health_router)
    return router