"""User model for SmartHire AI authentication domain."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import BaseModel
from app.models.user_role import user_roles

if TYPE_CHECKING:
    from app.models.role import Role
    from app.models.resume import Resume


class User(BaseModel):
    """Represent a reusable user record for future authentication flows."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(length=255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(
        String(length=50), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(length=255), nullable=False)
    first_name: Mapped[str | None] = mapped_column(String(length=100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(length=100), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(length=20), nullable=True)
    profile_picture: Mapped[str | None] = mapped_column(String(length=255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    roles: Mapped[list["Role"]] = relationship(
        secondary=user_roles,
        back_populates="users",
        lazy="selectin",
        passive_deletes=True,
    )

    resumes: Mapped[list["Resume"]] = relationship(
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Future relationship placeholders:
    # sessions = relationship("Session", back_populates="user")