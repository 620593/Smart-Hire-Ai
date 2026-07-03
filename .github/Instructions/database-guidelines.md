# Database Guidelines — SmartHire AI

## 1. Engine & ORM
- PostgreSQL 15+ in production; SQLite permitted for local development only (never for staging/prod, given JSON/array/full-text feature differences).
- Django ORM or SQLAlchemy 2.x depending on which service owns the table (see `backend-rules.md` §0) — schema changes are always managed through migrations (Alembic for FastAPI-owned tables, Django migrations for DRF-owned tables), never manual DDL against any shared environment.
- Redis is used for caching and as the Celery broker — not for data that must survive a cache flush (sessions/results always live in PostgreSQL).

## 2. Core Domain Tables
| Table | Purpose |
|---|---|
| `users` | Candidates, recruiters, admins; role, auth identity (local + OAuth) |
| `resumes` | Uploaded resume metadata + storage reference + AI-extracted structured data |
| `interview_templates` | Recruiter/admin-defined or system-default question-generation configs (type, domain, difficulty) |
| `interview_sessions` | A single mock interview attempt: candidate, template, status, timestamps, recording references |
| `questions` | Questions generated for a session, with type/domain/difficulty metadata |
| `transcripts` | ASR output per session (raw transcript text, per-question segments if applicable) |
| `assessments` | Rubric scores (communication, confidence, technical_relevance, professionalism, overall) + rating label |
| `feedback` | AI-generated strengths/weaknesses/suggestions/resources tied to an assessment |
| `notifications` | Reminders, alerts, delivery status |

## 3. Model Conventions
- Every table includes:
  - `id: UUID` primary key, application-generated (`default=uuid4`), not DB `serial` — avoids enumeration and simplifies cross-service references.
  - `created_at`, `updated_at` timestamps (`server_default=now()`, `onupdate=now()`).
- Table names: plural, `snake_case`.
- Column names: `snake_case`, no cryptic abbreviations.
- Foreign key columns named `<referenced_table_singular>_id` (`candidate_id`, `session_id`, `resume_id`).

## 4. Scoring Data Model (critical — explainability requirement)
Per `architecture.md` §5, scores must be **auditable**, not just a final number:
- `assessments` stores each weighted sub-score (`communication_score`, `confidence_score`, `technical_relevance_score`, `professionalism_score`, `overall_score`) **and** a `rating` enum (`excellent | good | average | needs_improvement | poor`) derived from `overall_score`.
- A separate `assessment_signals` (or JSONB column on `assessments`, if simpler at this scale) stores the raw contributing signals per sub-score — e.g. filler-word count, speech pace (wpm), eye-contact percentage, keyword-match list — so a candidate's feedback can point to *why* they scored as they did, and so the rubric can be re-tuned later without re-running AI inference.
- Scoring weight constants (`0.30 / 0.25 / 0.30 / 0.15`) are **not** stored per-row by default (they're a code constant, see `backend-rules.md` §6); if the platform later supports configurable rubrics per organization/template, weights move to a `scoring_config` table referenced by `interview_templates`.

## 5. Relationships
- Declare relationships explicitly (`back_populates` in SQLAlchemy / `related_name` in Django) for clarity in both directions.
- `interview_sessions.candidate_id → users.id`, `interview_sessions.resume_id → resumes.id`, `interview_sessions.template_id → interview_templates.id`.
- `questions.session_id → interview_sessions.id`; `assessments.session_id → interview_sessions.id` (one-to-one); `feedback.assessment_id → assessments.id` (one-to-one or one-to-many if multiple feedback entries are supported).
- Default to explicit eager loading (`selectinload`/`select_related`+`prefetch_related`) for relationships known to be needed together (e.g. loading a session with its questions and assessment for the results page) — avoid implicit lazy loading, especially in async FastAPI paths where it errors outright.

## 6. Soft Deletes
- User-facing entities (`users`, `resumes`, `interview_sessions`) use soft deletion via `deleted_at: datetime | None`.
- Repositories filter `deleted_at IS NULL` by default; a separate explicit method is required for admin/audit views that need deleted rows.
- Hard deletes are reserved for compliance-driven erasure (candidate-requested data deletion, including associated media in object storage) — executed through a dedicated, audited service method covering DB rows **and** the corresponding S3/Cloudinary objects, never a generic delete endpoint.

## 7. Indexing
- Every foreign key column is indexed.
- `interview_sessions`: composite index on `(candidate_id, status)` and `(candidate_id, created_at)` to support dashboard/history queries efficiently.
- `assessments`: index on `overall_score` to support recruiter-side candidate ranking/comparison queries.
- Unique constraint on `(session_id)` in `assessments` (one assessment per session) and in `transcripts` (one transcript per session), enforced at the DB level.

## 8. Migrations
- One logical schema change per migration, clear message (`add_assessment_signals_to_assessments`).
- Every migration has a working `downgrade()`.
- Migrations reviewed alongside the model change in the same PR (see `git-workflow.md`).
- Never edit a migration already merged to `main`; write a new one.
- Backfills for large tables (e.g., re-scoring historical sessions after a rubric change) run as a separate script/task, not inline in the schema migration.

## 9. Query Performance
- No N+1 queries — verified in review, especially on the recruiter analytics/comparison endpoints which join across many sessions/assessments.
- `EXPLAIN ANALYZE` any query expected to run against a table exceeding 100k rows (e.g. `interview_sessions` at scale) before merging.
- Batch writes for bulk operations (e.g., storing per-frame eye-contact samples) — never loop individual inserts for high-frequency signal data; consider a columnar/JSONB aggregate per session instead of one row per sample if sampling is frequent.

## 10. Data Integrity
- Prefer DB-level constraints (`NOT NULL`, `CHECK` on score ranges 0–100, `UNIQUE`, FK `ON DELETE` behavior) over relying solely on application validation.
- `ON DELETE` behavior is explicit: deleting a `interview_template` should not cascade-delete historical `interview_sessions` that used it — use `RESTRICT` or nullify the reference and retain a denormalized snapshot of template parameters on the session instead.

## 11. Sensitive & Biometric Data
- Resume files, session audio, and session video are stored in object storage (S3/Cloudinary), never in the database — the DB stores references/keys plus extracted structured data.
- Emotion-detection and eye-contact-tracking outputs are **derived biometric data** and are treated with the same sensitivity as raw video (see `security.md`) — access-controlled, and covered by the same erasure workflow as the source media.
- Candidate PII (email, phone, resume contents, transcripts) is never logged in plaintext application logs.
- Define and document a retention policy for raw audio/video (e.g., auto-delete after N days, keeping only the transcript/scores) — raw media is the highest-risk, highest-storage-cost data in the system and should not be retained indefinitely by default.
