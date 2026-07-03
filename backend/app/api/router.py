"""Top-level API router aggregation for SmartHire AI backend."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.api import create_api_v1_router


def create_api_router(api_v1_prefix: str) -> APIRouter:
    """Create the top-level API router.

    Args:
        api_v1_prefix: Prefix for the versioned API routes.

    Returns:
        An APIRouter that aggregates all API versions.
    """

    router = APIRouter()
    router.include_router(create_api_v1_router(api_v1_prefix))
    return router