"""Pydantic schemas for the ATS scoring feature of SmartHire AI."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class ATSScoreRequest(BaseModel):
    """Incoming request payload for ATS resume scoring.

    Attributes:
        jd_text: The full job description text to score the resume against.
                 Must be at least 50 characters to contain meaningful signal.
    """

    jd_text: str = Field(
        ...,
        min_length=50,
        max_length=20_000,
        description="Job description text to compare the resume against.",
        examples=["We are looking for a senior Python developer with FastAPI experience..."],
    )

    @field_validator("jd_text")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        """Remove leading/trailing whitespace from the job description."""
        return v.strip()


# ---------------------------------------------------------------------------
# ATS score result — mirrors the LLM JSON output schema exactly
# ---------------------------------------------------------------------------


class ATSScoreResult(BaseModel):
    """Structured ATS evaluation result returned by the LLM.

    Scores are integers on a 0-100 scale.  List fields may be empty when the
    LLM finds no relevant entries.
    """

    overall_score: int = Field(
        ..., ge=0, le=100, description="Holistic ATS compatibility score."
    )
    skill_score: int = Field(
        ..., ge=0, le=100, description="How well candidate skills match the JD."
    )
    experience_score: int = Field(
        ..., ge=0, le=100, description="How well experience level / years match the JD."
    )
    education_score: int = Field(
        ..., ge=0, le=100, description="Alignment between candidate education and JD requirements."
    )
    missing_skills: list[str] = Field(
        default_factory=list,
        description="Skills mentioned in the JD that are absent from the resume.",
    )
    strengths: list[str] = Field(
        default_factory=list,
        description="Key areas where the resume strongly matches the JD.",
    )
    weaknesses: list[str] = Field(
        default_factory=list,
        description="Key gaps or weaknesses relative to the JD.",
    )
    suggestions: list[str] = Field(
        default_factory=list,
        description="Actionable recommendations to improve ATS compatibility.",
    )
    improvements_to_add: list[str] = Field(
        default_factory=list,
        alias="improvements to add",
        description="Specific skills or keywords to add to the resume.",
    )

    model_config = {"populate_by_name": True}


class ATSSectionBreakdown(BaseModel):
    """Optional per-section text included in the response for transparency."""

    contact: str = ""
    summary: str = ""
    skills: str = ""
    experience: str = ""
    education: str = ""
    projects: str = ""
    certifications: str = ""


class ATSScoreResponse(BaseModel):
    """Full API response envelope for the ATS scoring endpoint.

    Includes scoring results, metadata about the resume used, and the parsed
    section breakdown for transparency.
    """

    resume_id: str = Field(description="UUID of the resume that was scored.")
    resume_filename: str = Field(description="Original filename of the scored resume.")
    resume_pages: int = Field(description="Number of pages in the scored resume.")
    resume_length: int = Field(description="Character count of the extracted resume text.")
    jd_length: int = Field(description="Character count of the supplied job description.")
    result: ATSScoreResult = Field(description="The ATS evaluation result from the LLM.")
    sections: ATSSectionBreakdown = Field(
        default_factory=ATSSectionBreakdown,
        description="Detected resume sections for transparency.",
    )
