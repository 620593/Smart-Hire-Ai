# AI Project Knowledge Base — SmartHire AI

**SmartHire AI** is an AI-powered mock interview and candidate assessment platform: candidates take simulated interviews with webcam/mic support, and the system uses AI (resume parsing, question generation, speech-to-text, emotion/eye-contact analysis, rubric-based scoring) to produce actionable feedback and performance analytics.

This directory contains the persistent project context and development guidelines for the platform. Every contributor and AI coding assistant should follow these documents throughout the project lifecycle.

## Files
| File | Purpose |
|---|---|
| [project-context.md](./project-context.md) | Vision, objectives, milestones, tech stack, system overview, scoring model summary |
| [architecture.md](./architecture.md) | System architecture, services (auth, question generation, ASR, scoring), AI/ML pipeline, request flow |
| [coding-standards.md](./coding-standards.md) | Coding conventions, formatting, naming, documentation, testing/mocking rules for AI providers |
| [backend-rules.md](./backend-rules.md) | FastAPI (primary) / Django REST Framework conventions, AI pipeline rules, Celery workers, layering |
| [frontend-rules.md](./frontend-rules.md) | React architecture, Interview Room media-handling rules, state management, styling, routing |
| [git-workflow.md](./git-workflow.md) | Branching, commit conventions, PR workflow, code review, release strategy tied to weekly milestones |
| [api-guidelines.md](./api-guidelines.md) | REST conventions, async/AI-processing endpoints, media uploads, pagination, error envelope |
| [database-guidelines.md](./database-guidelines.md) | Domain model (users, resumes, sessions, questions, assessments), scoring data model, retention |
| [security.md](./security.md) | Auth, JWT/OAuth2, RBAC, and — critically — biometric/media data handling and retention |
| [milestone-1.md](./milestone-1.md) | Week 1 & 2 plan: requirements, DB design, core setup, auth, resume upload |

## Recommended Reading Order
1. `project-context.md` — understand what we're building and why.
2. `architecture.md` — understand the services, AI/ML pipeline, and scoring model.
3. `coding-standards.md` — general conventions for all code.
4. `backend-rules.md` / `frontend-rules.md` — layer-specific rules for whichever side you're working on.
5. `api-guidelines.md` and `database-guidelines.md` — before touching endpoints or models.
6. `security.md` — **mandatory** before touching auth, permissions, or any audio/video/biometric data.
7. `git-workflow.md` — before opening your first PR.
8. `milestone-1.md` (and subsequent milestone docs as they're added for Weeks 3–8) — current sprint/phase scope.
