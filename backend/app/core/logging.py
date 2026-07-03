"""Logging configuration for SmartHire AI backend."""

from __future__ import annotations

import logging
from logging.config import dictConfig
from typing import Any

from app.core.config import Settings, get_settings

_LOGGING_CONFIGURED = False


def build_logging_config(log_level: str) -> dict[str, Any]:
    """Build the standard logging configuration.

    Args:
        log_level: Desired root logging level.

    Returns:
        A logging configuration dictionary compatible with ``dictConfig``.
    """

    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "standard",
                "level": log_level,
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "handlers": ["console"],
            "level": log_level,
        },
        "loggers": {
            "app": {
                "handlers": ["console"],
                "level": log_level,
                "propagate": False,
            },
        },
    }


def configure_logging(settings: Settings | None = None) -> None:
    """Configure application logging once.

    Args:
        settings: Optional settings instance used to determine log level.
    """

    global _LOGGING_CONFIGURED

    if _LOGGING_CONFIGURED:
        return

    active_settings = settings or get_settings()
    log_level = getattr(logging, active_settings.log_level.upper(), logging.INFO)
    dictConfig(build_logging_config(logging.getLevelName(log_level)))
    _LOGGING_CONFIGURED = True


def logger_factory(name: str | None = None) -> logging.Logger:
    """Return a configured logger instance.

    Args:
        name: Optional logger name.

    Returns:
        A configured logger instance.
    """

    configure_logging()
    return logging.getLogger(name or "smarthire_ai")
