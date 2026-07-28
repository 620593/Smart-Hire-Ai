"""ATS scoring service for SmartHire AI.

Orchestrates the full pipeline:
    1. Fetch resume record + verify RBAC permissions.
    2. Extract and clean text from the PDF on disk.
    3. Detect resume sections.
    4. Build the system + user prompts.
    5. Call the Groq LLM (llama-3.3-70b-versatile).
    6. Parse, validate, and return the structured score result.
"""

from __future__ import annotations

import json
import re
from uuid import UUID

from fastapi import HTTPException
from groq import AsyncGroq, GroqError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import logger_factory
from app.repositories.resume import ResumeRepository
from app.schemas.ats import ATSSectionBreakdown, ATSScoreResponse, ATSScoreResult
from app.utils.pdf_parser import parse_resume

logger = logger_factory("app.services.ats")

# ---------------------------------------------------------------------------
# Prompt constants
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """
You are an expert ATS (Applicant Tracking System) evaluator with 15+ years of
recruiting and talent-screening experience.

Your task is to rigorously compare the candidate's resume against the provided
job description and return a structured, evidence-based evaluation.

Evaluate the following dimensions:
1. Overall ATS Score (0-100) — composite of all dimensions below.
2. Skill Match Score (0-100) — hard & soft skills alignment.
3. Experience Match Score (0-100) — seniority, domain, years of experience.
4. Education Match Score (0-100) — degree level and field of study.
5. Missing Skills — skills explicitly required in the JD but absent from resume.
6. Strengths — concrete resume highlights that strongly match the JD.
7. Weaknesses — specific gaps between the resume and JD requirements.
8. Suggestions — prioritised, actionable steps the candidate can take immediately.
9. Improvements to Add — exact keywords, certifications, or tools to insert.

Scoring guidelines:
- 90-100: Excellent match — ready for interview.
- 70-89:  Good match — minor gaps.
- 50-69:  Moderate match — notable gaps, preparation needed.
- 30-49:  Weak match — significant reskilling required.
- 0-29:   Poor match — not suitable for this role.

Return ONLY a single valid JSON object — no markdown fences, no preamble.

Required output format (all fields mandatory):
{
    "overall_score": <int 0-100>,
    "skill_score": <int 0-100>,
    "experience_score": <int 0-100>,
    "education_score": <int 0-100>,
    "missing_skills": ["<skill1>", "<skill2>"],
    "strengths": ["<strength1>", "<strength2>"],
    "weaknesses": ["<weakness1>", "<weakness2>"],
    "suggestions": ["<suggestion1>", "<suggestion2>"],
    "improvements to add": ["<item1>", "<item2>"]
}
""".strip()


def _build_user_prompt(resume_text: str, jd_text: str) -> str:
    """Compose the user-turn message from resume and job description text.

    Args:
        resume_text: Cleaned, extracted resume text.
        jd_text: Raw job description text.

    Returns:
        Formatted user prompt string.
    """
    return (
        "=== RESUME ===\n"
        f"{resume_text}\n\n"
        "=== JOB DESCRIPTION ===\n"
        f"{jd_text}"
    )


