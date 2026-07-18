"""Dynamic follow-up question generator for SmartHire AI.

Generates the NEXT interview question in real-time based on the full
conversation history — making the interview feel like a real human discussion.

Primary LLM  : Google Gemini 2.5 Flash  (google-genai)
Fallback LLM : Groq  llama-3.3-70b-versatile  (groq)

Design intent:
  - Question 1 may use the initial batch generator OR this service
  - Questions 2-N use this service to produce contextually relevant follow-ups
  - The LLM reads all previous Q&A pairs and scores, then crafts the next question
    to probe deeper into weak areas or explore uncovered competencies
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
    GenerateNextQuestionRequest,
    GenerateNextQuestionResponse,
)

logger = logger_factory("app.services.interview_dynamic_question")

GEMINI_MODEL = "gemini-2.5-flash-preview-05-20"
GROQ_MODEL   = "llama-3.3-70b-versatile"

# ---------------------------------------------------------------------------
# System prompt — separate LLM persona for dynamic questioning
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """
You are AIRA, an expert AI interviewer conducting a live job interview.
Your role is to generate the NEXT interview question that naturally continues
the conversation based on the candidate's previous answers.

Principles:
1. Build on the conversation — if a previous answer was weak (low score), 
   probe deeper with a follow-up on that topic.
2. If a previous answer was strong, pivot to a new area not yet covered.
3. Never repeat a category that has already been explored unless the score was < 50.
4. Questions must be conversational, specific to THIS candidate's background.
5. Maintain flow — acknowledge the progression naturally.

Available categories:
["Technical Skills", "Problem Solving", "Leadership", "Communication",
 "Adaptability", "Domain Knowledge", "Career Goals", "Collaboration",
 "Project Experience", "Culture Fit", "Behavioral", "Situational"]

Return ONLY a single valid JSON object — no markdown, no explanation:
{
  "question_text": "The full interview question?",
  "category": "Category Name",
  "tip": "A brief tip for the candidate on how to answer this well."
}
""".strip()


def _build_prompt(req: GenerateNextQuestionRequest) -> str:
    """Compose the user-turn prompt with full conversation context."""
    lines: list[str] = [
        f"JOB TITLE: {req.job_title or 'Not specified'}",
        f"QUESTION {req.question_number} OF {req.total_questions}",
        f"COVERED CATEGORIES: {', '.join(req.covered_categories) or 'None yet'}",
        "",
    ]

    if req.resume_text:
        lines.append(f"CANDIDATE RESUME SUMMARY:\n{req.resume_text[:1500]}...")
        lines.append("")

    if not req.prior_qa_pairs:
        lines.append("This is the FIRST question. Generate a strong opening question.")
    else:
        lines.append("=== INTERVIEW CONVERSATION SO FAR ===")
        already_asked: list[str] = []
        for i, pair in enumerate(req.prior_qa_pairs):
            already_asked.append(pair.question_text)
            lines.append(f"\nQ{i + 1} [{pair.category}] (Score: {pair.answer_score}/100):")
            lines.append(f"  Asked: {pair.question_text}")
            lines.append(
                f"  Answer: {pair.answer_transcript[:500] if pair.answer_transcript else '[No answer given]'}"
            )

        # Explicit deduplication instruction
        lines.append("")
        lines.append("=== ALREADY ASKED — DO NOT REPEAT ANY OF THESE ===")
        for i, text in enumerate(already_asked):
            lines.append(f"  {i + 1}. {text}")

    lines.append("")
    lines.append(
        f"Generate question {req.question_number} that naturally continues "
        f"this interview conversation. Be specific and contextually aware. "
        f"CRITICAL: The new question MUST be completely different from all questions listed above."
    )

    return "\n".join(lines)


def _extract_and_parse(raw: str) -> GenerateNextQuestionResponse:
    """Parse the LLM JSON response into the response model."""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw, flags=re.IGNORECASE).replace("```", "")
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end > start:
        cleaned = cleaned[start: end + 1]

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM returned invalid JSON: {exc}") from exc

    question_text = str(parsed.get("question_text", "")).strip()
    category      = str(parsed.get("category", "General")).strip()
    tip            = str(parsed.get("tip", "")).strip()

    if not question_text:
        raise ValueError("LLM returned empty question_text")

    return GenerateNextQuestionResponse(
        question_text=question_text,
        category=category,
        tip=tip,
    )


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class DynamicQuestionService:
    """Generate the next contextual interview question in real-time."""

    def __init__(self) -> None:
        self.settings = get_settings()

    async def generate_next(
        self, req: GenerateNextQuestionRequest
    ) -> GenerateNextQuestionResponse:
        """Generate the next question using Gemini → Groq fallback."""
        prompt = _build_prompt(req)

        logger.info(
            "Generating dynamic question %d/%d | prior_qa=%d",
            req.question_number,
            req.total_questions,
            len(req.prior_qa_pairs),
        )

        # ── Primary: Gemini ────────────────────────────────────────────────
        if self.settings.google_api_key:
            try:
                client = genai.Client(api_key=self.settings.google_api_key)
                response = await client.aio.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=_SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        temperature=0.75,
                        max_output_tokens=512,
                    ),
                )
                raw = response.text or ""
                result = _extract_and_parse(raw)
                logger.info(
                    "Dynamic Q%d generated via Gemini: category=%s",
                    req.question_number, result.category,
                )
                return result
            except Exception as exc:
                logger.warning(
                    "Gemini dynamic question failed (Q%d): %s — trying Groq",
                    req.question_number, exc,
                )

        # ── Fallback: Groq ─────────────────────────────────────────────────
        if self.settings.groq_api_key:
            try:
                groq_client = AsyncGroq(api_key=self.settings.groq_api_key)
                completion = await groq_client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user",   "content": prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.75,
                    max_tokens=512,
                )
                raw = completion.choices[0].message.content or ""
                result = _extract_and_parse(raw)
                logger.info(
                    "Dynamic Q%d generated via Groq: category=%s",
                    req.question_number, result.category,
                )
                return result
            except Exception as exc:
                logger.error("Groq dynamic question also failed (Q%d): %s", req.question_number, exc)
                raise HTTPException(
                    status_code=502,
                    detail=f"Both LLMs failed to generate next question: {exc}",
                ) from exc

        raise HTTPException(
            status_code=503,
            detail="No LLM API key configured. Set GOOGLE_API_KEY or GROQ_API_KEY.",
        )
