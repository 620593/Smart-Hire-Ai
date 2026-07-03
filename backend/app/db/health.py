"""Database health checks for SmartHire AI backend."""

from __future__ import annotations

from sqlalchemy import text

from app.core.logging import logger_factory
from app.db.database import get_session_factory


async def check_database_health() -> dict[str, str]:
    """Check whether the configured PostgreSQL database is reachable.

    Returns:
        A dictionary describing the database health state.
    """

    logger = logger_factory("app.db.health")
    session_factory = get_session_factory()

    try:
        async with session_factory() as session:
            await session.execute(text("SELECT 1"))
        return {"database": "healthy"}
    except Exception as exc:  # noqa: BLE001
        logger.warning("Database health check failed: %s", exc)
        return {"database": "unhealthy"}