"""Reusable SQLAlchemy mixins for SmartHire AI backend."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UUIDMixin:
    """Provide a UUID primary key for database models."""

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        index=True,
        unique=True,
        nullable=False,
    )


class TimestampMixin:
    """Provide created and updated timestamp columns."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """Provide soft delete fields for future models."""

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )


class AuditMixin:
    """Provide optional audit columns for future models."""

    created_by: Mapped[UUID | None] = mapped_column(
        nullable=True,
        index=True,
    )
    updated_by: Mapped[UUID | None] = mapped_column(
        nullable=True,
        index=True,
    )


class BaseModel(UUIDMixin, TimestampMixin, Base):
    """Abstract base model combining shared UUID and timestamp fields."""

    __abstract__ = True