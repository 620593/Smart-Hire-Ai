"""ATS scoring API endpoint for SmartHire AI.

Exposes a single POST route that accepts a resume UUID and a job description
body, then orchestrates the full ATS scoring pipeline via ``ATSService``.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Body, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.ats import ATSScoreRequest, ATSScoreResponse
from app.services.ats import ATSService

router = APIRouter(prefix="/ats", tags=["ats"])


@router.post(
    "/score/{resume_id}",
    response_model=ATSScoreResponse,
    summary="Score a resume against a job description",
    description=(
        "Extracts text from an uploaded PDF resume, parses it into sections, "
        "and scores it against the supplied job description using an LLM-based "
        "ATS evaluator.  Returns structured scores, missing skills, strengths, "
        "weaknesses, and actionable improvement suggestions.\n\n"
        "**RBAC:** Candidates may only score their own resumes. "
        "Recruiters and admins may score any resume."
    ),
    responses={
        200: {"description": "ATS scoring completed successfully."},
        400: {"description": "Cannot extract text from the resume PDF."},
        403: {"description": "Caller does not have permission to score this resume."},
        404: {"description": "Resume record or physical file not found."},
        422: {"description": "LLM returned an invalid/unexpected response."},
        503: {"description": "Groq API key is not configured on the server."},
    },
)
async def score_resume(
    resume_id: UUID,
    payload: ATSScoreRequest = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ATSScoreResponse:
    """Score an uploaded resume against a job description via ATS evaluation.

    Args:
        resume_id: UUID of the resume to evaluate (path parameter).
        payload:   Request body containing the job description text.
        current_user: Authenticated user (injected by dependency).
        db:        Async database session (injected by dependency).

    Returns:
        ``ATSScoreResponse`` with overall and section-level scores, missing
        skills, strengths, weaknesses, suggestions, and resume metadata.
    """
    user_roles = [role.name for role in current_user.roles]

    service = ATSService(db)
    return await service.score_resume(
        resume_id=resume_id,
        jd_text=payload.jd_text,
        current_user_id=current_user.id,
        current_user_roles=user_roles,
    )
