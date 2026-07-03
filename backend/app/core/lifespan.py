"""Application lifespan events for SmartHire AI backend."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.logging import logger_factory


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage application startup and shutdown lifecycle events.

    Args:
        app: The FastAPI application instance.

    Yields:
        Control back to FastAPI during the application lifetime.
    """

    logger = logger_factory("app.lifespan")
    logger.info("SmartHire AI Backend Started")
    yield
    logger.info("SmartHire AI Backend Stopped")