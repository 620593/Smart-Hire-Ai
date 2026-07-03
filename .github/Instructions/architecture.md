# Architecture — SmartHire AI

## 1. Architectural Style
SmartHire AI follows a **service-oriented layered architecture** on the backend, fronted by a React SPA, with all heavy AI/ML processing (speech-to-text, emotion detection, eye-contact tracking, scoring) isolated behind dedicated services and run **asynchronously** so live interview sessions and API requests never block on model inference.

## 2. System Components (per the reference architecture diagram)

### Frontend (React.js)
- **Candidate Interface**: Interview Room (webcam/mic capture), Dashboard & Analytics, Reports & Feedback.
- **Admin/Recruiter Interface**: User Management, Interview (template) Management, Analytics Dashboard, Reports.

### Backend Services
| Service | Responsibility |
|---|---|
| API Gateway & REST API | Single entry point, request routing, auth enforcement |
| Authentication Service | JWT issuance/verification, OAuth2 login (Google/GitHub), session management |
| User & Role Management Service | CRUD for users, role assignment (candidate/recruiter/admin), org-free single-tenant user directory |
| Interview Session Service | Session lifecycle: create, store questions, timer/workflow, store recordings metadata |
| Question Generation Service (AI) | Calls OpenAI API to generate HR/technical/behavioral/aptitude questions from resume + template parameters |
| Speech Processing Service (ASR) | Sends session audio to Whisper API, returns transcript |
| Analysis & Scoring Service | Runs communication/confidence/technical/professionalism scoring against the rubric, stores results |
| Notification Service | Interview reminders, email notifications, session alerts, push notifications |

### AI/ML Services (invoked by the backend services above, never called directly by routers)
- **Speech-to-Text** — Whisper API.
- **Emotion Detection** — DeepFace / CNN-based model.
- **Eye-Contact Tracking** — MediaPipe.
- **Confidence & Filler-Word Analysis** — combines ASR transcript (filler words, pace) with CV signals (eye contact, facial engagement).

### Database & Storage
- **PostgreSQL** — relational data: users, resumes (metadata), sessions, questions, scores, feedback.
- **Media Storage (S3/Cloudinary)** — resume PDFs, session audio/video recordings.
- **Redis Cache** — session/cache data, rate limiting, Celery/task-queue broker.

### External Services
- OAuth Providers (Google, GitHub).
- Email Provider (SendGrid/SES).
- Push Notifications (FCM).

### Deployment & Infrastructure
- Frontend Hosting: Vercel/Netlify (static build).
- Backend Hosting: Docker containers on AWS/GCP/Azure/Render.
- CI/CD: GitHub Actions.

## 3. Backend Layering
```
Client
  │
  ▼
API Layer (routers)                 → HTTP concerns only
  │
  ▼
Service Layer (business logic)      → orchestrates use cases, calls AI/ML services
  │
  ├──► Repository Layer (data access) → SQLAlchemy/ORM queries, no business logic
  │            │
  │            ▼
  │      Database (PostgreSQL)
  │
  └──► AI Client Layer (services/ai/) → OpenAI, Whisper, DeepFace, MediaPipe wrappers
```
- Routers depend on Services. Services depend on Repositories **and** the AI Client Layer. Repositories depend on Models.
- Routers never call the database or an AI provider directly.
- Services never construct SQL/ORM queries directly — delegate to a repository.
- AI provider calls (OpenAI, Whisper, DeepFace, MediaPipe) are wrapped behind a single abstraction per provider in `services/ai/`, so a provider swap (e.g., a different ASR vendor) touches one module only, and providers are mockable in tests.

