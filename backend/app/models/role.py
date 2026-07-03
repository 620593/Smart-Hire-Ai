"""Role model for SmartHire AI authentication domain."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import BaseModel
from app.db.enums import UserRole
from app.models.user_role import user_roles

if TYPE_CHECKING:
    from app.models.user import User


class Role(BaseModel):
    """Represent a reusable role record for future authorization rules."""

    __tablename__ = "roles"

    name: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role_enum", native_enum=False, length=20),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(String(length=255), nullable=True)

    users: Mapped[list["User"]] = relationship(
        secondary=user_roles,
        back_populates="roles",
        lazy="selectin",
        passive_deletes=True,
    )