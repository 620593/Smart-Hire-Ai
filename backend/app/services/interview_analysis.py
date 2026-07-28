"""Per-question interview analysis service.

Primary LLM  : Google Gemini 2.5 Flash  (google-genai)
Fallback LLM : Groq  llama-3.3-70b-versatile  (groq)

The fallback activates automatically whenever Gemini is unavailable
(rate-limited, quota exceeded, API error, or key not set).
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
    QuestionAnalysisRequest,
    QuestionAnalysisResponse,
    QuestionAnalysisResult,
)

logger = logger_factory("app.services.interview_analysis")

# ---------------------------------------------------------------------------
# Model identifiers — change these constants or set GEMINI_MODEL in .env
# ---------------------------------------------------------------------------
GROQ_MODEL   = "llama-3.3-70b-versatile"

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """
You are an expert interview coach and behavioral psychologist with 15+ years of
experience evaluating candidates for technical and leadership roles.

Your task is to analyse a candidate's interview answer holistically, considering
BOTH the verbal content (transcript) and non-verbal cues (vision metrics).

Scoring dimensions (0-100):
- answer_quality_score : How complete, accurate and relevant the answer is.
- communication_score  : Clarity, structure, vocabulary, confidence in speech.
- body_language_score  : Eye contact, posture stability, facial expression.
- confidence_score     : Composite verbal + non-verbal confidence signal.
- relevance_score      : How directly the answer addresses the question.
- overall_score        : Weighted composite of all dimensions.

Non-verbal interpretation guide:
- eye_contact_percent >= 80  -> strong presence;  < 50 -> distracted or nervous.
- blink_rate_per_minute 10-20 -> normal; > 30 -> stress; < 5 -> rigid/unnatural.
- smile_score_percent >= 20  -> warm/engaging; near 0 -> flat affect.
- confidence (vision) >= 75  -> composed; < 50 -> anxious body language.
- attention_percent < 70     -> candidate frequently looked away.

If the transcript is empty or very short (< 20 words), significantly lower
answer_quality_score and relevance_score, and note this in feedback.

Return ONLY a single valid JSON object — no markdown, no preamble.

Required format:
{
  "answer_quality_score": <int 0-100>,
  "communication_score": <int 0-100>,
  "body_language_score": <int 0-100>,
  "confidence_score": <int 0-100>,
  "relevance_score": <int 0-100>,
  "overall_score": <int 0-100>,
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "feedback": "<2-3 sentence actionable paragraph>",
  "answer_summary": "<one concise sentence summarising what was said>"
}
""".strip()


def _build_question_prompt(req: QuestionAnalysisRequest) -> str:
    """Compose the user-turn message for a single question analysis."""
    vm  = req.vision_metrics
    hp  = vm.head_pose
    wc  = len(req.transcript.split()) if req.transcript.strip() else 0

    return f"""=== INTERVIEW QUESTION (Index {req.question_index + 1}) ===
{req.question_text}

=== CANDIDATE'S TRANSCRIPT ({wc} words) ===
{req.transcript.strip() or "[No speech detected — transcript unavailable]"}

