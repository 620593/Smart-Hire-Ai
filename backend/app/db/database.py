"""Database engine and session factory helpers for SmartHire AI backend."""

from __future__ import annotations

from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import Settings, get_settings


def _resolve_settings(settings: Settings | None = None) -> Settings:
    """Return the active settings instance.

    Args:
        settings: Optional explicit settings override.

    Returns:
        The resolved settings object.
    """

    return settings or get_settings()


@lru_cache(maxsize=8)
def _create_engine(
    database_url: str,
    database_echo: bool,
    database_pool_size: int,
    database_max_overflow: int,
    database_pool_timeout: int,
    database_pool_recycle: int,
) -> AsyncEngine:
    """Create and cache the shared asynchronous SQLAlchemy engine."""

    return create_async_engine(
        database_url,
        echo=database_echo,
        future=True,
        pool_pre_ping=True,
        pool_size=database_pool_size,
        max_overflow=database_max_overflow,
        pool_timeout=database_pool_timeout,
        pool_recycle=database_pool_recycle,
    )


@lru_cache(maxsize=8)
def _create_session_factory(
    database_url: str,
    database_echo: bool,
    database_pool_size: int,
    database_max_overflow: int,
    database_pool_timeout: int,
    database_pool_recycle: int,
) -> async_sessionmaker[AsyncSession]:
    """Create and cache the shared async session factory."""

    engine = _create_engine(
        database_url=database_url,
        database_echo=database_echo,
        database_pool_size=database_pool_size,
        database_max_overflow=database_max_overflow,
        database_pool_timeout=database_pool_timeout,
        database_pool_recycle=database_pool_recycle,
    )
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


def get_engine(settings: Settings | None = None) -> AsyncEngine:
    """Return the shared asynchronous database engine.

    Args:
        settings: Optional explicit settings override.

    Returns:
        The shared async SQLAlchemy engine.
    """

    active_settings = _resolve_settings(settings)
    return _create_engine(
        database_url=active_settings.database_url,
        database_echo=active_settings.database_echo,
        database_pool_size=active_settings.database_pool_size,
        database_max_overflow=active_settings.database_max_overflow,
        database_pool_timeout=active_settings.database_pool_timeout,
        database_pool_recycle=active_settings.database_pool_recycle,
    )


def get_session_factory(settings: Settings | None = None) -> async_sessionmaker[AsyncSession]:
    """Return the shared async session factory.

    Args:
        settings: Optional explicit settings override.

    Returns:
        The shared async session factory.
    """

    active_settings = _resolve_settings(settings)
    return _create_session_factory(
        database_url=active_settings.database_url,
        database_echo=active_settings.database_echo,
        database_pool_size=active_settings.database_pool_size,
        database_max_overflow=active_settings.database_max_overflow,
        database_pool_timeout=active_settings.database_pool_timeout,
        database_pool_recycle=active_settings.database_pool_recycle,
    )