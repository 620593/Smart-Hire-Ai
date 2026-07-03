# Coding Standards — SmartHire AI

These standards apply to all code, written by humans or AI assistants. Code review will reject PRs that violate them without justification.

## 1. General Principles
- Optimize for **readability first**, then performance. Clever one-liners are discouraged.
- Every function should do one thing. If you need "and" to describe it, split it.
- Prefer explicit over implicit (explicit imports, explicit return types, explicit error handling).
- No dead code, commented-out blocks, or `TODO`s without a linked issue.
- Fail fast: validate inputs early and raise/return clear errors rather than propagating `None`/`null` silently.
- AI/ML calls (OpenAI, Whisper, DeepFace, MediaPipe) are **never** invoked inline in request handlers, workers' business logic, or components — always through the `services/ai/` abstraction (backend) documented in `architecture.md`.

## 2. Python (Backend)
- **Formatting**: `black` (line length 88) + `isort` for imports. Enforced via pre-commit.
- **Linting**: `ruff` for style/bugs; `mypy` in strict mode for type checking.
- **Type hints are mandatory** on all function signatures, including return types.
- **Naming**:
  - `snake_case` for functions, variables, modules.
  - `PascalCase` for classes, Pydantic/DRF serializers, ORM models.
  - `UPPER_SNAKE_CASE` for constants (e.g. `MAX_RESUME_SIZE_MB`, `SCORING_WEIGHTS`).
  - Boolean variables/functions prefixed with `is_`, `has_`, `can_` (e.g. `is_session_complete`, `has_transcript`).
- **Imports**: absolute imports only, grouped stdlib → third-party → local, separated by blank lines.
- **Docstrings**: Google-style docstrings on all public functions/classes; scoring and AI-pipeline functions must document their inputs, output ranges, and units (e.g. "returns a float 0–100").
- **Async**: all I/O-bound functions (DB, HTTP, file/media access, AI provider calls) must be `async def`; never mix blocking calls inside async code — use `httpx.AsyncClient`, async S3/Cloudinary SDKs, `asyncio.sleep`.
- **Exceptions**: never use bare `except:`; catch specific exceptions; define custom exception classes per domain (e.g. `TranscriptionFailedError`, `ResumeParsingError`) in `core/exceptions.py`.

## 3. TypeScript / React (Frontend)
- **Formatting**: Prettier (2-space indent, single quotes, trailing commas) + ESLint (`airbnb-typescript` base + custom rules).
- **Strict TypeScript**: `strict: true` in `tsconfig.json`; no `any` without an inline comment explaining why.
- **Naming**:
  - `PascalCase` for components, types, interfaces.
  - `camelCase` for functions, variables, hooks (`useInterviewSession`, `useWebcamStream`).
  - Files: `PascalCase.tsx` for components, `camelCase.ts` for utilities/hooks.
- **Components**: functional components only, with typed props via `interface Props { ... }`. No default exports for components except at the page/route level.
- **Hooks**: custom hooks must start with `use` and encapsulate one concern. Media/device hooks (`useWebcamStream`, `useAudioRecorder`) must clean up `MediaStream` tracks on unmount without exception — this is a review blocker if missing.
- **No inline styles**; use Tailwind utility classes or a shared style module.

## 4. Documentation Requirements
- Every module needs a top-of-file comment (1–3 lines) describing its purpose.
- Public API endpoints must have a docstring/summary that appears in the OpenAPI docs (`summary`, `description`, response examples).
- Scoring logic and AI-pipeline code require inline comments explaining the "why" behind thresholds/weights, not just the "what" — this data feeds candidate-facing feedback and must stay auditable.
- README updates are required whenever setup steps, env vars, or run commands change.

## 5. Testing Standards
- Minimum coverage target: **80%** on services and repositories; scoring logic requires **100%** branch coverage given it drives user-facing evaluations.
- Test names describe behavior: `test_overall_score_weights_communication_at_30_percent`, not `test_1`.
- Follow **Arrange–Act–Assert** structure in every test.
- No test should depend on execution order or shared mutable state.
- **Mock all external AI providers** (OpenAI, Whisper, DeepFace, MediaPipe, OAuth, email, push) — tests must never make real network calls to these services, both for cost and determinism.
- Fixture audio/video/resume samples used in tests are synthetic or explicitly licensed for test use — never real candidate data.

## 6. Error Handling
- Never swallow exceptions silently. Log with context (correlation ID, user id, session id) before re-raising or converting to an API error.
- AI provider failures (rate limits, timeouts, malformed responses) must degrade gracefully — surface a clear "processing delayed/failed" state to the candidate rather than a generic 500, and must be retried per `backend-rules.md`.
- User-facing error messages must be actionable and free of internal stack details.

## 7. Code Review Checklist (applies to every PR)
- [ ] Follows layering rules in `architecture.md`.
- [ ] Type-checked, linted, formatted — CI is green.
- [ ] Tests added/updated and passing, with external AI calls mocked.
- [ ] No secrets, credentials, or PII/biometric data committed.
- [ ] No unrelated changes bundled into the PR.
- [ ] Public functions/endpoints documented.
- [ ] Any change to scoring weights/thresholds is called out explicitly in the PR description.

## 8. Prohibited Patterns
- God objects/services that touch every table.
- Business or scoring logic inside serializers/schemas or ORM models.
- Global mutable state in the frontend outside of a designated store.
- Magic numbers/strings for scoring weights or rubric thresholds — extract to named constants (see `SCORING_WEIGHTS` in `architecture.md` §5).
- Silent `try/except: pass`, especially around AI provider calls.
