# Security — SmartHire AI

## 1. Authentication
- **JWT-based auth** with short-lived access tokens (15 minutes) and longer-lived refresh tokens (7 days), plus **OAuth2 login** (Google, GitHub) as an alternative sign-in path.
- Access tokens signed with `RS256`; refresh tokens stored **httpOnly, `Secure`, `SameSite=Strict`** cookies — never in `localStorage`/`sessionStorage`.
- Access tokens held in memory on the frontend only.
- Refresh token rotation: each refresh issues a new refresh token and invalidates the old one; reuse of a stale refresh token revokes the whole session.
- OAuth2 flows validate the `state` parameter to prevent CSRF, and only accept configured redirect URIs.

## 2. Authorization
- Role-based access control (RBAC): `candidate`, `recruiter`, `admin`.
- Authorization checks happen in the **service layer**, not just the router — a service must not trust that the router already checked role/ownership.
- **Resource ownership** is enforced everywhere: a candidate can only access their own resumes, sessions, and assessments; a recruiter can only access candidates/sessions within their configured visibility scope; verified server-side from the authenticated user's identity, never from a client-supplied ID alone.
- Admin-only actions (AI configuration, platform settings, user management) require the `admin` role explicitly on every route — no implicit admin access via feature flags left in a debug state.

## 3. Password Handling
- Passwords hashed with **bcrypt** (or `argon2id`), never stored or logged in plaintext.
- Minimum password policy: 12+ characters, checked against a breach list (e.g. HaveIBeenPwned range API) at signup rather than arbitrary complexity rules.
- Password reset uses single-use, time-limited tokens (15 minutes), invalidated after use or on new reset request.
- Accounts created via OAuth2 have no local password by default; a "set password" flow is required before local login is enabled for that account.

## 4. JWT Policies
- Tokens include minimal claims: `sub` (user id), `role`, `exp`, `iat`, `jti`.
- No PII embedded in the JWT payload.
- `jti` tracked server-side (Redis) to support revocation (logout-all, compromised-session invalidation).
- Small clock-skew tolerance (≤30s).

## 5. Environment Variable Management
- All secrets — DB credentials, JWT signing keys, **OpenAI API key, Whisper API key**, S3/Cloudinary credentials, OAuth client secrets (Google/GitHub), SendGrid/SES credentials, FCM server key — come from environment variables loaded via a typed settings object.
- `.env` files are never committed; `.env.example` documents required variables with placeholders only.
- Distinct secrets per environment; production secrets managed via a secrets manager, injected at deploy time.
- AI provider keys are scoped/rotated on a schedule and immediately on suspected compromise — a leaked OpenAI/Whisper key is both a security and a cost incident.

## 6. Input Validation & Injection Prevention
- All input validated via schemas at the API boundary.
- Parameterized ORM queries only — no string-built SQL, no exceptions.
- **Resume uploads**: validated for MIME type (PDF only) and size limit (e.g. 5MB) before processing; the file is never executed/rendered server-side beyond text extraction, and extraction runs in a manner that isolates against malicious/malformed PDFs (e.g. a sandboxed/limited-privilege parsing step).
- **Audio/video uploads**: validated for format, size, and duration caps before being queued for AI processing.
- User-supplied content (transcripts, resume text, AI-generated feedback) rendered in the frontend is escaped by default; `dangerouslySetInnerHTML` prohibited unless sanitized through a vetted library with documented justification.

## 7. Transport & Storage Security
- HTTPS/TLS enforced everywhere; `HSTS` enabled.
- Database connections use TLS; encryption at rest enabled for PostgreSQL and for the object storage bucket holding resumes and session recordings.
- CORS restricted to known frontend origins per environment — no wildcard `*` in production.
- Pre-signed upload/download URLs to object storage are short-lived and scoped to the specific object.

## 8. Biometric & Media Data Handling (project-specific priority)
This platform processes **webcam video and microphone audio** and derives **emotion and eye-contact/attention data** — this is sensitive biometric data in many jurisdictions (e.g. BIPA-style regimes) and requires extra care beyond standard PII:
- Obtain explicit, informed consent before starting any interview session that records audio/video or runs emotion/eye-contact analysis; consent copy must plainly state what's captured and how it's used (scoring, not just "processing").
- Recordings and derived biometric signals are accessible only to the candidate themselves and to recruiters/admins with a legitimate, role-checked need — never broadly queryable.
- Define and enforce a retention limit for raw audio/video (see `database-guidelines.md` §11); default to deleting raw media after a bounded period, retaining only transcript + scores + feedback needed for the candidate's ongoing dashboard/history.
- Support a candidate-initiated erasure request that removes DB rows **and** the corresponding object-storage media, audited via the security event log (§10).
- Emotion detection and eye-contact scoring outputs are used only for the stated interview-assessment purpose — not repurposed for unrelated profiling.

## 9. Common Vulnerabilities to Avoid
- **Broken object-level authorization (BOLA/IDOR)**: verify session/resume/assessment ownership in the service layer on every access; tested explicitly (attempt cross-user access in tests, expect 404).
- **Mass assignment**: `Create`/`Update` schemas explicitly whitelist editable fields; a candidate cannot set their own `role` or `overall_score` via a request body.
- **SSRF**: any outbound fetch triggered by user input must go through an allowlist/validation layer.
- **Prompt injection via resume/transcript content**: text extracted from a resume or spoken during an interview is untrusted input passed to the OpenAI question-generation and scoring prompts — structure prompts so this content cannot override system instructions, alter scoring behavior, or exfiltrate other candidates' data (see §10 in `architecture.md`/AI pipeline notes and `backend-rules.md` §6).
- **Rate limiting**: auth endpoints (login, OAuth callback, password reset, token refresh) and AI-triggering endpoints (session start, resume upload) are rate-limited per IP and per account.
- **Dependency vulnerabilities**: automated scanning (`pip-audit`, `npm audit`/Dependabot) in CI; critical vulnerabilities block merge.

## 10. Audit & Monitoring
- Security-relevant events (login, failed login, OAuth login, password reset, role change, resume/session/media access by a recruiter or admin, data export/erasure) written to an append-only audit log with actor, timestamp, and target resource.
- Sentry (or equivalent) used for error monitoring; error payloads scrubbed of PII/transcript content before being sent to the monitoring provider.
- Anomaly alerting (spike in failed logins, unusual cross-account access attempts, abnormal AI provider spend) feeds into on-call monitoring.
- Quarterly review of admin-role access and third-party AI/OAuth provider scopes.
