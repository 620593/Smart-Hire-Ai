"""Authentication and authorization dependencies for FastAPI endpoints."""

from __future__ import annotations

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.session import get_db
from app.db.enums import UserRole
from app.models.user import User
from app.core.security.tokens import verify_token
from app.core.security.exceptions import Unauthorized, Forbidden
from app.repositories.user import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Retrieve the current user based on the JWT access token.

    Args:
        token: The bearer token from the Authorization header.
        db: The database session.

    Returns:
        The authenticated user.

    Raises:
        Unauthorized: If token is missing, invalid, or user does not exist.
    """
    if not token:
        raise Unauthorized("Missing authentication token.")

    payload = verify_token(token, expected_type="access")
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise Unauthorized("Token is missing user identifier.")

    try:
        user_id = UUID(user_id_str)
    except ValueError as exc:
        raise Unauthorized("Token contains an invalid user identifier.") from exc

    user_repo = UserRepository(db)
    user = await user_repo.find_by_id(user_id)
    if not user:
        raise Unauthorized("User associated with this token does not exist.")

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the authenticated user is active.

    Args:
        current_user: The authenticated user.

    Returns:
        The active user.

    Raises:
        Unauthorized: If the user is inactive.
    """
    if not current_user.is_active:
        raise Unauthorized("User account is disabled.")
    return current_user


async def get_current_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Ensure the authenticated user has the Admin role.

    Args:
        current_user: The active authenticated user.

    Returns:
        The admin user.

    Raises:
        Forbidden: If the user lacks the Admin role.
    """
    roles = [role.name for role in current_user.roles]
    if UserRole.ADMIN not in roles:
        raise Forbidden("You do not have the required permissions to perform this action.")
    return current_user
