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


async def _create_static_schema() -> None:
    """Create all database tables statically using SQLAlchemy Base metadata."""
    logger = logger_factory("app.lifespan.schema")
    try:
        from app.db.base import Base
        from app import models as _models  # noqa: F401
        engine = get_engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Static database schema verified [OK]")
    except Exception as exc:
        logger.warning("Static schema creation notice: %s", exc)


async def _seed_initial_data() -> None:
    """Ensure default roles (ADMIN, RECRUITER, CANDIDATE) and default admin user exist."""
    logger = logger_factory("app.lifespan.seed")
    try:
        from app.db.database import get_session_factory
        from app.db.enums import UserRole
        from app.models.role import Role
        from app.models.user import User
        from app.core.security.password import PasswordManager
        from sqlalchemy import select

        pm = PasswordManager()
        session_factory = get_session_factory()
        async with session_factory() as session:
            # 1. Seed Roles
            roles_map = {}
            for role_enum in [UserRole.ADMIN, UserRole.RECRUITER, UserRole.CANDIDATE]:
                query = select(Role).where(Role.name == role_enum)
                res = await session.execute(query)
                role_obj = res.scalar_one_or_none()
                if not role_obj:
                    role_obj = Role(name=role_enum, description=f"Default {role_enum.value} role")
                    session.add(role_obj)
                    await session.flush()
                    logger.info("Created missing role: %s", role_enum.value)
                roles_map[role_enum] = role_obj

            # 2. Seed Admin User 'ranjith'
            user_q = await session.execute(select(User).where(User.username == "ranjith"))
            admin_user = user_q.scalar_one_or_none()
            if not admin_user:
                admin_user = User(
                    email="ranjith@smarthire.ai",
                    username="ranjith",
                    hashed_password=pm.hash_password("ranjith143"),
                    first_name="Ranjith",
                    last_name="Admin",
                    is_active=True,
                    is_verified=True,
                    is_approved=True,
                )
                admin_user.roles.append(roles_map[UserRole.ADMIN])
                session.add(admin_user)
                logger.info("Seeded default admin user 'ranjith'")
            else:
                admin_user.is_active = True
                admin_user.is_verified = True
                admin_user.is_approved = True

            await session.commit()
    except Exception as exc:
        logger.warning("Failed to seed initial data: %s", exc)


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

    # Create static schema & seed initial roles/users on startup
    await _create_static_schema()
    await _seed_initial_data()

    logger.info("SmartHire AI Backend ready [OK]")
    yield
    logger.info("SmartHire AI Backend stopped")
