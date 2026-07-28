"""Application lifespan events for SmartHire AI backend."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app.core.logging import logger_factory
from app.db.database import get_engine

_DB_PROBE_RETRIES = 5       # attempts before giving up
_DB_PROBE_DELAY_S = 2.0     # initial delay between retries (doubles each time)


async def _wait_for_db() -> None:
    """Probe the database connection on startup, retrying on transient errors.

    PostgreSQL on Windows can briefly report 'recovery mode' immediately after
    a CHECKPOINT.  We retry up to _DB_PROBE_RETRIES times with exponential
    backoff so the app server never starts in a broken state.

    Raises:
        RuntimeError: If the database is still unreachable after all retries.
    """
    logger = logger_factory("app.lifespan")
    engine = get_engine()
    delay = _DB_PROBE_DELAY_S

    for attempt in range(1, _DB_PROBE_RETRIES + 1):
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            logger.info("Database connection verified (attempt %d/%d)", attempt, _DB_PROBE_RETRIES)
            return
        except Exception as exc:
            logger.warning(
                "DB probe attempt %d/%d failed: %s — retrying in %.0fs",
                attempt,
                _DB_PROBE_RETRIES,
                exc,
                delay,
            )
            if attempt < _DB_PROBE_RETRIES:
                await asyncio.sleep(delay)
                delay = min(delay * 2, 30)  # cap at 30 s

    raise RuntimeError(
        "Database is unreachable after %d attempts. "
        "Ensure PostgreSQL is running and DATABASE_* settings in .env are correct."
        % _DB_PROBE_RETRIES
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage application startup and shutdown lifecycle events.

    Performs a database connectivity probe with retries on startup so the
    server is never handed to uvicorn while PostgreSQL is still warming up.

    Args:
        app: The FastAPI application instance.

    Yields:
        Control back to FastAPI during the application lifetime.
    """

    logger = logger_factory("app.lifespan")
    logger.info("SmartHire AI Backend starting…")

    await _wait_for_db()

    logger.info("SmartHire AI Backend ready [OK]")
    yield
    logger.info("SmartHire AI Backend stopped")