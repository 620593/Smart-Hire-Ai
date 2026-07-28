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


def _run_auto_migrations() -> None:
    """Execute Alembic upgrade head automatically on application startup."""
    logger = logger_factory("app.lifespan.migrations")
    try:
        from alembic.config import Config
        from alembic import command
        from pathlib import Path

        base_dir = Path(__file__).resolve().parent.parent.parent
        alembic_ini = base_dir / "alembic.ini"
        if alembic_ini.exists():
            logger.info("Running automatic Alembic migrations (upgrade head)…")
            alembic_cfg = Config(str(alembic_ini))
            command.upgrade(alembic_cfg, "head")
            logger.info("Alembic migrations completed successfully [OK]")
    except Exception as exc:
        logger.warning("Automatic Alembic migration notice: %s", exc)


async def _seed_initial_roles() -> None:
    """Ensure default roles (ADMIN, RECRUITER, CANDIDATE) exist in the database."""
    logger = logger_factory("app.lifespan.roles")
    try:
        from app.db.database import get_session_factory
        from app.db.enums import UserRole
        from app.models.role import Role
        from sqlalchemy import select

        session_factory = get_session_factory()
        async with session_factory() as session:
            for role_name in [UserRole.ADMIN, UserRole.RECRUITER, UserRole.CANDIDATE]:
                query = select(Role).where(Role.name == role_name)
                res = await session.execute(query)
                if not res.scalar_one_or_none():
                    session.add(Role(name=role_name, description=f"Default {role_name.value} role"))
                    logger.info("Created missing role: %s", role_name.value)
            await session.commit()
    except Exception as exc:
        logger.warning("Failed to seed initial roles: %s", exc)


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

    # Automatically apply Alembic migrations and seed roles on startup
    _run_auto_migrations()
    await _seed_initial_roles()

    logger.info("SmartHire AI Backend ready [OK]")
    yield
    logger.info("SmartHire AI Backend stopped")