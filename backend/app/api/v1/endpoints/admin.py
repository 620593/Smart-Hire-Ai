"""Admin endpoints for recruiter approval and system management."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.security.dependencies import get_current_active_user, get_current_admin
from app.db.session import get_db
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import CurrentUserResponse
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get(
    "/recruiters/pending",
    response_model=list[CurrentUserResponse],
    status_code=status.HTTP_200_OK,
)
async def list_pending_recruiters(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[User]:
    """List all recruiter accounts pending admin approval."""
    user_repo = UserRepository(db)
    return await user_repo.list_pending_recruiters()


@router.post(
    "/recruiters/{user_id}/approve",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_200_OK,
)
async def approve_recruiter(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> User:
    """Approve a recruiter's account so they can log in."""
    user_repo = UserRepository(db)
    user = await user_repo.set_recruiter_approval(user_id, approved=True)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Recruiter not found.")
    return user


@router.post(
    "/recruiters/{user_id}/reject",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_200_OK,
)
async def reject_recruiter(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> User:
    """Reject / deactivate a recruiter's account."""
    user_repo = UserRepository(db)
    user = await user_repo.set_recruiter_approval(user_id, approved=False)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Recruiter not found.")
    return user
