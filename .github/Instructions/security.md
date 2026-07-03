# Security — SmartHire AI

> **See `auth-architecture.md` for the authoritative, binding spec on auth implementation details (algorithm, hashing library, package layout, task sequencing).** This section summarizes and must stay consistent with it.

## 1. Authentication

- **JWT-based auth** using **PyJWT**, algorithm **HS256** (symmetric, single `SECRET_KEY`) — not RS256. Short-lived access tokens and longer-lived refresh tokens, lifetimes controlled via `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS`.
- Every token carries an explicit `type` claim (`"access"` or `"refresh"`); consumers validate the type matches what they expect and raise `TokenTypeMismatch` otherwise — token types must never be mixed.
- Refresh tokens are stored **httpOnly, `Secure`, `SameSite=Strict`** cookies — never in `localStorage`/`sessionStorage`. Access tokens are held in memory on the frontend only.
- Refresh token rotation: each refresh issues a new refresh token and invalidates the old one; reuse of a stale refresh token revokes the whole session.
- **OAuth2 login (Google/GitHub)** is a documented future-compatibility requirement (see `auth-architecture.md` §Future Compatibility) but is **not** part of the initial authentication build — it is deferred to a later task once the core JWT/password foundation and the `/auth/*` endpoints exist. When implemented, OAuth2 flows must validate the `state` parameter to prevent CSRF and only accept configured redirect URIs.

## 2. Authorization

- Role-based access control (RBAC): `candidate`, `recruiter`, `admin`.
- Role validation happens through **reusable dependencies** (`get_current_user`, `get_current_active_user`, `get_current_admin` — see `auth-architecture.md`) — role checks are never hardcoded inline inside an endpoint body.
- Authorization checks happen in the **service layer** too, not just at the dependency/router boundary — a service must not trust that the router already checked role/ownership.
- **Resource ownership** is enforced everywhere: a candidate can only access their own resumes, sessions, and assessments; a recruiter can only access candidates/sessions within their configured visibility scope; verified server-side from the authenticated user's identity, never from a client-supplied ID alone.
- Admin-only actions (AI configuration, platform settings, user management) require the `admin` role explicitly via the `get_current_admin` dependency on every route — no implicit admin access via feature flags left in a debug state.

## 3. Password Handling

- Passwords hashed with **`pwdlib`, algorithm Argon2, exclusively** — never `passlib`, `bcrypt`, `sha256`, or `md5` (see `auth-architecture.md`). Hashing happens only through the `PasswordManager` class in `core/security/password.py`; no other module calls `pwdlib` directly.
- Argon2 cost parameters (`PASSWORD_HASH_MEMORY_COST`, `PASSWORD_HASH_TIME_COST`, `PASSWORD_HASH_PARALLELISM`, `PASSWORD_HASH_HASH_LEN`, `PASSWORD_HASH_SALT_LEN`) are environment-configured, not hardcoded.
- Minimum password length is **8**, recommended **12+**; a breach-list check (e.g. HaveIBeenPwned range API) at signup is a documented future enhancement, not a current hard requirement.
- Passwords are never stored or logged in plaintext, never logged at all, never exposed in any response (no `hashed_password` field on any Pydantic response schema, no password field on any response schema — see `auth-architecture.md` §Password Policy).
- Password reset (single-use, time-limited tokens) is explicitly **out of scope** for the initial auth build — see `auth-architecture.md` §Task Sequencing — and is tracked under Future Compatibility.
- Accounts created via OAuth2 (once implemented) will have no local password by default; a "set password" flow will be required before local login is enabled for that account.

## 4. JWT Policies

- Algorithm: **HS256**, PyJWT, single `SECRET_KEY` loaded from environment config — see `auth-architecture.md` for the full spec.
- **Access token claims**: `sub`, `email`, `role`, `type` (`"access"`), `exp`, `iat`.
- **Refresh token claims**: `sub`, `type` (`"refresh"`), `exp`, `iat`.
- JWT utilities (`core/security/jwt.py`, `tokens.py`) only encode/decode/verify/validate-expiration — no business logic lives there.
- Reusable exceptions for auth failures: `Unauthorized`, `Forbidden`, `InvalidCredentials`, `InvalidToken`, `ExpiredToken`, `TokenTypeMismatch` — all return a consistent JSON error shape per `api-guidelines.md`.
- `jti` is present on tokens from the start so a Redis-backed revocation blacklist (logout-all, compromised-session invalidation) can be added later without reissuing the token format — this is a documented Future Compatibility item, not yet implemented.
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

## 11. Security Package Structure

Authentication and security-related code must follow the structure below.

```
app/
└── core/
    └── security/
        ├── __init__.py
        ├── password.py
        ├── jwt.py
        ├── tokens.py
        ├── dependencies.py
        ├── exceptions.py
        └── permissions.py
```

Responsibilities:

- `password.py`
  - Password hashing
  - Password verification
  - Password rehash detection

- `jwt.py`
  - JWT encoding
  - JWT decoding
  - JWT validation

- `tokens.py`
  - Access token helpers
  - Refresh token helpers
  - Expiration helpers

