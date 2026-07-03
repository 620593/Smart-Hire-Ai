# Milestone 1 — Week 1 & 2: Requirements, Database Design & Core Setup

## 1. Objective
Establish the technical foundation for SmartHire AI: define project scope and interview workflows, design the database schema, produce UI wireframes, stand up frontend and backend environments, implement authentication and role-based access control, configure PostgreSQL, and build the initial resume management workflows. No AI-driven question generation, speech analysis, or scoring is in scope yet — this milestone produces the platform every later AI module will plug into.

## 2. Scope
### In Scope
- Define project scope and interview workflows (technical/HR/behavioral/aptitude, session lifecycle).
- Design the database schema for `users`, `resumes`, `interview_templates`, `interview_sessions` (skeleton), `questions` (skeleton) — see `database-guidelines.md`.
- Create UI wireframes and workflow planning for the Candidate and Recruiter/Admin interfaces.
- Set up frontend (React.js) and backend (FastAPI, per `backend-rules.md` §0) project environments.
- Implement authentication (JWT + OAuth2 login) and role-based access control (`candidate`, `recruiter`, `admin`).
- Configure PostgreSQL (production) and SQLite (local dev).
- Build resume management workflows: upload, storage, listing, deletion — **without** AI skill extraction yet (that's Milestone 2).
- CI pipeline: lint, type-check, test, build for both backend and frontend.
- Local dev environment via `docker-compose` (API, Postgres, Redis).

### Out of Scope (later milestones)
- AI-based skill extraction and interview generation APIs (Milestone 2).
- Interview room interface and session recording/workflow (Milestone 2).
- Speech-to-text, filler-word detection, emotion recognition, eye-contact tracking, scoring engine (Milestone 3).
- Analytics dashboards, reports/notifications, production deployment (Milestone 4).

## 3. Deliverables
1. `backend/` FastAPI app runnable via `docker-compose up`, with `/api/v1/health` returning `200`.
2. `frontend/` React app runnable via `npm run dev`, with a login/register page and a protected dashboard shell (empty state, ready for later milestones).
3. Database schema + migrations for `users` and `resumes`, plus skeleton tables for `interview_templates`, `interview_sessions`, `questions` (columns that later milestones will populate), following `database-guidelines.md` conventions.
4. Working auth flow: register (local) → login → OAuth2 login (Google/GitHub) → access protected endpoint → refresh token → logout.
5. Role-based access control enforced: `candidate`, `recruiter`, `admin` roles gate the appropriate endpoints (verified via tests).
6. Resume management workflow: candidates can upload a PDF resume, list their resumes, view resume metadata, and delete a resume; files stored in object storage (S3/Cloudinary) per `security.md` §6.
7. UI wireframes (Candidate: Interview Room placeholder, Dashboard, Reports; Admin/Recruiter: User Management, Interview Management, Analytics, Reports) reviewed and signed off.
8. CI workflow (GitHub Actions) running on every PR: backend lint/type-check/test, frontend lint/type-check/test/build.
9. Updated `README.md` with setup instructions.

## 4. Task Breakdown
### Requirements & Design
- [ ] Define project scope and interview workflows (session types, statuses, high-level lifecycle diagram).
- [ ] Design database schema for core entities (see `database-guidelines.md` §2).
- [ ] Create UI wireframes and workflow planning for Candidate and Admin/Recruiter interfaces.

### Backend
- [ ] Scaffold FastAPI project structure (`api/`, `core/`, `models/`, `schemas/`, `services/`, `repositories/`, `workers/`, `services/ai/` placeholder).
- [ ] Configure typed settings (env vars), `.env.example`.
- [ ] Set up async SQLAlchemy engine + session dependency; configure PostgreSQL (prod) and SQLite (local dev only).
- [ ] Set up Alembic; initial migrations for `users`, `resumes`, and skeleton `interview_templates`/`interview_sessions`/`questions` tables.
- [ ] Implement password hashing (bcrypt), JWT issuance/verification (access + refresh), refresh-token rotation.
- [ ] Implement OAuth2 login (Google, GitHub).
- [ ] Implement `/auth/register`, `/auth/login`, `/auth/oauth/{provider}`, `/auth/refresh`, `/auth/logout`.
- [ ] Implement `get_current_user` and `require_role([...])` dependencies.
- [ ] Implement resume upload/list/get/delete endpoints (PDF validation, size limit, object-storage integration).
- [ ] Global exception handlers mapping domain exceptions → standard error envelope (`api-guidelines.md`).
- [ ] Unit tests for services; integration tests for auth, RBAC, and resume CRUD endpoints.

### Frontend
- [ ] Scaffold React + TypeScript + Tailwind project; configure ESLint/Prettier.
- [ ] Set up routing shell (`react-router`), `<RequireAuth>` and `<RequireRole>` guards.
- [ ] Build login/register pages and OAuth2 login buttons, wired to auth API.
- [ ] Implement auth token handling (in-memory access token, refresh flow, Axios interceptor).
- [ ] Build dashboard shell layout (nav, role-aware menu) for Candidate and Admin/Recruiter interfaces per wireframes.
- [ ] Build resume upload/list/delete UI.
- [ ] Set up API client layer (`src/api/`) and shared error-handling.
- [ ] Component/integration tests for login flow, OAuth callback, and resume upload/list/delete.

### DevOps / Infra
- [ ] `docker-compose.yml`: API, Postgres, Redis services.
- [ ] GitHub Actions CI: backend job (lint, mypy, pytest), frontend job (lint, tsc, jest, build).
- [ ] Pre-commit hooks (black, isort, ruff, prettier, eslint).
- [ ] `.env.example` for both backend and frontend, including placeholders for OpenAI/Whisper/S3/OAuth keys that later milestones will use (documented but not yet required to be functional).

## 5. Acceptance Criteria (per PDF §6, "Milestone 1 (Week 2)")
- Backend initialization completed.
- Authentication workflows implemented (local + OAuth2, JWT issuance/refresh/logout).
- Database schema finalized (core tables + skeleton AI-pipeline tables per `database-guidelines.md`).
- Frontend setup completed (routing shell, auth pages, dashboard shell).
- Working authentication and user management system, with RBAC verified: a `candidate` cannot access recruiter/admin-only endpoints (returns `403`), and a user cannot view another user's resumes (returns `404`).
- All endpoints follow the response/error envelope defined in `api-guidelines.md`.
- All new tables follow `database-guidelines.md` conventions (UUID PK, timestamps, soft-delete where applicable, indexes).
- CI passes on `main` with lint, type-check, and test stages green for both backend and frontend.
- No secrets committed; `.env.example` present and accurate.

## 6. Risks & Open Questions
- **Framework decision (FastAPI vs. DRF)**: the tech stack lists both; this milestone standardizes on FastAPI (see `backend-rules.md` §0) — confirm with the team before Milestone 2 if any service should instead be DRF-based.
- **Object storage provider**: S3 vs. Cloudinary — pick one for this milestone's resume upload implementation; the abstraction should make switching low-cost later.
- **OAuth provider scopes**: confirm which Google/GitHub scopes are actually needed (email/profile only) to avoid over-requesting permissions.
- **Recruiter/Admin interface depth**: wireframes are produced this milestone, but full Recruiter analytics and Admin AI-configuration screens are not built until Milestones 2–4; confirm the dashboard shell only needs empty/placeholder states for now.

## 7. Definition of Done
All deliverables merged to `main` via reviewed PRs following `git-workflow.md`, CI green, acceptance criteria verified manually and via automated tests, and this document's checkboxes fully checked before tagging release `v0.1.0`.
