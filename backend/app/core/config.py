"""Application settings for SmartHire AI backend."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.constants import (
    APP_ENV,
    APP_NAME,
    APP_VERSION,
    API_V1_PREFIX,
    DEFAULT_HOST,
    DEFAULT_LOG_LEVEL,
    DEFAULT_PORT,
)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = Field(default=APP_NAME, alias="APP_NAME")
    app_version: str = Field(default=APP_VERSION, alias="APP_VERSION")
    app_env: str = Field(default=APP_ENV, alias="APP_ENV")
    debug: bool = Field(default=False, alias="DEBUG")
    api_v1_prefix: str = Field(default=API_V1_PREFIX, alias="API_V1_PREFIX")
    host: str = Field(default=DEFAULT_HOST, alias="HOST")
    port: int = Field(default=DEFAULT_PORT, alias="PORT")
    log_level: str = Field(default=DEFAULT_LOG_LEVEL, alias="LOG_LEVEL")
    cors_allowed_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173"],
        alias="CORS_ALLOWED_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached application settings instance.

    Returns:
        The application settings.
    """

    return Settings()