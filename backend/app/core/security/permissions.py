"""RBAC and permission helpers for authorization checks."""

from __future__ import annotations

from app.db.enums import UserRole
from app.models.user import User
from app.core.security.exceptions import Forbidden


def verify_user_has_role(user: User, allowed_roles: list[UserRole]) -> None:
    """Verify that a user has at least one of the allowed roles.

    Args:
        user: The authenticated user object.
        allowed_roles: List of roles allowed to access the resource.

    Raises:
        Forbidden: If the user does not have any of the allowed roles.
    """
    user_role_names = [role.name for role in user.roles]
    if not any(role in allowed_roles for role in user_role_names):
        raise Forbidden("You do not have the required permissions to access this resource.")
