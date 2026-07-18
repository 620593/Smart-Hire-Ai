"""Comprehensive admin endpoints for the SmartHire AI control panel.

Covers:
  - Recruiter management  (list all, approve, reject, suspend, delete)
  - User management       (list all users, deactivate)
  - System health         (DB, Gemini, Groq API status)
  - Platform stats        (user counts by role/status)
  - Audit log             (recent API activity — last 100 log lines)
"""

from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import logger_factory
from app.core.security.dependencies import get_current_admin
from app.db.enums import UserRole
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import CurrentUserResponse

router = APIRouter(prefix="/admin", tags=["admin"])
logger = logger_factory("app.api.admin")


# ---------------------------------------------------------------------------
# Shared schemas
# ---------------------------------------------------------------------------

class PlatformStats(BaseModel):
    total_users: int
    total_recruiters: int
    total_candidates: int
    pending_recruiters: int
    active_recruiters: int
    suspended_recruiters: int


class ApiStatus(BaseModel):
    service: str
    status: str          # "ok" | "degraded" | "unconfigured"
    latency_ms: float | None = None
    detail: str = ""


class SystemHealth(BaseModel):
    checked_at: str
    database: ApiStatus
    gemini: ApiStatus
    groq: ApiStatus


class AuditEntry(BaseModel):
    timestamp: str
    level: str
    logger: str
    message: str


# ---------------------------------------------------------------------------
# ── Recruiter management ────────────────────────────────────────────────────
# ---------------------------------------------------------------------------

