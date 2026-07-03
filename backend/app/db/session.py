"""Database session dependency for SmartHire AI backend."""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session for FastAPI dependencies.

    Yields:
        A shared async SQLAlchemy session.
    """

    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session