## 4. Request/Processing Flow (Example: Take a Mock Interview)
1. Candidate starts a session: `POST /api/v1/interview-sessions` — router validates payload, calls `InterviewSessionService.create_session(...)`.
2. Service calls `QuestionGenerationService` (wraps OpenAI API) using the candidate's parsed resume + selected template (domain, difficulty, interview type) to generate questions; persists them via the repository.
3. Frontend Interview Room streams webcam/mic to the backend; audio chunks and periodic video frames are uploaded and queued for async processing (never processed synchronously in the request/response cycle).
4. On session completion, background workers:
   - Send audio to the **Speech Processing Service** (Whisper) → transcript.
   - Run **Emotion Detection** (DeepFace) and **Eye-Contact Tracking** (MediaPipe) against sampled video frames.
   - Feed transcript + CV signals into the **Analysis & Scoring Service**, which computes the four rubric sub-scores and the weighted Overall Score.
5. **Notification Service** informs the candidate (email/push) that results are ready.
6. Candidate views results via `GET /api/v1/interview-sessions/{id}/assessment`, which returns scores, rating, and AI-generated feedback (strengths, weaknesses, suggestions, resources).

## 5. Scoring Model
```
Overall Score = (Communication × 30%) + (Confidence × 25%) + (Technical Relevance × 30%) + (Professionalism × 15%)
```
| Component | Weight | Parameters |
|---|---|---|
| Communication | 30% | Speech clarity, grammar quality, filler-word frequency, speaking pace, response completeness |
| Confidence | 25% | Eye-contact consistency, facial engagement, response hesitation, speaking confidence, attention level |
| Technical Relevance | 30% | Technical accuracy, keyword relevance, problem-solving ability, domain knowledge, answer completeness |
| Professionalism | 15% | Time management, response organization, professional communication, interview etiquette |

Rating rubric: **90–100 Excellent · 75–89 Good · 60–74 Average · 40–59 Needs Improvement · Below 40 Poor.**

The Analysis & Scoring Service must persist each sub-score and its contributing raw signals (not just the final number) so results are explainable and re-auditable — see `database-guidelines.md` §Scoring Data Model.

## 6. Frontend Architecture
- **Feature-based structure**, grouped by domain (`features/interview-room`, `features/dashboard`, `features/resume`, `features/admin`).
- **Server state** (sessions, scores, resumes) managed by React Query or equivalent caching layer on top of Axios; never duplicated into Redux.
- **Client/UI state** (interview-room recording state, timer, current question index, wizard steps) managed via Redux or Context API, scoped to the feature that owns it.
- **Interview Room** is the most complex feature: owns webcam/mic MediaStream lifecycle, chunked upload of audio/video, live transcript display (optional), and timer-based workflow — isolated from the rest of the app so its real-time complexity doesn't leak into shared state.
- Framer Motion used for interview-room transitions (question changes, recording indicators) — kept to this feature, not app-wide, to avoid unnecessary bundle weight elsewhere.

## 7. Cross-Cutting Concerns
- **Auth**: JWT access/refresh tokens + OAuth2 (Google/GitHub) issued by the Authentication Service; frontend stores access token in memory, refresh token in httpOnly cookie.
- **Error handling**: unified error envelope (see `api-guidelines.md`).
- **Logging**: structured JSON logs; correlation ID propagated from request through async workers so a session's full processing pipeline (upload → ASR → CV → scoring → notification) can be traced end to end.
- **Config**: environment-driven; no hardcoded API keys for OpenAI/Whisper/S3/OAuth providers (see `security.md`).

## 8. Module Responsibility Summary
| Module | Responsibility | Must Not Do |
|---|---|---|
| `api/` | HTTP routing, request/response mapping | Business logic, direct DB or AI provider calls |
| `services/` | Business rules, orchestration across repositories and AI clients | Own SQL, know about HTTP, call AI providers directly (must use `services/ai/`) |
| `services/ai/` | Thin wrappers around OpenAI, Whisper, DeepFace, MediaPipe | Business/scoring logic — that belongs in the Analysis & Scoring service |
| `repositories/` | Persistence, queries | Business rules, validation |
| `schemas/` | Input/output validation | Persistence logic |
| `models/` | DB table definitions | Business logic |
| `workers/` | Async execution: ASR, emotion/eye-contact analysis, scoring, notifications | Duplicate service logic |
| `core/` | Config, security, shared infra | Domain-specific logic |
