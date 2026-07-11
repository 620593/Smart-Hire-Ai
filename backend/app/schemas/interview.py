"""Pydantic schemas for the interview analysis feature of SmartHire AI.

Covers the per-question analysis payload, the full-interview finalization
request/response, and the vision metrics structure that mirrors the
MediaPipe-based frontend analysis.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Vision metrics — mirrors the MediaPipe frontend output exactly
# ---------------------------------------------------------------------------


class HeadPoseMetrics(BaseModel):
    """Head orientation statistics computed from MediaPipe transformation matrix."""

    yaw_mean: float = Field(default=0.0, description="Mean yaw angle in degrees.")
    pitch_mean: float = Field(default=0.0, description="Mean pitch angle in degrees.")
    roll_mean: float = Field(default=0.0, description="Mean roll angle in degrees.")
    yaw_std: float = Field(default=0.0, description="Std-dev of yaw angle.")
    pitch_std: float = Field(default=0.0, description="Std-dev of pitch angle.")
    roll_std: float = Field(default=0.0, description="Std-dev of roll angle.")


class VisionMetrics(BaseModel):
    """Aggregated vision analysis metrics for a single question answer window.

    All percentage values are in the range 0-100.
    Computed by the MediaPipe Face Landmarker running in the browser.
    """

    duration_seconds: float = Field(
        default=0.0, description="Duration of the captured window in seconds."
    )
    face_presence_percent: float = Field(
        default=0.0, ge=0, le=100, description="% of frames where a face was detected."
    )
    eye_contact_percent: float = Field(
        default=0.0, ge=0, le=100, description="% of frames with stable eye contact."
    )
    attention_percent: float = Field(
        default=0.0, ge=0, le=100, description="Composite attention score."
    )
    blink_rate_per_minute: float = Field(
        default=0.0, ge=0, description="Blink rate normalised per minute."
    )
    smile_score_percent: float = Field(
        default=0.0, ge=0, le=100, description="Average smile intensity (0-100)."
    )
    confidence: float = Field(
        default=0.0, ge=0, le=100, description="Composite body-language confidence score."
    )
    head_pose: HeadPoseMetrics = Field(
        default_factory=HeadPoseMetrics,
        description="Head orientation statistics.",
    )


# ---------------------------------------------------------------------------
# Per-question analysis
# ---------------------------------------------------------------------------


class QuestionAnalysisRequest(BaseModel):
    """Payload sent to the /interview/analyze-question endpoint.

    Submitted automatically after each question answer window closes.
    """

    question_index: int = Field(
        ..., ge=0, description="Zero-based index of the question in the session."
    )
    question_text: str = Field(
        ..., min_length=1, max_length=2000, description="The interview question text."
    )
    transcript: str = Field(
        default="",
        max_length=10_000,
        description="Speech-to-text transcript of the candidate's answer.",
    )
    vision_metrics: VisionMetrics = Field(
        default_factory=VisionMetrics,
        description="Aggregated MediaPipe vision metrics for this answer window.",
    )


class QuestionAnalysisResult(BaseModel):
    """Structured per-question evaluation returned by the Gemini LLM."""

    answer_quality_score: int = Field(..., ge=0, le=100)
    communication_score: int = Field(..., ge=0, le=100)
    body_language_score: int = Field(..., ge=0, le=100)
    confidence_score: int = Field(..., ge=0, le=100)
    relevance_score: int = Field(..., ge=0, le=100)
    overall_score: int = Field(..., ge=0, le=100)
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    feedback: str = Field(default="")
    answer_summary: str = Field(default="")


class QuestionAnalysisResponse(BaseModel):
    """Full response envelope for a single-question analysis."""

    question_index: int
    question_text: str
    transcript: str
    vision_metrics: VisionMetrics
    result: QuestionAnalysisResult


# ---------------------------------------------------------------------------
# Full-interview finalization
# ---------------------------------------------------------------------------


class InterviewFinalizeRequest(BaseModel):
    """Payload sent to /interview/finalize after all questions are answered."""

    candidate_name: str = Field(
        default="Candidate",
        max_length=200,
        description="Name of the candidate (for the report).",
    )
    job_title: str = Field(
        default="",
        max_length=200,
        description="Role being interviewed for.",
    )
    question_results: list[QuestionAnalysisResponse] = Field(
        ...,
        min_length=1,
        description="Ordered list of per-question analysis results.",
    )


class WeakQuestion(BaseModel):
    """A question the candidate answered poorly (overall_score < 60)."""

    question_index: int
    question_text: str
    overall_score: int
    primary_feedback: str
    top_improvement: str


class InterviewFinalizeResult(BaseModel):
    """Holistic interview evaluation returned by the Gemini LLM."""

    overall_score: int = Field(..., ge=0, le=100)
    overall_feedback: str = Field(default="")
    communication_summary: str = Field(default="")
    body_language_summary: str = Field(default="")
    top_strengths: list[str] = Field(default_factory=list)
    top_improvements: list[str] = Field(default_factory=list)
    recommendation: Literal[
        "Strong Recommend", "Recommend", "Neutral", "Do Not Recommend"
    ] = Field(default="Neutral")
    weak_question_indices: list[int] = Field(
        default_factory=list,
        description="Zero-based indices of questions scoring below 60.",
    )


class InterviewFinalizeResponse(BaseModel):
    """Full response envelope for the interview finalization endpoint."""

    candidate_name: str
    job_title: str
    total_questions: int
    question_results: list[QuestionAnalysisResponse]
    weak_questions: list[WeakQuestion]
    result: InterviewFinalizeResult
