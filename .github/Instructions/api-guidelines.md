# API Guidelines — SmartHire AI

## 1. Base URL & Versioning
- All endpoints are prefixed `/api/v1/`.
- Breaking changes require a new version (`/api/v2/`); additive changes (new optional fields, new endpoints) don't require a bump.

## 2. Resource Naming
- Plural nouns for collections: `/users`, `/resumes`, `/interview-templates`, `/interview-sessions`, `/assessments`.
- Nested resources reflect real ownership: `/interview-sessions/{session_id}/questions`, `/interview-sessions/{session_id}/assessment`.
- Kebab-case in URL paths, `snake_case` in JSON bodies.
- Actions that aren't pure CRUD use a verb sub-resource: `POST /interview-sessions/{id}/start`, `POST /interview-sessions/{id}/complete`, `POST /resumes/{id}/parse`.

## 3. HTTP Methods & Status Codes
| Method | Use | Success Code |
|---|---|---|
| GET | Read one/many | 200 |
| POST | Create | 201 |
| POST (async trigger) | Kick off AI processing (parse, transcribe, score) | 202 Accepted |
| PATCH | Partial update | 200 |
| DELETE | Remove (soft-delete preferred) | 204 |

- `404` — resource not found (or not visible/owned by current user).
- `400` — malformed request.
- `422` — validation error.
- `401` — missing/invalid auth.
- `403` — authenticated but not authorized (e.g., candidate trying to access another candidate's session, or wrong role).
- `409` — conflict (e.g., attempting to complete an already-completed session).
- `413` — payload too large (oversized resume/media upload).
- `422` / `424` — upstream AI provider failure surfaced as a domain error (e.g. `TRANSCRIPTION_FAILED`), not a raw 500.
- `429` — rate limited.
- `500` — unhandled server error (rare; always logged with correlation ID).

## 4. Request/Response Format
- All bodies are JSON, `Content-Type: application/json` (media uploads use `multipart/form-data` or pre-signed-URL flows — see §6).
- Every response wraps the payload consistently:
```json
{
  "data": { ... },
  "meta": { "request_id": "..." }
}
```
- List endpoints:
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "page_size": 20, "total_items": 143, "total_pages": 8 }
}
```
- Async-processing resources (a session mid-scoring, a resume mid-parsing) include an explicit `status` field: `"pending" | "processing" | "completed" | "failed"`, so the client always knows whether to poll/wait.

## 5. Standard Error Envelope
```json
{
  "error": {
    "code": "TRANSCRIPTION_FAILED",
    "message": "We couldn't process the audio for this interview. Please try again.",
    "details": [],
    "request_id": "8f1e2c..."
  }
}
```
- `code` is a stable, machine-readable string (`UPPER_SNAKE_CASE`) — e.g. `RESUME_PARSING_FAILED`, `SESSION_ALREADY_COMPLETED`, `INVALID_MEDIA_FORMAT`, `TRANSCRIPTION_FAILED`, `SCORING_FAILED`.
- `message` is safe and specific enough to show a candidate without technical jargon.
- Every error response includes `request_id` for support/debugging correlation.

## 6. Media Uploads (Resumes, Audio/Video)
- Resume PDFs: `multipart/form-data` upload with server-side MIME-type and max-size validation (see `security.md`).
- Interview audio/video: prefer pre-signed upload URLs to object storage (S3/Cloudinary) issued by the backend, with the client uploading directly and then notifying the API of completion — avoids proxying large binary payloads through the application server.
- Uploaded media is referenced by URL/key in the DB, never stored as a blob in PostgreSQL.

## 7. Pagination
- Offset-based pagination on all list endpoints; default `page_size=20`, max `page_size=100`.
- Query params: `?page=1&page_size=20`.
- Never return an unbounded list (e.g., a recruiter's full candidate history) without pagination.

## 8. Filtering & Sorting
- Filtering via explicit query params: `?status=completed&interview_type=technical&domain=backend`.
- Sorting via `?sort=created_at&order=desc`; document allowed sort fields per endpoint (e.g. sessions sortable by `created_at` or `overall_score`).

## 9. Validation Rules
- All input validated at the schema layer.
- `422` responses populate `details` per invalid field.
- Explicit bounds on domain-meaningful fields: `overall_score: float = Field(ge=0, le=100)`, resume file size capped (e.g. 5MB), session duration capped per interview type.

## 10. Authentication & Headers
- `Authorization: Bearer <access_token>` on every authenticated request.
- Role/user context is derived server-side from the token — never trusted from a client-supplied header or body field (e.g. a candidate cannot pass `role: "admin"` in a request body to escalate privilege).

## 11. Idempotency
- `POST /interview-sessions/{id}/complete` and other side-effecting AI-triggering endpoints accept an optional `Idempotency-Key` header to prevent duplicate scoring runs on client retry.

## 12. Documentation
- Every endpoint has an OpenAPI `summary`, `description`, and example response, auto-generated from FastAPI + Pydantic (or DRF's schema generation for any DRF-based service) — kept in sync by construction.
- Endpoints returning `202 Accepted` document what to poll and the possible terminal `status` values.
