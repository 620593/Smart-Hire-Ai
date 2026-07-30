"""Help Center AI agent endpoint for SmartHire AI.

Uses Groq's llama-3.2-3b-preview (3B parameter model) to handle user queries.

Escalation logic:
  - Website/technical/platform bugs → escalate_to = "admin"
  - Hiring process / communication / recruiter coordination → escalate_to = "recruiter"
  - Everything else (FAQs, how-to, general guidance) → handled by agent (no escalation)
"""

from __future__ import annotations

import json
import re
from typing import Literal

from fastapi import APIRouter, HTTPException
from groq import AsyncGroq, GroqError
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.logging import logger_factory

router = APIRouter(prefix="/help", tags=["help"])
logger = logger_factory("app.api.help")

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class HelpMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class HelpChatRequest(BaseModel):
    message: str
    history: list[HelpMessage] = []


class HelpChatResponse(BaseModel):
    response: str
    escalate_to: Literal["none", "admin", "recruiter"] = "none"
    escalation_reason: str | None = None


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """
You are AIRA Help, SmartHire AI's friendly and concise support assistant.

SmartHire AI is an AI-powered hiring platform that provides:
- AI Mock Interview sessions with video/audio analysis (for candidates)
- ATS Resume Scoring and keyword optimization (for candidates)
- Speech analytics and interview performance diagnostics
- Recruiter portals for candidate screening and pipeline management
- Admin panel for managing users, API keys, and system health

Your responsibilities:
1. Answer questions directly and helpfully about how to use SmartHire AI
2. Help with account issues, feature explanations, navigation guidance, common errors
3. Provide tips for better interview performance, resume optimization, etc.
4. Decide whether to escalate the issue

ESCALATION RULES (strictly follow):
- If the user reports a WEBSITE BUG, SERVER ERROR, LOGIN FAILURE, PAGE CRASH, DATA LOSS,
  PAYMENT ISSUE, or any TECHNICAL PLATFORM PROBLEM → escalate to admin
- If the user needs help with HIRING PROCESS, JOB APPLICATION STATUS, RECRUITER CONTACT,
  INTERVIEW SCHEDULING, OFFER NEGOTIATION, CANDIDATE PIPELINE UPDATES, or any HUMAN COMMUNICATION
  that the platform cannot automate → escalate to recruiter
- For everything else (navigation, features, how-to guides, tips, general FAQs) →
  resolve it yourself. Do NOT escalate unless truly necessary.

RESPONSE FORMAT (ALWAYS return valid JSON, no markdown fences):
{
  "response": "<your helpful reply to the user>",
  "escalate_to": "none" | "admin" | "recruiter",
  "escalation_reason": null | "<brief reason why escalation is needed>"
}

Rules:
- Keep responses concise and friendly (under 150 words when possible)
- Be empathetic but efficient
- NEVER mention competitor products
- If escalating, still give a helpful summary response AND explain who will follow up
- Only escalate once per conversation (don't re-escalate the same issue)
""".strip()


def _extract_json(raw: str) -> dict:
    """Strip markdown fences and parse JSON from LLM response."""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw, flags=re.IGNORECASE).replace("```", "")
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1:
        cleaned = cleaned[start : end + 1]
    return json.loads(cleaned)


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/chat", response_model=HelpChatResponse)
async def help_chat(payload: HelpChatRequest) -> HelpChatResponse:
    """Send a message to the Help Center AI agent.

    The agent uses Groq llama-3.2-3b-preview. If it cannot resolve the
    query it escalates to admin (technical issues) or recruiter (process/
    communication issues).
    """
    settings = get_settings()
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=503,
            detail="Groq API key is not configured on the server.",
        )

    # Build message history for context
    messages: list[dict] = [{"role": "system", "content": _SYSTEM_PROMPT}]
    for msg in payload.history[-10:]:   # keep last 10 turns for context
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": payload.message})

    try:
        client = AsyncGroq(api_key=settings.groq_api_key)
        completion = await client.chat.completions.create(
            model="llama-3.2-3b-preview",
            messages=messages,  # type: ignore[arg-type]
            temperature=0.4,
            max_tokens=512,
        )
    except GroqError as exc:
        logger.error("Groq API error in Help Center: %s", exc)
        raise HTTPException(status_code=502, detail=f"Groq API error: {exc}") from exc
    except Exception as exc:
        logger.exception("Unexpected error calling Groq in Help Center: %s", exc)
        raise HTTPException(status_code=502, detail="Help agent temporarily unavailable.") from exc

    raw = (completion.choices[0].message.content or "").strip()
    logger.debug("Help agent raw response: %.300s", raw)

    try:
        data = _extract_json(raw)
        return HelpChatResponse(
            response=str(data.get("response", "I'm here to help! Could you rephrase your question?")),
            escalate_to=data.get("escalate_to", "none"),
            escalation_reason=data.get("escalation_reason"),
        )
    except (json.JSONDecodeError, KeyError, ValueError) as exc:
        logger.warning("Help agent non-JSON response, returning raw: %s", exc)
        # If the model didn't follow the JSON format, return the raw text gracefully
        return HelpChatResponse(
            response=raw or "I'm here to help! Could you rephrase your question?",
            escalate_to="none",
            escalation_reason=None,
        )
