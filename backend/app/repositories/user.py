"""User repository for accessing user records and roles in database."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import UserRole
from app.models.role import Role
from app.models.user import User



class UserRepository:
    """Implement data access logic for the User entity."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize user repository with database session.

        Args:
            db: The async database session.
        """
        self.db = db

    async def find_by_id(self, user_id: UUID) -> User | None:
        """Retrieve a user by their unique UUID.

        Args:
            user_id: The UUID of the user.

        Returns:
            The user object if found, else None.
        """
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def find_by_email(self, email: str) -> User | None:
        """Retrieve a user by their email address.

        Args:
            email: The email address to look up.

        Returns:
            The user object if found, else None.
        """
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def find_by_username(self, username: str) -> User | None:
        """Retrieve a user by their username.

        Args:
            username: The username to look up.

        Returns:
            The user object if found, else None.
        """
        query = select(User).where(User.username == username)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_user(
        self,
        email: str,
        username: str,
        hashed_password: str,
        first_name: str | None = None,
        last_name: str | None = None,
        phone_number: str | None = None,
    ) -> User:
        """Create a new candidate user in the database.

        Assigns the default CANDIDATE role.

        Args:
            email: User's email.
            username: User's username.
            hashed_password: The hashed password.
            first_name: User's first name.
            last_name: User's last name.
            phone_number: User's phone number.

        Returns:
            The created user instance.
        """
        # Retrieve candidate role to associate with user
        role_query = select(Role).where(Role.name == UserRole.CANDIDATE)
        role_result = await self.db.execute(role_query)
        candidate_role = role_result.scalar_one_or_none()

        if not candidate_role:
            # Fallback if roles table is not seeded
            candidate_role = Role(name=UserRole.CANDIDATE, description="Default candidate role")
            self.db.add(candidate_role)
            await self.db.flush()

        user = User(
            email=email,
            username=username,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            is_active=True,
            is_verified=False,
        )
        user.roles.append(candidate_role)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def create_recruiter_user(
        self,
        email: str,
        username: str,
        hashed_password: str,
        full_name: str,
        company_name: str,
    ) -> User:
        """Create a new recruiter user pending admin approval.

        Assigns the RECRUITER role and sets is_approved=False.

        Args:
            email: Recruiter's email.
            username: Recruiter's username.
            hashed_password: The hashed password.
            full_name: Recruiter's full display name.
            company_name: The company the recruiter belongs to.

        Returns:
            The created user instance.
        """
        role_query = select(Role).where(Role.name == UserRole.RECRUITER)
        role_result = await self.db.execute(role_query)
        recruiter_role = role_result.scalar_one_or_none()

        if not recruiter_role:
            recruiter_role = Role(name=UserRole.RECRUITER, description="Recruiter role")
            self.db.add(recruiter_role)
            await self.db.flush()

        # Split full_name into first/last
        name_parts = full_name.strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else None

        user = User(
            email=email,
            username=username,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            company_name=company_name,
            is_active=True,
            is_verified=False,
            is_approved=False,  # Needs admin approval
        )
        user.roles.append(recruiter_role)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def list_pending_recruiters(self) -> list[User]:
        """List all recruiter accounts pending admin approval."""
        query = (
            select(User)
            .join(User.roles)
            .where(Role.name == UserRole.RECRUITER, User.is_approved == False)  # noqa: E712
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def set_recruiter_approval(self, user_id: UUID, approved: bool) -> User | None:
        """Approve or reject a recruiter's account.

        Args:
            user_id: The UUID of the recruiter.
            approved: True to approve, False to reject/deactivate.

        Returns:
            The updated user instance or None if not found.
        """
        user = await self.find_by_id(user_id)
        if not user:
            return None
        query = (
            update(User)
            .where(User.id == user_id)
            .values(is_approved=approved, is_active=approved)
        )
        await self.db.execute(query)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_last_login(self, user_id: UUID) -> None:
        """Update the last login timestamp of a user.

        Args:
            user_id: The UUID of the user.
        """
        query = (
            update(User)
            .where(User.id == user_id)
            .values(last_login=datetime.now(timezone.utc))
        )
        await self.db.execute(query)
        await self.db.commit()

    async def update_password(self, user_id: UUID, hashed_password: str) -> None:
        """Update a user's password.

        Args:
            user_id: The UUID of the user.
            hashed_password: The new hashed password.
        """
        query = (
            update(User)
            .where(User.id == user_id)
            .values(hashed_password=hashed_password)
        )
        await self.db.execute(query)
        await self.db.commit()
