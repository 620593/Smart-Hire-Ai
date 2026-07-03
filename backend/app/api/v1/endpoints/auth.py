"""Authentication endpoints for user registration, login, logout, and token refresh."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response, Request, status

from app.core.security.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    RecruiterRegisterRequest,
    RegisterRequest,
    RefreshTokenRequest,
    TokenResponse,
)
from app.services.auth import AuthenticationService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/register",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Register a new candidate user."""
    auth_service = AuthenticationService(db)
    user = await auth_service.register(payload)
    return user


@router.post(
    "/register/recruiter",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_recruiter(
    payload: RecruiterRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Register a new recruiter account (requires admin approval before login)."""
    auth_service = AuthenticationService(db)
    user = await auth_service.register_recruiter(payload)
    return user



@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
async def login(
    response: Response,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Log in an existing user and set refresh token cookie."""
    auth_service = AuthenticationService(db)
    user, access_token, refresh_token = await auth_service.login(payload)

    # Set refresh token as secure HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 3600,  # 7 days
        path="/",
    )

    return TokenResponse(access_token=access_token)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
async def refresh_token(
    request: Request,
    response: Response,
    payload: RefreshTokenRequest | None = None,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Refresh access and refresh tokens using cookie or body token."""
    # Attempt to retrieve refresh token from cookies first, then from the body
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token and payload and payload.refresh_token:
        refresh_token = payload.refresh_token

    if not refresh_token:
        from app.core.security.exceptions import Unauthorized
        raise Unauthorized("Refresh token is missing.")

    auth_service = AuthenticationService(db)
    access_token, new_refresh_token = await auth_service.refresh_token(refresh_token)

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 3600,
        path="/",
    )

    return TokenResponse(access_token=access_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout(
    response: Response,
) -> None:
    """Log out user by clearing the refresh token cookie."""
    response.delete_cookie(
        key="refresh_token",
        path="/",
    )
    return None


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_200_OK,
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Retrieve details of the currently authenticated active user."""
    return current_user