=== VISION / BODY-LANGUAGE METRICS ===
Duration of answer   : {vm.duration_seconds:.1f} seconds
Face presence        : {vm.face_presence_percent:.1f}%
Eye contact          : {vm.eye_contact_percent:.1f}%
Attention level      : {vm.attention_percent:.1f}%
Blink rate           : {vm.blink_rate_per_minute:.1f} blinks/min
Smile score          : {vm.smile_score_percent:.1f}%
Body-lang confidence : {vm.confidence:.1f}%
Head yaw  (mean/std) : {hp.yaw_mean:.1f} / {hp.yaw_std:.1f} deg
Head pitch (mean/std): {hp.pitch_mean:.1f} / {hp.pitch_std:.1f} deg
Head roll  (mean/std): {hp.roll_mean:.1f} / {hp.roll_std:.1f} deg"""


def _extract_json(raw: str) -> str:
    """Strip markdown fences and return the first JSON object found."""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw, flags=re.IGNORECASE).replace("```", "")
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start != -1 and end > start:
        return cleaned[start: end + 1]
    return cleaned.strip()


def _parse_result(raw: str, source: str) -> QuestionAnalysisResult:
    """Parse and validate the raw LLM text into a QuestionAnalysisResult.

    Args:
        raw:    Raw text from the LLM response.
        source: Label for logging ('Gemini' or 'Groq').

    Raises:
        HTTPException 422 on parse/validation failure.
    """
    json_str = _extract_json(raw)
    try:
        parsed = json.loads(json_str)
    except json.JSONDecodeError as exc:
        logger.error("%s non-JSON output: %.500s | error: %s", source, raw, exc)
        raise HTTPException(
            status_code=422,
            detail=f"{source} returned an unexpected response format. Please retry.",
        ) from exc

    try:
        return QuestionAnalysisResult.model_validate(parsed)
    except Exception as exc:
        logger.error("%s validation failed: %s | %s", source, exc, parsed)
        raise HTTPException(
            status_code=422,
            detail=f"{source} response is missing required fields. Please retry.",
        ) from exc


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class InterviewAnalysisService:
    """Analyse a single interview question-answer pair.

    Tries Gemini 2.5 Flash first; falls back to Groq llama-3.3-70b-versatile
    on any Gemini error (rate limit, quota, missing key, API error).
    """

    def __init__(self) -> None:
        self.settings = get_settings()

    # ------------------------------------------------------------------
    # Gemini call
    # ------------------------------------------------------------------

    async def _call_gemini(self, prompt: str) -> QuestionAnalysisResult:
        """Call Gemini with JSON output mode.

        Raises:
            Exception: Any Gemini SDK or HTTP error (caller catches and falls back).
        """
        if not self.settings.google_api_key:
            raise ValueError("GOOGLE_API_KEY is not set — skipping Gemini.")

        client   = genai.Client(api_key=self.settings.google_api_key)
        combined = f"{_SYSTEM_PROMPT}\n\n{prompt}"

        response = await client.aio.models.generate_content(
            model=self.settings.gemini_model,
            contents=combined,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
                max_output_tokens=1024,
            ),
        )

        raw: str = response.text or ""
        logger.debug("Gemini raw (question): %.500s", raw)
        return _parse_result(raw, "Gemini")

    # ------------------------------------------------------------------
    # Groq fallback call
    # ------------------------------------------------------------------

    async def _call_groq(self, prompt: str) -> QuestionAnalysisResult:
        """Call Groq llama-3.3-70b-versatile with JSON mode.

        Raises:
            HTTPException: On API or parse errors.
        """
        if not self.settings.groq_api_key:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Neither GOOGLE_API_KEY nor GROQ_API_KEY is configured. "
                    "Set at least one in backend/.env to enable interview analysis."
                ),
            )

        client = AsyncGroq(api_key=self.settings.groq_api_key)
        try:
            chat = await client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user",   "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=1024,
            )
        except Exception as exc:
            logger.error("Groq API error (question): %s", exc)
            raise HTTPException(
                status_code=502,
                detail=f"Groq API returned an error: {exc}",
            ) from exc

        raw: str = chat.choices[0].message.content or ""
        logger.debug("Groq raw (question): %.500s", raw)
        return _parse_result(raw, "Groq")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def analyze(self, req: QuestionAnalysisRequest) -> QuestionAnalysisResponse:
        """Run per-question analysis with Gemini → Groq fallback.

        Args:
            req: The question analysis request payload.

        Returns:
            A fully populated QuestionAnalysisResponse.
        """
        prompt = _build_question_prompt(req)
        logger.info(
            "Analysing question %d | transcript_len=%d | eye_contact=%.1f%%",
            req.question_index,
            len(req.transcript),
            req.vision_metrics.eye_contact_percent,
        )

        # --- primary: Gemini ---
        try:
            result = await self._call_gemini(prompt)
            logger.info(
                "Q%d analysis via Gemini | overall_score=%d",
                req.question_index, result.overall_score,
            )
        except Exception as gemini_err:
            logger.warning(
                "Gemini unavailable for Q%d (%s) — falling back to Groq %s",
                req.question_index, gemini_err, GROQ_MODEL,
            )
            result = await self._call_groq(prompt)
            logger.info(
                "Q%d analysis via Groq fallback | overall_score=%d",
                req.question_index, result.overall_score,
            )

        return QuestionAnalysisResponse(
            question_index=req.question_index,
            question_text=req.question_text,
            transcript=req.transcript,
            vision_metrics=req.vision_metrics,
            result=result,
        )
