"""Domain models for SmartHire AI backend."""

from app.db.enums import ResumeStatus, UserRole
from app.models.role import Role
from app.models.resume import Resume
from app.models.user import User
from app.models.user_role import user_roles

__all__ = [
    "Role",
    "Resume",
    "ResumeStatus",
    "User",
    "UserRole",
    "user_roles",
]