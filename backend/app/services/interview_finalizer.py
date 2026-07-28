"""Full-interview finalisation service.

Primary LLM  : Google Gemini 2.5 Flash  (google-genai)
Fallback LLM : Groq  llama-3.3-70b-versatile  (groq)

The fallback activates automatically whenever Gemini is unavailable.
"""

from __future__ import annotations

import json
import re

from fastapi import HTTPException
from google import genai
from google.genai import types
from groq import AsyncGroq

from app.core.config import get_settings
from app.core.logging import logger_factory
from app.schemas.interview import (
    InterviewFinalizeRequest,
    InterviewFinalizeResponse,
    InterviewFinalizeResult,
    QuestionAnalysisResponse,
    WeakQuestion,
)
from app.services.interview_analysis import (
    GROQ_MODEL,
    _extract_json,
)

logger = logger_factory("app.services.interview_finalizer")

WEAK_THRESHOLD = 60

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

_FINALIZE_SYSTEM_PROMPT = """
You are a senior hiring manager and interview coach writing a comprehensive
candidate evaluation report.

You will receive a complete interview transcript with per-question scores and
vision metrics. Your job is to synthesise all of this into a holistic report.

Return ONLY a single valid JSON object — no markdown, no preamble.

Required format:
{
  "overall_score": <int 0-100 — weighted average, penalise weak questions more>,
  "overall_feedback": "<2-3 paragraph holistic evaluation>",
  "communication_summary": "<1-2 sentences on verbal communication quality>",
  "body_language_summary": "<1-2 sentences on non-verbal presence and body language>",
  "top_strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "top_improvements": ["<improvement1>", "<improvement2>", "<improvement3>"],
  "recommendation": "<one of: Strong Recommend | Recommend | Neutral | Do Not Recommend>",
  "weak_question_indices": [<list of 0-based indices where overall_score < 60>]
}
""".strip()