def _extract_json_block(raw: str) -> str:
    """Strip any surrounding markdown fences from the LLM response.

    Tries to locate the first ``{`` and last ``}`` to extract a JSON object
    even when the model ignores instructions and wraps output in fences.

    Args:
        raw: Raw string output from the LLM.

    Returns:
        Cleaned string that should be parseable as JSON.
    """
    # Remove ``` fences if present
    fenced = re.sub(r"```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
    fenced = fenced.replace("```", "")

    # Locate outermost braces
    start = fenced.find("{")
    end = fenced.rfind("}")
    if start != -1 and end != -1 and end > start:
        return fenced[start : end + 1]
    return fenced.strip()


# ---------------------------------------------------------------------------
# Service class
# ---------------------------------------------------------------------------


class ATSService:
    """Coordinate ATS scoring for a given resume and job description."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.resume_repo = ResumeRepository(db)
        self.settings = get_settings()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _check_auth(
        self,
        current_user_id: UUID,
        current_user_roles: list[str],
        owner_id: UUID,
    ) -> None:
        """Enforce RBAC: candidates can only score their own resumes.

        Admins and recruiters may score any resume.

        Args:
            current_user_id: ID of the requesting user.
            current_user_roles: Role names assigned to the requesting user.
            owner_id: ID of the user who owns the resume.

        Raises:
            HTTPException: 403 if the user lacks permission.
        """
        if "admin" in current_user_roles or "recruiter" in current_user_roles:
            return
        if current_user_id == owner_id:
            return
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to score this resume.",
        )

    def _validate_groq_key(self) -> None:
        """Ensure a Groq API key is configured before attempting a call.

        Raises:
            HTTPException: 503 if the key is missing or empty.
        """
        if not self.settings.groq_api_key:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Groq API key is not configured. "
                    "Set GROQ_API_KEY in the server environment."
                ),
            )

    async def _call_groq(self, resume_text: str, jd_text: str) -> ATSScoreResult:
        """Call the Groq inference API and parse the response into a schema.

        Uses ``AsyncGroq`` for non-blocking I/O inside the async FastAPI
        request handler.

        Args:
            resume_text: Cleaned resume text.
            jd_text: Raw job description text.

        Returns:
            Validated ``ATSScoreResult`` instance.

        Raises:
            HTTPException: 502 on Groq API errors; 422 on JSON parse failure.
        """
        user_prompt = _build_user_prompt(resume_text, jd_text)

        try:
            client = AsyncGroq(api_key=self.settings.groq_api_key)
            response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0,
                max_tokens=2048,
            )
        except GroqError as exc:
            logger.error("Groq API error during ATS scoring: %s", exc)
            raise HTTPException(
                status_code=502,
                detail=f"Groq API returned an error: {exc}",
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected error calling Groq API: %s", exc)
            raise HTTPException(
                status_code=502,
                detail="Failed to reach the Groq inference service.",
            ) from exc

        raw_content: str = response.choices[0].message.content or ""
        logger.debug("Raw Groq response: %.500s", raw_content)

        json_str = _extract_json_block(raw_content)
        try:
            parsed = json.loads(json_str)
        except json.JSONDecodeError as exc:
            logger.error(
                "LLM returned non-JSON output: %.500s | error: %s", raw_content, exc
            )
            raise HTTPException(
                status_code=422,
                detail=(
                    "The ATS model returned an unexpected response format. "
                    "Please retry the request."
                ),
            ) from exc

        try:
            return ATSScoreResult.model_validate(parsed)
        except Exception as exc:
            logger.error("ATSScoreResult validation failed: %s | payload: %s", exc, parsed)
            raise HTTPException(
                status_code=422,
                detail=(
                    "The ATS model response is missing required fields. "
                    "Please retry the request."
                ),
            ) from exc

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def score_resume(
        self,
        resume_id: UUID,
        jd_text: str,
        current_user_id: UUID,
        current_user_roles: list[str],
    ) -> ATSScoreResponse:
        """Score a stored resume against a job description.

        Pipeline:
        1. Fetch resume record from DB.
        2. Verify RBAC.
        3. Validate Groq key is present.
        4. Parse the PDF → extract + clean text + detect sections.
        5. Call Groq LLM.
        6. Return ``ATSScoreResponse`` with scores, metadata, and sections.

        Args:
            resume_id: UUID of the resume to score.
            jd_text: Job description text supplied by the user.
            current_user_id: ID of the authenticated caller.
            current_user_roles: Roles held by the authenticated caller.

        Returns:
            A fully populated ``ATSScoreResponse``.

        Raises:
            HTTPException: 404 if resume not found; 404 if PDF file missing
                on disk; 400 if text extraction fails; 403 if permission
                denied; 502/422 from Groq call failures.
        """
        # 1. Fetch resume record
        resume = await self.resume_repo.find_resume(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found.")

        # 2. RBAC
        self._check_auth(current_user_id, current_user_roles, resume.user_id)

        # 3. Ensure Groq key is set
        self._validate_groq_key()

        # 4. Parse the physical PDF
        import os  # noqa: PLC0415 — local import to avoid polluting module namespace

        if not os.path.exists(resume.storage_path):
            raise HTTPException(
                status_code=404,
                detail="Physical resume file not found on disk.",
            )

        try:
            parsed = parse_resume(resume.storage_path)
        except ValueError as exc:
            logger.error("PDF parsing failed for resume %s: %s", resume_id, exc)
            raise HTTPException(
                status_code=400,
                detail=f"Failed to extract text from resume: {exc}",
            ) from exc

        resume_text: str = parsed["text"]
        sections_raw: dict[str, str] = parsed["sections"]

        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail=(
                    "No text could be extracted from this resume. "
                    "Ensure the PDF is not image-only."
                ),
            )

        # 5. Call Groq LLM
        logger.info(
            "Starting ATS scoring — resume=%s | jd_len=%d | resume_len=%d",
            resume_id,
            len(jd_text),
            len(resume_text),
        )
        score_result = await self._call_groq(resume_text, jd_text)
        logger.info(
            "ATS scoring complete — resume=%s | overall_score=%d",
            resume_id,
            score_result.overall_score,
        )

        # 6. Build section breakdown for transparency
        section_breakdown = ATSSectionBreakdown(
            contact=sections_raw.get("contact", ""),
            summary=sections_raw.get("summary", ""),
            skills=sections_raw.get("skills", ""),
            experience=sections_raw.get("experience", ""),
            education=sections_raw.get("education", ""),
            projects=sections_raw.get("projects", ""),
            certifications=sections_raw.get("certifications", ""),
        )

        return ATSScoreResponse(
            resume_id=str(resume.id),
            resume_filename=resume.original_filename,
            resume_pages=parsed["pages"],
            resume_length=parsed["length"],
            jd_length=len(jd_text),
            result=score_result,
            sections=section_breakdown,
        )
