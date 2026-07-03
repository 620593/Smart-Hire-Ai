"""Common dependency helpers for future backend injection points."""

from __future__ import annotations

from app.core.config import Settings, get_settings


def get_settings_dependency() -> Settings:
    """Return the application settings for dependency injection.

    Returns:
        The application settings instance.
    """

    return get_settings()