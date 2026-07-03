"""Authentication service containing all authentication business logic."""

from __future__ import annotations

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security.exceptions import InvalidCredentials, InvalidToken, Unauthorized
from app.core.security.password import PasswordManager
from app.core.security.tokens import create_access_token, create_refresh_token, verify_token
from app.core.security.exceptions import SecurityException
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest


class AuthenticationService:
    """Orchestrate authentication and authorization logic."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the service with database session.

        Args:
            db: The async database session.
        """
        self.db = db
        self.user_repo = UserRepository(db)
        self.password_manager = PasswordManager()

    async def register(self, user_data: RegisterRequest) -> User:
        """Register a new candidate.

        Args:
            user_data: Registration request containing user details.

        Returns:
            The registered User model instance.

        Raises:
            SecurityException: If email or username is already registered.
        """
        existing_email = await self.user_repo.find_by_email(user_data.email)
        if existing_email:
            raise SecurityException(
                status_code=400,
                code="EMAIL_ALREADY_REGISTERED",
                message="A user with this email address already exists.",
            )

        existing_username = await self.user_repo.find_by_username(user_data.username)
        if existing_username:
            raise SecurityException(
                status_code=400,
                code="USERNAME_ALREADY_TAKEN",
                message="A user with this username already exists.",
            )

        hashed_password = self.password_manager.hash_password(user_data.password)
        return await self.user_repo.create_user(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone_number=user_data.phone_number,
        )

    async def login(self, login_data: LoginRequest) -> tuple[User, str, str]:
        """Authenticate user, update login timestamp, and generate tokens.

        Args:
            login_data: Login credentials (email/username and password).

        Returns:
            A tuple of (User model, access_token, refresh_token).

        Raises:
            InvalidCredentials: If user not found or password incorrect.
            Unauthorized: If the user is inactive.
        """
        user: User | None = None

        if login_data.email:
            user = await self.user_repo.find_by_email(login_data.email)
        elif login_data.username:
            user = await self.user_repo.find_by_username(login_data.username)
        elif login_data.username_or_email:
            if "@" in login_data.username_or_email:
                user = await self.user_repo.find_by_email(login_data.username_or_email)
            if not user:
                user = await self.user_repo.find_by_username(login_data.username_or_email)

        if not user:
            raise InvalidCredentials()

        if not self.password_manager.verify_password(login_data.password, user.hashed_password):
            raise InvalidCredentials()

        if not user.is_active:
            raise Unauthorized("User account is disabled.")

        # Rehash password if parameters changed
        if self.password_manager.needs_rehash(user.hashed_password):
            new_hash = self.password_manager.hash_password(login_data.password)
            await self.user_repo.update_password(user.id, new_hash)

        # Assign default role if none assigned
        roles = [role.name.value if hasattr(role.name, "value") else str(role.name) for role in user.roles]
        primary_role = roles[0] if roles else "candidate"

        access_token = create_access_token(
            subject=str(user.id),
            email=user.email,
            role=primary_role,
        )
        refresh_token = create_refresh_token(subject=str(user.id))

        await self.user_repo.update_last_login(user.id)

        return user, access_token, refresh_token

    async def refresh_token(self, refresh_token: str) -> tuple[str, str]:
        """Validate refresh token and issue new access/refresh tokens.

        Args:
            refresh_token: The client's refresh token.

        Returns:
            A tuple of (new_access_token, new_refresh_token).

        Raises:
            InvalidToken: If the refresh token is invalid or user does not exist.
            Unauthorized: If the user account is disabled.
        """
        payload = verify_token(refresh_token, expected_type="refresh")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise InvalidToken("Token is missing user identifier.")

        try:
            user_id = UUID(user_id_str)
        except ValueError as exc:
            raise InvalidToken("Token contains an invalid user identifier.") from exc

        user = await self.user_repo.find_by_id(user_id)
        if not user:
            raise InvalidToken("User associated with this token does not exist.")

        if not user.is_active:
            raise Unauthorized("User account is disabled.")

        roles = [role.name.value if hasattr(role.name, "value") else str(role.name) for role in user.roles]
        primary_role = roles[0] if roles else "candidate"

        new_access_token = create_access_token(
            subject=str(user.id),
            email=user.email,
            role=primary_role,
        )
        new_refresh_token = create_refresh_token(subject=str(user.id))

        return new_access_token, new_refresh_token