def _safe_avg(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _build_finalize_prompt(req: InterviewFinalizeRequest) -> str:
    """Compose the aggregated finalisation prompt."""
    avg_eye   = _safe_avg([r.vision_metrics.eye_contact_percent for r in req.question_results])
    avg_conf  = _safe_avg([r.vision_metrics.confidence          for r in req.question_results])
    avg_attn  = _safe_avg([r.vision_metrics.attention_percent   for r in req.question_results])
    avg_smile = _safe_avg([r.vision_metrics.smile_score_percent for r in req.question_results])

    lines: list[str] = [
        f"Candidate : {req.candidate_name}",
        f"Role      : {req.job_title or 'Not specified'}",
        f"Questions : {len(req.question_results)}",
        "",
        "=== AGGREGATE VISION METRICS ===",
        f"Avg Eye Contact    : {avg_eye:.1f}%",
        f"Avg Attention      : {avg_attn:.1f}%",
        f"Avg Body Confidence: {avg_conf:.1f}%",
        f"Avg Smile Score    : {avg_smile:.1f}%",
        "",
        "=== PER-QUESTION RESULTS ===",
    ]

    for qr in req.question_results:
        r = qr.result
        snippet = qr.transcript[:300].strip() or "[No speech detected]"
        ellipsis = "..." if len(qr.transcript) > 300 else ""
        lines += [
            f"\n--- Question {qr.question_index + 1} ---",
            f"Q: {qr.question_text}",
            f"Transcript ({len(qr.transcript.split())} words): {snippet}{ellipsis}",
            f"Overall Score    : {r.overall_score}/100",
            f"Answer Quality   : {r.answer_quality_score}/100",
            f"Communication    : {r.communication_score}/100",
            f"Body Language    : {r.body_language_score}/100",
            f"Eye Contact      : {qr.vision_metrics.eye_contact_percent:.1f}%",
            f"Confidence       : {qr.vision_metrics.confidence:.1f}%",
            f"Key Feedback     : {r.feedback}",
        ]

    return "\n".join(lines)


def _parse_finalize_result(raw: str, source: str) -> InterviewFinalizeResult:
    """Parse and validate raw LLM text into InterviewFinalizeResult."""
    json_str = _extract_json(raw)
    try:
        parsed = json.loads(json_str)
    except json.JSONDecodeError as exc:
        logger.error("%s non-JSON (finalize): %.500s | %s", source, raw, exc)
        raise HTTPException(
            status_code=422,
            detail=f"{source} returned an unexpected response format. Please retry.",
        ) from exc

    try:
        return InterviewFinalizeResult.model_validate(parsed)
    except Exception as exc:
        logger.error("%s validation failed (finalize): %s | %s", source, exc, parsed)
        raise HTTPException(
            status_code=422,
            detail=f"{source} response is missing required fields. Please retry.",
        ) from exc


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class InterviewFinalizerService:
    """Aggregate all question results and produce a holistic interview report.

    Uses Gemini as primary LLM; falls back to Groq llama-3.3-70b
    automatically on any Gemini error.
    """

    def __init__(self) -> None:
        self.settings = get_settings()

    def _extract_weak_questions(
        self, results: list[QuestionAnalysisResponse]
    ) -> list[WeakQuestion]:
        weak: list[WeakQuestion] = []
        for qr in results:
            if qr.result.overall_score < WEAK_THRESHOLD:
                top_improvement = (
                    qr.result.improvements[0]
                    if qr.result.improvements
                    else "Practice structured answers using the STAR method."
                )
                weak.append(
                    WeakQuestion(
                        question_index=qr.question_index,
                        question_text=qr.question_text,
                        overall_score=qr.result.overall_score,
                        primary_feedback=qr.result.feedback,
                        top_improvement=top_improvement,
                    )
                )
        return weak

    # ------------------------------------------------------------------
    # Gemini call
    # ------------------------------------------------------------------

    async def _call_gemini(self, prompt: str) -> InterviewFinalizeResult:
        """Call Gemini for holistic evaluation.

        Raises:
            Exception: Any Gemini SDK or HTTP error (caller catches and falls back).
        """
        if not self.settings.google_api_key:
            raise ValueError("GOOGLE_API_KEY is not set — skipping Gemini.")

        client   = genai.Client(api_key=self.settings.google_api_key)
        combined = f"{_FINALIZE_SYSTEM_PROMPT}\n\n{prompt}"

        response = await client.aio.models.generate_content(
            model=self.settings.gemini_model,
            contents=combined,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.4,
                max_output_tokens=2048,
            ),
        )

        raw: str = response.text or ""
        logger.debug("Gemini raw (finalize): %.500s", raw)
        return _parse_finalize_result(raw, "Gemini")

    # ------------------------------------------------------------------
    # Groq fallback call
    # ------------------------------------------------------------------

    async def _call_groq(self, prompt: str) -> InterviewFinalizeResult:
        """Call Groq llama-3.3-70b-versatile for holistic evaluation.

        Raises:
            HTTPException: On API or parse errors.
        """
        if not self.settings.groq_api_key:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Neither GOOGLE_API_KEY nor GROQ_API_KEY is configured. "
                    "Set at least one in backend/.env to enable interview finalisation."
                ),
            )

        client = AsyncGroq(api_key=self.settings.groq_api_key)
        try:
            chat = await client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": _FINALIZE_SYSTEM_PROMPT},
                    {"role": "user",   "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=2048,
            )
        except Exception as exc:
            logger.error("Groq API error (finalize): %s", exc)
            raise HTTPException(
                status_code=502,
                detail=f"Groq API returned an error: {exc}",
            ) from exc

        raw: str = chat.choices[0].message.content or ""
        logger.debug("Groq raw (finalize): %.500s", raw)
        return _parse_finalize_result(raw, "Groq")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def finalize(self, req: InterviewFinalizeRequest) -> InterviewFinalizeResponse:
        """Run the full interview finalisation pipeline with Gemini -> Groq fallback.

        Args:
            req: The finalisation request with all question results.

        Returns:
            A fully populated InterviewFinalizeResponse.
        """
        logger.info(
            "Finalising interview for '%s' — %d questions",
            req.candidate_name,
            len(req.question_results),
        )

        prompt = _build_finalize_prompt(req)

        # --- primary: Gemini ---
        try:
            final_result = await self._call_gemini(prompt)
            logger.info(
                "Interview finalised via Gemini | overall_score=%d | recommendation=%s",
                final_result.overall_score, final_result.recommendation,
            )
        except Exception as gemini_err:
            logger.warning(
                "Gemini unavailable for finalize (%s) — falling back to Groq %s",
                gemini_err, GROQ_MODEL,
            )
            final_result = await self._call_groq(prompt)
            logger.info(
                "Interview finalised via Groq fallback | overall_score=%d | recommendation=%s",
                final_result.overall_score, final_result.recommendation,
            )

        weak_questions = self._extract_weak_questions(req.question_results)

        return InterviewFinalizeResponse(
            candidate_name=req.candidate_name,
            job_title=req.job_title,
            total_questions=len(req.question_results),
            question_results=req.question_results,
            weak_questions=weak_questions,
            result=final_result,
        )
