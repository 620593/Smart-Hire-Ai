"""User-role association table for SmartHire AI backend."""

from __future__ import annotations

from sqlalchemy import ForeignKey, Table, Column
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.db.base import Base


user_roles = Table(
    "user_roles",
    Base.metadata,
    Column(
        "user_id",
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    ),
    Column(
        "role_id",
        PGUUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    ),
)