@router.get(
    "/recruiters/pending",
    response_model=list[CurrentUserResponse],
    summary="List recruiters pending approval",
)
async def list_pending_recruiters(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[User]:
    """Return all recruiter accounts that have not yet been approved."""
    return await UserRepository(db).list_pending_recruiters()


@router.get(
    "/recruiters",
    response_model=list[CurrentUserResponse],
    summary="List all recruiter accounts",
)
async def list_all_recruiters(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[User]:
    """Return every recruiter account regardless of approval status."""
    query = select(User).join(User.roles).where(Role.name == UserRole.RECRUITER)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post(
    "/recruiters/{user_id}/approve",
    response_model=CurrentUserResponse,
    summary="Approve a recruiter account",
)
async def approve_recruiter(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> User:
    """Grant a recruiter access to the platform."""
    user = await UserRepository(db).set_recruiter_approval(user_id, approved=True)
    if not user:
        raise HTTPException(status_code=404, detail="Recruiter not found.")
    logger.info("Admin approved recruiter %s", user_id)
    return user


@router.post(
    "/recruiters/{user_id}/reject",
    response_model=CurrentUserResponse,
    summary="Reject / suspend a recruiter account",
)
async def reject_recruiter(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> User:
    """Reject or suspend a recruiter — sets is_approved=False, is_active=False."""
    user = await UserRepository(db).set_recruiter_approval(user_id, approved=False)
    if not user:
        raise HTTPException(status_code=404, detail="Recruiter not found.")
    logger.info("Admin suspended/rejected recruiter %s", user_id)
    return user


@router.delete(
    "/recruiters/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete a recruiter account",
)
async def delete_recruiter(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> None:
    """Hard-delete a recruiter record from the database."""
    user = await UserRepository(db).find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    await db.delete(user)
    await db.commit()
    logger.warning("Admin deleted user %s", user_id)


# ---------------------------------------------------------------------------
# ── User management (all roles) ─────────────────────────────────────────────
# ---------------------------------------------------------------------------

@router.get(
    "/users",
    response_model=list[CurrentUserResponse],
    summary="List all platform users",
)
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> list[User]:
    """Return every user on the platform (all roles)."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())


@router.post(
    "/users/{user_id}/deactivate",
    response_model=CurrentUserResponse,
    summary="Deactivate any user account",
)
async def deactivate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> User:
    """Disable any user account (sets is_active=False)."""
    user = await UserRepository(db).find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = False
    await db.commit()
    await db.refresh(user)
    logger.warning("Admin deactivated user %s", user_id)
    return user


@router.post(
    "/users/{user_id}/activate",
    response_model=CurrentUserResponse,
    summary="Re-activate a user account",
)
async def activate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> User:
    """Re-enable a previously deactivated user."""
    user = await UserRepository(db).find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = True
    await db.commit()
    await db.refresh(user)
    logger.info("Admin re-activated user %s", user_id)
    return user


# ---------------------------------------------------------------------------
# ── Platform statistics ──────────────────────────────────────────────────────
# ---------------------------------------------------------------------------

@router.get(
    "/stats",
    response_model=PlatformStats,
    summary="Platform-wide user statistics",
)
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> PlatformStats:
    """Return aggregate counts: total users, recruiters by status, candidates."""

    async def _count(query):
        r = await db.execute(query)
        return r.scalar() or 0

    total_users = await _count(select(func.count()).select_from(User))

    total_recruiters = await _count(
        select(func.count()).select_from(User).join(User.roles).where(Role.name == UserRole.RECRUITER)
    )
    active_recruiters = await _count(
        select(func.count()).select_from(User).join(User.roles)
        .where(Role.name == UserRole.RECRUITER, User.is_approved == True, User.is_active == True)  # noqa: E712
    )
    pending_recruiters = await _count(
        select(func.count()).select_from(User).join(User.roles)
        .where(Role.name == UserRole.RECRUITER, User.is_approved == False)  # noqa: E712
    )
    suspended_recruiters = await _count(
        select(func.count()).select_from(User).join(User.roles)
        .where(Role.name == UserRole.RECRUITER, User.is_active == False)  # noqa: E712
    )
    total_candidates = await _count(
        select(func.count()).select_from(User).join(User.roles).where(Role.name == UserRole.CANDIDATE)
    )

    return PlatformStats(
        total_users=total_users,
        total_recruiters=total_recruiters,
        total_candidates=total_candidates,
        pending_recruiters=pending_recruiters,
        active_recruiters=active_recruiters,
        suspended_recruiters=suspended_recruiters,
    )


# ---------------------------------------------------------------------------
# ── System health ────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------

async def _check_db(db: AsyncSession) -> ApiStatus:
    t0 = asyncio.get_event_loop().time()
    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
        latency = (asyncio.get_event_loop().time() - t0) * 1000
        return ApiStatus(service="PostgreSQL", status="ok", latency_ms=round(latency, 1))
    except Exception as exc:
        return ApiStatus(service="PostgreSQL", status="degraded", detail=str(exc))


async def _check_gemini() -> ApiStatus:
    settings = get_settings()
    if not settings.google_api_key:
        return ApiStatus(service="Gemini 2.5 Flash", status="unconfigured",
                         detail="GOOGLE_API_KEY not set in .env")
    t0 = asyncio.get_event_loop().time()
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=settings.google_api_key)
        await client.aio.models.generate_content(
            model="gemini-2.5-flash-preview-05-20",
            contents="ping",
            config=types.GenerateContentConfig(max_output_tokens=1),
        )
        latency = (asyncio.get_event_loop().time() - t0) * 1000
        return ApiStatus(service="Gemini 2.5 Flash", status="ok", latency_ms=round(latency, 1))
    except Exception as exc:
        return ApiStatus(service="Gemini 2.5 Flash", status="degraded", detail=str(exc)[:120])


async def _check_groq() -> ApiStatus:
    settings = get_settings()
    if not settings.groq_api_key:
        return ApiStatus(service="Groq llama-3.3-70b", status="unconfigured",
                         detail="GROQ_API_KEY not set in .env")
    t0 = asyncio.get_event_loop().time()
    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=settings.groq_api_key)
        await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=1,
        )
        latency = (asyncio.get_event_loop().time() - t0) * 1000
        return ApiStatus(service="Groq llama-3.3-70b", status="ok", latency_ms=round(latency, 1))
    except Exception as exc:
        return ApiStatus(service="Groq llama-3.3-70b", status="degraded", detail=str(exc)[:120])


@router.get(
    "/health",
    response_model=SystemHealth,
    summary="System health — DB, Gemini, Groq",
)
async def system_health(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> SystemHealth:
    """Probe DB, Gemini and Groq concurrently and return live status."""
    db_status, gemini_status, groq_status = await asyncio.gather(
        _check_db(db),
        _check_gemini(),
        _check_groq(),
    )
    return SystemHealth(
        checked_at=datetime.now(timezone.utc).isoformat(),
        database=db_status,
        gemini=gemini_status,
        groq=groq_status,
    )


# ---------------------------------------------------------------------------
# ── API Key Configuration ────────────────────────────────────────────────────
# ---------------------------------------------------------------------------

def _mask_key(key: str | None) -> str:
    """Return a masked representation of an API key for display."""
    if not key:
        return ""
    if len(key) <= 8:
        return "*" * len(key)
    return key[:4] + "*" * (len(key) - 8) + key[-4:]


class ApiKeyStatus(BaseModel):
    """Describes current status of a single API key."""
    name: str
    is_set: bool
    masked_value: str
    service: str


class ApiKeyStatusResponse(BaseModel):
    keys: list[ApiKeyStatus]


class UpdateApiKeysRequest(BaseModel):
    google_api_key: str | None = None
    groq_api_key: str | None = None


class UpdateApiKeysResponse(BaseModel):
    updated: list[str]
    message: str


@router.get(
    "/config/keys",
    response_model=ApiKeyStatusResponse,
    summary="Get API key configuration status",
)
async def get_api_key_status(
    _: User = Depends(get_current_admin),
) -> ApiKeyStatusResponse:
    """Return masked status of GOOGLE_API_KEY and GROQ_API_KEY."""
    settings = get_settings()
    google = settings.google_api_key or ""
    groq   = settings.groq_api_key   or ""

    return ApiKeyStatusResponse(keys=[
        ApiKeyStatus(
            name="GOOGLE_API_KEY",
            is_set=bool(google),
            masked_value=_mask_key(google),
            service="Gemini 2.5 Flash",
        ),
        ApiKeyStatus(
            name="GROQ_API_KEY",
            is_set=bool(groq),
            masked_value=_mask_key(groq),
            service="Groq llama-3.3-70b-versatile",
        ),
    ])


@router.put(
    "/config/keys",
    response_model=UpdateApiKeysResponse,
    summary="Update API keys at runtime",
)
async def update_api_keys(
    body: UpdateApiKeysRequest,
    _: User = Depends(get_current_admin),
) -> UpdateApiKeysResponse:
    """
    Update GOOGLE_API_KEY and/or GROQ_API_KEY at runtime.

    Changes take effect immediately for new requests without a server restart.
    The new values are also written back to the .env file for persistence.
    """
    updated: list[str] = []
    env_path = os.path.join(os.path.dirname(__file__), "../../../../.env")
    env_path = os.path.normpath(env_path)

    def _read_env() -> dict[str, str]:
        lines: dict[str, str] = {}
        if not os.path.exists(env_path):
            return lines
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, _, v = line.partition("=")
                    lines[k.strip()] = v.strip()
        return lines

    def _write_env(data: dict[str, str]) -> None:
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    stripped = line.strip()
                    if "=" in stripped and not stripped.startswith("#"):
                        k = stripped.partition("=")[0].strip()
                        if k in data:
                            lines.append(f"{k}={data.pop(k)}\n")
                            continue
                    lines.append(line)
        # Append any remaining new keys
        for k, v in data.items():
            lines.append(f"{k}={v}\n")
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(lines)

    env_data: dict[str, str] = {}

    if body.google_api_key is not None and body.google_api_key.strip():
        new_val = body.google_api_key.strip()
        os.environ["GOOGLE_API_KEY"] = new_val
        env_data["GOOGLE_API_KEY"] = new_val
        updated.append("GOOGLE_API_KEY")
        logger.info("Admin updated GOOGLE_API_KEY")

    if body.groq_api_key is not None and body.groq_api_key.strip():
        new_val = body.groq_api_key.strip()
        os.environ["GROQ_API_KEY"] = new_val
        env_data["GROQ_API_KEY"] = new_val
        updated.append("GROQ_API_KEY")
        logger.info("Admin updated GROQ_API_KEY")

    if env_data:
        try:
            existing = _read_env()
            existing.update(env_data)
            _write_env({k: v for k, v in env_data.items()})
        except Exception as exc:
            logger.warning("Could not persist API keys to .env: %s", exc)

    return UpdateApiKeysResponse(
        updated=updated,
        message=f"Updated {len(updated)} key(s) successfully." if updated else "No keys were changed.",
    )
