"""LLM-powered interview question generator for SmartHire AI.

Given a candidate's resume text and a job description, generates
personalized, role-specific interview questions using:
  Primary  : Google Gemini 2.5 Flash
  Fallback : Groq llama-3.3-70b-versatile
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
    GenerateQuestionsRequest,
    GeneratedQuestion,
    GeneratedQuestionsResponse,
)

logger = logger_factory("app.services.interview_question_generator")

GROQ_MODEL   = "llama-3.3-70b-versatile"

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """
You are AIRA, a friendly and encouraging AI interview assistant. You design
interviews that start with approachable, basic questions and progressively
increase difficulty based on the candidate's experience level.

Your task: Given a candidate's resume and a job description, generate
personalized interview questions that assess their fit for the role.

DIFFICULTY GUIDELINES:
- If the resume shows 0-1 years of experience (fresher/student/recent graduate),
  start with basic introductory and foundational questions.
- If the resume shows 2-4 years, mix foundational and intermediate questions.
- If the resume shows 5+ years, include advanced and leadership questions.
- When in doubt, assume the candidate is a fresher and keep questions simple.

Question Style:
- Questions must be specific to THIS candidate's background — reference their
  actual skills, projects, or experience visible in the resume.
- Use the candidate's name naturally in 1-2 questions if provided.
- Mix question types: behavioral (STAR), technical basics, situational, motivational.
- Each question needs a realistic 1-2 sentence "tip" for the candidate.
- Assign each question a category from:
  ["Technical Skills", "Problem Solving", "Leadership", "Communication",
   "Adaptability", "Domain Knowledge", "Career Goals", "Collaboration",
   "Project Experience", "Culture Fit"]
- Questions should be conversational, clear, warm, and not intimidating.
- Start with an easy icebreaker question (e.g., "Tell me about yourself").
"""

_USER_TEMPLATE = """
CANDIDATE NAME: {candidate_name}

CANDIDATE RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

JOB TITLE: {job_title}

Generate exactly {num_questions} interview questions tailored to this candidate
for this specific role. Start with easy/basic questions and gradually increase
difficulty. The first question should always be a simple icebreaker.

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {{
    "text": "The full interview question?",
    "category": "Category Name",
    "tip": "Practical tip for how to answer this question well."
  }},
  ...
]
"""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_json(raw: str) -> list[dict]:
    """Strip markdown fences and parse JSON array."""
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?", "", raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r"```$", "", raw).strip()
    parsed = json.loads(raw)
    if not isinstance(parsed, list):
        raise ValueError("Expected a JSON array")
    return parsed


def _validate_questions(raw_list: list[dict], num: int) -> list[GeneratedQuestion]:
    questions = []
    for item in raw_list[:num]:
        text     = str(item.get("text", "")).strip()
        category = str(item.get("category", "General")).strip()
        tip      = str(item.get("tip", "")).strip()
        if text:
            questions.append(GeneratedQuestion(text=text, category=category, tip=tip))
    if not questions:
        raise ValueError("No valid questions parsed")
    return questions


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class InterviewQuestionGeneratorService:

    async def generate(self, request: GenerateQuestionsRequest) -> GeneratedQuestionsResponse:
        """Generate questions using Gemini → Groq fallback."""
        user_prompt = _USER_TEMPLATE.format(
            candidate_name=request.candidate_name or "the candidate",
            resume_text=(request.resume_text or "(No resume provided)")[:3000],
            job_description=(request.job_description or "(No job description provided)")[:3000],
            job_title=request.job_title or "the role",
            num_questions=request.num_questions,
        )

        settings = get_settings()

        # ── Gemini primary ──────────────────────────────────────────────────
        if settings.google_api_key:
            try:
                logger.info("Generating questions via Gemini %s", settings.gemini_model)
                client = genai.Client(api_key=settings.google_api_key)
                response = await client.aio.models.generate_content(
                    model=settings.gemini_model,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=_SYSTEM_PROMPT,
                        temperature=0.7,
                        max_output_tokens=2048,
                    ),
                )
                raw = response.text or ""
                questions = _validate_questions(_extract_json(raw), request.num_questions)
                logger.info("Gemini generated %d questions", len(questions))
                return GeneratedQuestionsResponse(
                    job_title=request.job_title,
                    questions=questions,
                )
            except Exception as exc:
                logger.warning("Gemini question generation failed: %s. Trying Groq.", exc)

        # ── Groq fallback ───────────────────────────────────────────────────
        if settings.groq_api_key:
            try:
                logger.info("Generating questions via Groq %s", GROQ_MODEL)
                groq_client = AsyncGroq(api_key=settings.groq_api_key)
                completion = await groq_client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user",   "content": user_prompt},
                    ],
                    temperature=0.7,
                    max_tokens=2048,
                )
                raw = completion.choices[0].message.content or ""
                questions = _validate_questions(_extract_json(raw), request.num_questions)
                logger.info("Groq generated %d questions", len(questions))
                return GeneratedQuestionsResponse(
                    job_title=request.job_title,
                    questions=questions,
                )
            except Exception as exc:
                logger.error("Groq question generation also failed: %s", exc)
                raise HTTPException(
                    status_code=502,
                    detail=f"Both LLMs failed to generate questions: {exc}",
                ) from exc

        raise HTTPException(
            status_code=503,
            detail="No LLM API key configured. Set GOOGLE_API_KEY or GROQ_API_KEY.",
        )
