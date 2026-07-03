"""Resume model for SmartHire AI domain models."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.enums import ResumeStatus
from app.db.mixins import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class Resume(BaseModel):
    """Represent an uploaded resume owned by a single candidate."""

    __tablename__ = "resumes"
    __table_args__ = (
        Index("ix_resumes_user_id", "user_id"),
        Index("ix_resumes_status", "status"),
        Index("ix_resumes_uploaded_at", "uploaded_at"),
    )

    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    original_filename: Mapped[str] = mapped_column(String(length=255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(length=255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(length=500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(length=100), nullable=False)
    status: Mapped[ResumeStatus] = mapped_column(
        SAEnum(ResumeStatus, name="resume_status_enum", native_enum=False, length=20),
        default=ResumeStatus.PENDING,
        server_default=ResumeStatus.PENDING.value,
        nullable=False,
    )
    parsed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        back_populates="resumes",
        lazy="selectin",
    )