- `dependencies.py`
  - Authentication dependencies
  - Authorization dependencies

- `exceptions.py`
  - Security-specific exception classes

- `permissions.py`
  - Permission helper utilities
  - RBAC helpers

Business logic must never exist inside this package.

---

## 12. Token Lifetime Policy

Access Token

- Lifetime: 15 minutes

Refresh Token

- Lifetime: 7 days

Clock Skew

- Maximum: 30 seconds

Refresh Token Rotation

- Enabled

Reuse Detection

- Required

Sliding Sessions

- Planned

Remember Me

- Future enhancement

---

## 13. Password Validation Policy

Minimum Length

- 8 characters

Recommended Length

- 12+ characters

Maximum Length

- 128 characters

Validation Rules

- Reject empty passwords
- Reject whitespace-only passwords
- Preserve case
- Do not normalize characters
- Trim leading/trailing whitespace before validation
- Reject passwords exceeding maximum length

Future Enhancements

- HaveIBeenPwned API integration
- Password entropy calculation
- Organization password policies

---

## 14. Repository Security Rules

Never commit:

- .env
- API Keys
- JWT Secrets
- OAuth Secrets
- Service Account Keys
- Database Passwords

Never expose:

- hashed_password
- SECRET_KEY
- Refresh Tokens
- Authorization Headers
- API Keys

Never log:

- Passwords
- JWT Tokens
- Refresh Tokens
- Authorization Headers
- Cookies

Always use:

- Environment variables
- Typed settings
- Secret managers in production

---

## 15. Dependency Injection Flow

Every authenticated request follows this flow.

```
Request

↓

Authentication Dependency

↓

Current User Dependency

↓

Current Active User

↓

Role Dependency

↓

Service Layer

↓

Repository

↓

Database
```

Authorization must never be skipped.

Every service should independently verify resource ownership.

---

## 16. Secure File Upload Policy

Allowed Types

- PDF resumes only

Maximum Size

- 5 MB

Validation

- MIME Type
- File Signature (Magic Bytes)
- File Extension

Reject

- Executables
- Archives
- Scripts
- Password Protected PDFs
- Corrupted PDFs

Storage

- Generate random filenames
- Never trust original filenames
- Store metadata separately
- Scan before processing (future enhancement)

---

## 17. AI Security Guidelines

All prompts sent to LLMs must treat user content as untrusted input.

Prompt templates must separate:

- System Prompt
- Developer Prompt
- User Prompt

Never concatenate user input directly into system instructions.

Prompt Injection Protection

- Delimit user input clearly
- Never allow user content to override system instructions
- Never expose secrets inside prompts
- Never expose internal prompts

AI Responses

- Validate before storing
- Escape before rendering
- Never execute generated code automatically

---

## 18. Session Security

Sessions are represented through JWT.

Future session management should support:

- Multiple devices
- Session revocation
- Device identification
- Login history
- Logout from all devices

Refresh tokens must support revocation.

---

## 19. API Security

Every endpoint must:

- Validate input
- Authenticate where required
- Authorize access
- Validate ownership
- Return consistent errors

Public Endpoints

- Health
- Documentation (development only)

Protected Endpoints

- Resume Upload
- Interview
- Dashboard
- Analytics
- Profile

Admin Endpoints

- User Management
- AI Configuration
- Platform Settings

---

## 20. CORS Policy

Development

Allow only:

- http://localhost:5173

Production

Allow only configured frontend domains.

Never use:

```
Access-Control-Allow-Origin: *
```

for authenticated endpoints.

Credentials must be allowed only for trusted origins.

---

## 21. Logging Policy

Never log

- Passwords
- JWT Tokens
- Refresh Tokens
- Cookies
- API Keys

Log

- Request ID
- User ID
- Endpoint
- Response Time
- HTTP Status
- Client IP
- User Agent

Logs must support future correlation IDs.

---

## 22. Security Headers

Future deployment must include:

- HSTS
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- Content-Security-Policy

Server header should be hidden.

---

## 23. Future Security Enhancements

Planned Features

- OAuth2 (Google)
- OAuth2 (GitHub)
- Email Verification
- Password Reset
- Multi-Factor Authentication
- Magic Links
- Device Trust
- Redis Token Blacklist
- Session Dashboard
- Risk-Based Authentication
- IP Reputation
- Geo-location Detection
- Suspicious Login Detection

---

## 24. Security Checklist

Before every release verify:

Authentication

- Password hashing
- JWT validation
- Refresh token rotation
- Authorization

Database

- No SQL Injection
- Parameterized queries
- Ownership checks

Frontend

- No XSS
- No token leaks
- No secrets exposed

Infrastructure

- HTTPS enabled
- TLS enabled
- Secrets configured
- Environment variables validated

AI

- Prompt Injection Protection
- Resume Sanitization
- Transcript Sanitization

Testing

- Unit Tests
- Integration Tests
- Security Tests
- Dependency Scan

Monitoring

- Audit Logs
- Error Monitoring
- Security Alerts

Deployment

- Production Secrets
- Rate Limiting
- CORS
- Security Headers
