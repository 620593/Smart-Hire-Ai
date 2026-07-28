# SmartHire AI

SmartHire AI is a production-focused, AI-powered mock interview and candidate assessment platform. It combines real-time speech transcription, MediaPipe face/body-language analysis, and multi-model LLM evaluation to deliver deep, actionable interview feedback to candidates — while giving recruiters and administrators full-platform control through role-scoped dashboards.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Architecture](#project-architecture)
3. [AI Models Used](#ai-models-used)
4. [Today's Implementation — 11 July 2026](#todays-implementation--11-july-2026)
   - [High-Level Overview](#high-level-overview)
   - [Phase 1 — Auth & Database Resilience](#phase-1--auth--database-resilience)
   - [Phase 2 — Interview Analysis Pipeline](#phase-2--interview-analysis-pipeline)
   - [Phase 3 — Gemini 2.5 + Groq Dual-Model Integration](#phase-3--gemini-25--groq-dual-model-integration)
   - [Phase 4 — Frontend Interview Pipeline](#phase-4--frontend-interview-pipeline)
   - [Phase 5 — Admin Control Panel](#phase-5--admin-control-panel)
   - [Phase 6 — Role-Based Access & Navigation](#phase-6--role-based-access--navigation)
5. [Folder Structure](#folder-structure)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Database Migration Workflow](#database-migration-workflow)
9. [Admin Credentials](#admin-credentials)
10. [Branch Strategy](#branch-strategy)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI 0.115, Python 3.12, `uv`, SQLAlchemy 2.0 Async, Alembic, asyncpg |
| **Database** | PostgreSQL 18 (asyncpg driver, connection-pool health probes) |
| **Primary LLM** | Google Gemini 3.1 Flash-Lite (`gemini-3.1-flash-lite`) via `google-genai` SDK |
| **Fallback LLM** | Groq `llama-3.3-70b-versatile` via `groq` async SDK |
| **Vision / CV** | MediaPipe Face Landmarker (WASM, runs 100 % in-browser) |
| **Speech** | Web Speech API (browser-native STT, Chromium-family only) |
| **Frontend** | React 18, Vite, TypeScript 5, Framer Motion, Vanilla CSS |
| **Auth** | JWT access + refresh tokens (RS256 via `python-jose`), HTTPOnly cookie refresh |
| **DevOps** | Docker, Docker Compose, GitHub Actions |

---

## Project Architecture

```text
smarthire-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST endpoints (auth, admin, interview, ats, resumes)
│   │   ├── core/               # Config, security (JWT, deps), lifespan, logging
│   │   ├── db/                 # SQLAlchemy engine, session, enums
│   │   ├── models/             # ORM models (User, Role)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic (auth, ATS, interview_analysis, interview_finalizer)
│   │   ├── repositories/       # DB data-access layer
│   │   ├── middleware/         # CORS, request logging
│   │   └── main.py
│   ├── scripts/                # One-shot admin seeding script
│   ├── alembic/                # Database migrations
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── app/                # Router, providers
│   │   ├── components/         # Layout (DashboardLayout, Sidebar), shared UI
│   │   ├── features/auth/      # AuthContext, useAuth hook
│   │   ├── hooks/              # useInterviewSession, useVideoAnalysis, useSpeechTranscription
│   │   ├── pages/              # Landing, Login, Register, Dashboard (3 roles), Interview, Report
│   │   ├── services/           # apiClient wrappers (auth, interview, ats)
│   │   └── types/              # TypeScript interfaces
│   └── vite.config.ts
├── docs/
├── docker/
└── docker-compose.yml
```

---

## AI Models Used

### 1. Google Gemini 3.1 Flash-Lite — Primary Evaluator

| Property | Value |
|----------|-------|
| **Model ID** | `gemini-3.1-flash-lite` (Configurable via `GEMINI_MODEL`) |
| **SDK** | `google-genai` (Python, v1.0+ async client) |
| **Role** | Per-question analysis + full-interview report generation |
| **Output format** | Forced JSON via `response_mime_type="application/json"` |
| **Temperature** | 0.3 (per-question) · 0.4 (finalisation) |
| **Max tokens** | 1 024 (per question) · 2 048 (final report) |

**What it scores:**
- `answer_quality_score` — content completeness and accuracy
- `communication_score` — clarity, vocabulary, speech structure
- `body_language_score` — eye contact, smile, head stability
- `confidence_score` — composite verbal + non-verbal signal
- `relevance_score` — how directly the answer addressed the question
- `overall_score` — weighted composite

**Final report adds:**
- `recommendation` — `Strong Recommend | Recommend | Neutral | Do Not Recommend`
- `top_strengths` / `top_improvements`
- `communication_summary` + `body_language_summary`
- `weak_question_indices` — list of question indices where score < 60

---

### 2. Groq llama-3.3-70b-versatile — Automatic Fallback

| Property | Value |
|----------|-------|
| **Model ID** | `llama-3.3-70b-versatile` |
| **SDK** | `groq` async Python SDK |
| **Role** | Identical evaluation to Gemini — activated on any Gemini failure |
| **Output format** | `response_format={"type": "json_object"}` |
| **Triggers** | `GOOGLE_API_KEY` missing · rate limit (429) · quota exceeded · any SDK exception |

**Fallback design principle:** The two models share exactly the same system prompt, JSON schema, temperature, and scoring rubric. From the frontend's perspective, responses are indistinguishable.

---

### 3. MediaPipe Face Landmarker — In-Browser Vision Analysis

| Property | Value |
|----------|-------|
| **Runtime** | WASM, runs 100 % client-side (no server round-trip) |
| **Model file** | `face_landmarker.task` (downloaded at first interview start) |
| **Metrics captured** | Eye contact %, attention %, blink rate/min, smile score, head pose (yaw/pitch/roll mean+std), face presence %, body-language confidence score |
| **Frame rate** | 10 fps analysis during answer window |

These metrics are sent alongside the transcript to the LLM for holistic multimodal scoring.

---

### 4. Web Speech API — Real-Time Transcription

| Property | Value |
|----------|-------|
| **Runtime** | Browser-native (Chromium/Edge only) |
| **Mode** | Continuous recognition with interim + final results |
| **Display** | Live captions shown in the interview UI while the user speaks |
| **Browser guard** | Unsupported browsers (Firefox, Safari) are blocked at interview start with a clear warning banner |

---

## Today's Implementation — 11 July 2026

### High-Level Overview

Today's session took the project from a functional auth scaffold to a fully integrated, AI-powered interview assessment platform with a complete admin control panel. Work spanned 6 sequential phases:

```
Auth hardening → Interview pipeline design → Dual-LLM integration
→ Frontend wiring → Admin panel → RBAC cleanup
```

---

### Phase 1 — Auth & Database Resilience

**Problem:** Windows PostgreSQL 18 intermittently enters recovery mode during checkpoints, causing `CannotConnectNowError` on startup.

**Solutions implemented:**

- **`backend/app/core/lifespan.py`** — Added `_wait_for_db()` with exponential backoff (retries up to 10 × with 1 s → 30 s delay). The app won't accept requests until the DB is confirmed healthy.
- **`backend/app/db/database.py`** — Added `connect_args` (`command_timeout=60`, `statement_timeout=30000`) to `create_async_engine`. Reduced `pool_recycle` to 600 s.
- **`backend/.env`** — Tuned `DATABASE_POOL_TIMEOUT` and `DATABASE_POOL_RECYCLE`.
- Fixed `UnicodeEncodeError` on Windows cp1252 terminals by replacing UTF-8 checkmark characters in log output with ASCII equivalents.

---

### Phase 2 — Interview Analysis Pipeline

**Architecture design:**

```
User speaks answer
       ↓
Web Speech API → live transcript
       ↓                           ↘
MediaPipe (10 fps)          transcript text
       ↓
VisionMetrics struct
       ↓
POST /interview/analyze-question  ← one call per question
       ↓
InterviewAnalysisService → Gemini 2.5 / Groq fallback
       ↓
QuestionAnalysisResult (6 scores + feedback)
       ↓ (after all questions)
POST /interview/finalize
       ↓
InterviewFinalizerService → Gemini 2.5 / Groq fallback
       ↓
InterviewFinalizeResponse (overall report + weak questions)
       ↓
ReportPage (full visual report)
```

**New files created:**
- `backend/app/services/interview_analysis.py` — Per-question LLM service
- `backend/app/services/interview_finalizer.py` — Full-interview report service
- `backend/app/api/v1/endpoints/interview.py` — Two REST endpoints
- `backend/app/schemas/interview.py` — All Pydantic schemas

**Auth on interview endpoints:** Uses `verify_jwt_only` (pure JWT decode, no DB round-trip) since the endpoints are fully stateless.

---

### Phase 3 — Gemini 2.5 + Groq Dual-Model Integration

**Implementation pattern** (same in both services):

```python
try:
    result = await self._call_gemini(prompt)   # Primary
except HTTPException:
    raise                                        # 422 parse errors: don't retry
except Exception as gemini_err:
    logger.warning("Gemini unavailable — falling back to Groq")
    result = await self._call_groq(prompt)      # Fallback
```

**Key implementation details:**
- Gemini uses `client.aio.models.generate_content()` with `response_mime_type="application/json"` to force structured output
- Groq uses `response_format={"type": "json_object"}` for equivalent JSON mode
- Both share identical system prompts and response schemas
- JSON extraction strips markdown fences before parsing (`_extract_json()`)
- Pydantic `model_validate()` validates all 6 score fields before returning

**New security dependency added:**
```python
# backend/app/core/security/dependencies.py
async def verify_jwt_only(token: str | None = Depends(oauth2_scheme)) -> dict:
    """Validates JWT cryptographically — no DB round-trip."""
```

---

### Phase 4 — Frontend Interview Pipeline

**401 fix:** The original `interview.ts` used `fetch()` + `localStorage.getItem("access_token")`. The app stores tokens **in-memory only** via `setAccessToken()` in `lib/axios.ts`. Fix: switched to `apiClient` (axios), which auto-injects the Bearer token via the request interceptor.

**Frontend hooks:**

| Hook | Responsibility |
|------|----------------|
| `useInterviewSession` | Orchestrates full interview: question cycling, transcript collection, vision metric aggregation, per-question API calls, finalization |
| `useVideoAnalysis` | MediaPipe Face Landmarker — streams 10 fps analysis, accumulates running averages |
| `useSpeechTranscription` | Web Speech API wrapper with browser support detection and live caption state |

**Pages:**
- `InterviewPage.tsx` — Full interview UI: webcam feed, live captions, question display, progress, timer
- `ReportPage.tsx` — Visual report: overall score gauge, per-question breakdown, strengths/improvements, weak question callouts, recommendation badge

---

### Phase 5 — Admin Control Panel

**Backend — 10 admin endpoints** (`/api/v1/admin/`):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/recruiters/pending` | Pending approval queue |
| GET | `/recruiters` | All recruiters (any status) |
| POST | `/recruiters/{id}/approve` | Approve recruiter |
| POST | `/recruiters/{id}/reject` | Suspend recruiter |
| DELETE | `/recruiters/{id}` | Hard-delete recruiter |
| GET | `/users` | All platform users |
| POST | `/users/{id}/activate` | Re-enable account |
| POST | `/users/{id}/deactivate` | Disable account |
| GET | `/stats` | Live platform counts |
| GET | `/health` | **Live DB + Gemini + Groq probes** |

**Frontend — `AdminDashboardPage.tsx` (4 tabs):**

| Tab | Features |
|-----|----------|
| **Overview** | 6 live stat cards (total users, recruiters, candidates, pending, active, suspended) · Quick-action tiles · Pending count badge |
| **Recruiters** | Search + filter (All / Pending / Active / Suspended) · Inline Approve / Suspend / Reinstate / Delete · Confirmation dialogs · Toast notifications |
| **All Users** | Search · Role badge · Activate / Deactivate toggle · Last login column |
| **System Health** | Live concurrent probes for PostgreSQL, Gemini 2.5 Flash, Groq llama-3.3-70b · Latency in ms · Color-coded status · `.env` config reference |

**System health probe implementation:**
```python
# Runs all three checks concurrently with asyncio.gather
db_status, gemini_status, groq_status = await asyncio.gather(
    _check_db(db),
    _check_gemini(),
    _check_groq(),
)
```

---

### Phase 6 — Role-Based Access & Navigation

**Final nav configuration per role:**

| Role | Navigation Items |
|------|-----------------|
| **Admin** | Dashboard · Candidates · Reports · AI Config · Audit Logs |
| **Recruiter** | Dashboard · Candidates · Reports · Library · Team |
| **Candidate** | Dashboard · Resume · Mock Interviews · AI Feedback |

**Interview access is Candidate-only.** Admins monitor the platform through the admin panel; recruiters use the candidates pipeline.

**`verify_jwt_only` dependency** ensures interview endpoints validate auth without DB access:
- No DB connection required per request
- Zero performance penalty from DB connectivity issues
- JWT cryptographic validation is still enforced

---

## Getting Started

### Prerequisites

- Python 3.12+, `uv` package manager
- Node.js 20+, npm
- PostgreSQL 18

### Backend

```bash
cd backend
uv sync                          # Install dependencies
cp .env.example .env             # Configure environment variables
uv run alembic upgrade head      # Run database migrations
uv run python scripts/create_admin.py   # Seed admin user
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                      # Starts on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/smarthire
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20
DATABASE_POOL_TIMEOUT=30
DATABASE_POOL_RECYCLE=600

# JWT
SECRET_KEY=your-256-bit-secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI Models — at least one required
GOOGLE_API_KEY=your_gemini_key       # Primary: Gemini 2.5 Flash
GROQ_API_KEY=gsk_...                 # Fallback: llama-3.3-70b-versatile
```

If `GOOGLE_API_KEY` is blank, **all analysis requests automatically fall back to Groq** — no code change required.

---

## Database Migration Workflow

```bash
uv run alembic revision --autogenerate -m "message"
uv run alembic upgrade head
uv run alembic downgrade -1
uv run alembic current
uv run alembic history
```

---

## Admin Credentials

Default admin account seeded by `scripts/create_admin.py`:

| Field | Value |
|-------|-------|
| Username | `ranjith` |
| Password | `ranjith143` |
| Email | `ranjith@smarthire.ai` |
| Role | `admin` |

> **Change this password immediately in any non-development environment.**

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, releasable work only |
| `develop` | Integration branch |
| `feature/*` | New features and enhancements |
| `fix/*` | Bug fixes and corrective changes |
| `chore/*` | Maintenance, tooling, non-product updates |

---

## License

[MIT](LICENSE)
