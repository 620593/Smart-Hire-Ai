# Backend Rules — SmartHire AI (FastAPI / Django REST Framework)

## 0. Framework Choice
The tech stack lists **Python (Django REST Framework / FastAPI)**. This project standardizes on **FastAPI** as the primary framework for all new services, because:
- Native `async`/`await` support is required for AI provider calls (OpenAI, Whisper) and real-time interview-session endpoints.
- Pydantic-based validation gives strong typing for the AI-heavy request/response contracts (scores, transcripts, feedback).

If a contributor uses Django REST Framework for a specific service (e.g. an admin-heavy CRUD module), it must still follow the layering, naming, and error-envelope rules in this document and in `api-guidelines.md` — DRF is an accepted implementation detail, not an excuse to diverge from project conventions. New AI/real-time functionality (question generation, ASR, scoring, session management) must be built in FastAPI.

## 1. Project Layering (recap from architecture.md)
`api/` (routers) → `services/` (business logic, incl. AI orchestration) → `repositories/` (data access) → `models/`. Pydantic `schemas/` are used at the API boundary. `services/ai/` wraps all external AI/ML providers.

## 2. FastAPI Conventions
- One router per resource, in `app/api/v1/<resource>.py` (e.g. `resumes.py`, `interview_sessions.py`, `assessments.py`), registered under `/api/v1/...`.
- Route handlers stay thin: parse → delegate to service → return schema. No business or scoring logic in handlers.
- Response models are **always** declared via `response_model=` — never return raw ORM objects, raw transcripts, or raw AI-provider payloads.
- Use `status_code=` explicitly on every route (`201` for creation, `202 Accepted` for "processing started" responses like session-completion triggering async scoring, `204` for deletion).
- Endpoints that kick off long-running AI work (transcription, emotion/eye-contact analysis, scoring) return `202 Accepted` immediately with a `processing` status and a resource the client can poll or receive a webhook/notification for — they must never block waiting on model inference.

## 3. Dependency Injection
- DB sessions injected via a `get_db` dependency (yields an `AsyncSession`, closes on request end).
- Current user/role injected via `get_current_user` / `require_role(["recruiter", "admin"])` dependencies — never parsed manually from headers.
- Services constructed via dependency functions (e.g. `get_interview_session_service`) so they, and the AI clients they depend on, can be mocked in tests.

```python
@router.post("/", response_model=InterviewSessionRead, status_code=status.HTTP_201_CREATED)
async def create_interview_session(
    payload: InterviewSessionCreate,
    service: InterviewSessionService = Depends(get_interview_session_service),
    current_user: User = Depends(get_current_user),
) -> InterviewSessionRead:
    session = await service.create_session(payload, candidate_id=current_user.id)
    return InterviewSessionRead.model_validate(session)
```

## 4. ORM / Data Access
- SQLAlchemy 2.x async style (`select()`, `Mapped[...]`, `mapped_column()`) if using FastAPI-native persistence; Django ORM conventions apply 1:1 to any DRF-based service, translated to the equivalent patterns (manager methods = repositories, no business logic in `models.py`).
- Repositories return model instances or `None`/lists — never raise HTTP exceptions.
- Use explicit eager loading for relationships you know you'll need (e.g., an `InterviewSession` with its `Question`s and `Assessment`); never rely on implicit lazy-load in async context.

## 5. Service Layer Rules
- Services own transaction boundaries: complete all repository calls and commit, or roll back on error.
- Services raise domain exceptions (`ResumeParsingError`, `TranscriptionFailedError`, `SessionAlreadyScoredError`) — routers never contain per-route `try/except`; a global exception handler maps these to the standard error envelope.
- Cross-entity orchestration (e.g., completing a session → enqueueing ASR → enqueueing CV analysis → enqueueing scoring → triggering notification) belongs in the service, coordinated as a pipeline of Celery tasks, not built as one giant synchronous function.
- Services calling AI providers go **through `services/ai/`** (e.g. `services/ai/openai_client.py`, `services/ai/whisper_client.py`, `services/ai/emotion_client.py`, `services/ai/eye_tracking_client.py`) — never `import openai` or similar directly inside a service module outside that package.

## 6. AI/ML Pipeline Rules
- **Question Generation**: prompts sent to OpenAI must include resume-derived skills/experience and the requested interview type/domain/difficulty; responses are validated against a structured schema before being persisted as `Question` records — never persist raw, unvalidated LLM output as a question.
- **Speech-to-Text (Whisper)**: audio is uploaded to media storage first, then a worker task passes the storage reference to Whisper — never streams raw audio through the request/response cycle of a synchronous endpoint.
- **Emotion Detection (DeepFace) / Eye-Contact Tracking (MediaPipe)**: run against sampled video frames (not full video) for cost/performance; sampling rate is a configurable setting, not a hardcoded constant.
- **Scoring**: the Analysis & Scoring Service is the **only** place the rubric weights (`Communication 30% / Confidence 25% / Technical Relevance 30% / Professionalism 15%`) are applied; these weights live in one named constant module (`core/scoring_constants.py`), never duplicated inline.
- All AI provider calls must have a timeout and `max_retries`/backoff configured; failures update the session's processing status to a clear failed state rather than leaving it stuck in "processing" indefinitely.

## 7. Error Handling
- Domain exceptions registered centrally (`app/core/exception_handlers.py`), mapped to the standard error envelope (see `api-guidelines.md`).
- Never let a raw provider exception (`openai.APIError`, a DeepFace/MediaPipe runtime error) leak to the client — catch at the service/AI-client boundary and translate to a domain exception with a safe message.

## 8. Background Jobs (Celery)
- Tasks live in `app/workers/tasks/`, one file per pipeline stage: `transcription.py`, `emotion_analysis.py`, `eye_tracking.py`, `scoring.py`, `notifications.py`, `resume_parsing.py`.
- Tasks call **services**, not repositories or AI clients directly, to keep business rules in one place and behavior consistent with any synchronous path.
- Tasks must be idempotent — safe to retry (e.g., re-running transcription overwrites the prior transcript rather than duplicating it).
- Chain dependent stages explicitly (transcription → scoring must wait on transcription's result) using Celery task chaining/canvas, not polling loops.

## 9. Configuration
- All config (DB URL, Redis URL, OpenAI/Whisper API keys, S3/Cloudinary credentials, OAuth client secrets, JWT signing keys) via environment variables loaded through a typed settings object — no hardcoded values, ever, even in local dev scripts.

## 10. Performance Rules
- Paginate all list endpoints by default (see `api-guidelines.md`).
- N+1 queries are a review blocker.
- No AI/ML inference (transcription, emotion detection, eye tracking, scoring) ever runs synchronously inside a request handler — always dispatched to a worker.
- Media uploads (resume PDFs, session recordings) go directly to object storage (pre-signed URLs) where feasible, rather than proxying large files through the API server.

## 11. Testing
- `pytest` + `pytest-asyncio`, dedicated test database (or transactional rollback per test).
- Repository tests hit a real (test) database; service tests mock repositories and all AI clients; router tests use `TestClient`/`AsyncClient` with mocked services.
- Scoring logic gets dedicated unit tests covering each weight boundary and the full rating rubric (Excellent/Good/Average/Needs Improvement/Poor).
