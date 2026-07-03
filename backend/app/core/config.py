"""Application settings for SmartHire AI backend."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL

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
    database_host: str = Field(default="localhost", alias="DATABASE_HOST")
    database_port: int = Field(default=5432, alias="DATABASE_PORT")
    database_user: str = Field(default="postgres", alias="DATABASE_USER")
    database_password: str = Field(default="postgres", alias="DATABASE_PASSWORD")
    database_name: str = Field(default="smarthire_ai", alias="DATABASE_NAME")
    database_echo: bool = Field(default=False, alias="DATABASE_ECHO")
    database_pool_size: int = Field(default=10, alias="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=20, alias="DATABASE_MAX_OVERFLOW")
    database_pool_timeout: int = Field(default=30, alias="DATABASE_POOL_TIMEOUT")
    database_pool_recycle: int = Field(default=1800, alias="DATABASE_POOL_RECYCLE")
    database_url: str = Field(default="", alias="DATABASE_URL")

    jwt_secret_key: str = Field(default="dev_secret_key_change_me_in_production", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    password_hash_memory_cost: int = Field(default=65536, alias="PASSWORD_HASH_MEMORY_COST")
    password_hash_time_cost: int = Field(default=3, alias="PASSWORD_HASH_TIME_COST")
    password_hash_parallelism: int = Field(default=4, alias="PASSWORD_HASH_PARALLELISM")
    password_hash_hash_len: int = Field(default=32, alias="PASSWORD_HASH_HASH_LEN")
    password_hash_salt_len: int = Field(default=16, alias="PASSWORD_HASH_SALT_LEN")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    def model_post_init(self, __context: Any) -> None:
        """Derive the PostgreSQL connection URL from the individual settings."""

        self.database_url = URL.create(
            drivername="postgresql+asyncpg",
            username=self.database_user,
            password=self.database_password,
            host=self.database_host,
            port=self.database_port,
            database=self.database_name,
        ).render_as_string(hide_password=False)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached application settings instance.

    Returns:
        The application settings.
    """

    return Settings()