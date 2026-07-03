# Project Context — SmartHire AI

## 1. Vision
SmartHire AI is an **AI-powered mock interview and candidate assessment platform** that helps candidates prepare for technical, HR, behavioral, and aptitude interviews through automated interview simulations, speech analysis, confidence evaluation, and AI-generated feedback.

Candidates take AI-driven interview sessions with webcam and microphone support, receive personalized, rubric-based assessments, track performance trends over time, and get actionable recommendations to improve interview readiness.

## 2. Problem Statement
Interview preparation today is largely unstructured: candidates rehearse alone or with peers, with no objective, repeatable feedback on communication quality, confidence signals, or technical relevance. SmartHire AI closes this gap by:
- Generating realistic, role/domain-specific interview questions from a candidate's resume.
- Running simulated interview sessions with real-time speech and video capture.
- Scoring performance across communication, confidence, technical relevance, and professionalism using AI analysis of speech, transcript, and visual cues.
- Producing specific, actionable feedback and tracking improvement over multiple sessions.

## 3. Target Users
- **Candidates / Job Seekers / Students** — primary users; upload resumes, take mock interviews, review feedback and analytics.
- **Recruiters** — review candidate analytics and reports, compare candidates, create interview templates, monitor sessions (used by recruitment agencies, corporate hiring teams).
- **Training Institutes / Universities** — deploy the platform to help students/trainees practice and track progress at scale.
- **Admins** — manage users/recruiters, platform configuration, AI configuration, and platform-wide analytics.

## 4. Technology Stack
| Layer | Technology |
|---|---|
| Backend framework | Python — **FastAPI** (primary, used for AI/ML-heavy services and real-time endpoints); **Django REST Framework** is an accepted alternative/complement for admin-heavy CRUD if the team prefers it — see `backend-rules.md` for how the two are reconciled |
| Database | PostgreSQL (production), SQLite (local development only) |
| Cache / session store | Redis |
| Auth | JWT authentication + OAuth2 login (Google/GitHub) |
| Frontend | React.js + Tailwind CSS |
| Frontend state | Redux or Context API; Axios for HTTP; Framer Motion for interview-room UI animation |
| Media storage | AWS S3 / Cloudinary (resumes, audio/video recordings) |
| AI/ML — question generation & feedback | OpenAI API |
| AI/ML — speech-to-text | Whisper API |
| AI/ML — computer vision | OpenCV, MediaPipe (eye-contact / attention tracking) |
| AI/ML — emotion detection | DeepFace (CNN-based) |
| AI/ML — model runtime | TensorFlow / PyTorch |
| Notifications | Email (SendGrid/SES), push notifications (FCM) |
| Containerization | Docker & Docker Compose |
| CI/CD | GitHub Actions |
| Hosting | Frontend: Vercel/Netlify; Backend: Docker on AWS/GCP/Azure/Render |
| Testing | Pytest + Django Test Client (backend), Jest + React Testing Library (frontend) |
| Monitoring | Sentry |
| Dev tools | VS Code, Git & GitHub, Postman |

## 5. High-Level System Architecture
```
FRONTEND (React.js)
 ├── Candidate Interface: Interview Room, Dashboard & Analytics, Reports & Feedback
 └── Admin/Recruiter Interface: User Management, Interview Management, Analytics, Reports
        │  HTTPS / REST API
        ▼
BACKEND (FastAPI, optionally + Django REST Framework)
 ├── API Gateway & REST API
 ├── Authentication Service (JWT / OAuth2)
 ├── User & Role Management Service
 ├── Interview Session Service
 ├── Question Generation Service (AI)
 ├── Speech Processing Service (ASR)
 ├── Analysis & Scoring Service
 └── Notification Service
        │
        ├──► AI/ML SERVICES: Speech-to-Text (Whisper) · Emotion Detection (DeepFace/CNN) ·
        │     Eye-Contact Tracking (MediaPipe) · Confidence & Filler-Word Analysis
        │
        ├──► DATABASE & STORAGE: PostgreSQL · Media Storage (S3/Cloudinary) · Redis Cache
        │
        └──► EXTERNAL SERVICES: OAuth Providers (Google/GitHub) · Email Provider (SendGrid/SES) ·
              Push Notifications (FCM)

DEPLOYMENT & INFRASTRUCTURE
 Frontend Hosting (Vercel/Netlify) · Backend Hosting (Docker/AWS/GCP) · CI/CD (GitHub Actions)
```

## 6. Core Domain Concepts
- **User** — a person with a role: `candidate`, `recruiter`, or `admin`.
- **Resume** — an uploaded PDF, parsed into structured skills/experience/education, with an AI-generated summary.
- **InterviewTemplate** — recruiter-defined or system-generated configuration (domain, difficulty, interview type) used to generate a session's questions.
- **InterviewSession** — a single mock interview attempt: type (technical/HR/behavioral/aptitude), questions asked, recorded audio/video, transcript, timing.
- **Question** — an AI-generated interview question tied to a session, with domain/difficulty metadata.
- **Assessment / Score** — the rubric-based evaluation of a session (Communication, Confidence, Technical Relevance, Professionalism, Overall).
- **Feedback** — AI-generated strengths, weaknesses, improvement suggestions, practice recommendations, and learning resources tied to an assessment.

## 7. Scoring Model (see `architecture.md` §9 for full detail)
Overall Score = (Communication × 30%) + (Confidence × 25%) + (Technical Relevance × 30%) + (Professionalism × 15%)

Rating rubric: 90–100 Excellent · 75–89 Good · 60–74 Average · 40–59 Needs Improvement · Below 40 Poor.

## 8. Feature Roadmap (Week-Based Milestones)
### Milestone 1 — Week 1 & 2: Requirements, Database Design & Core Setup (see `milestone-1.md`)
Project scope, database schema, UI wireframes, frontend/backend environment setup, authentication & RBAC, PostgreSQL configuration, resume management workflows.

### Milestone 2 — Week 3 & 4: Resume Parsing & Interview Engine
Resume upload workflows, AI-based skill extraction, interview generation APIs, interview room interface, interview session management workflows.

### Milestone 3 — Week 5 & 6: Speech Analysis & AI Monitoring
Speech-to-text workflows, filler-word detection, emotion recognition integration, eye-contact tracking, scoring algorithms and evaluation workflows.

### Milestone 4 — Week 7 & 8: Analytics, Testing & Deployment
Analytics dashboard, performance visualizations, reports & notifications, testing and validation, production deployment.

## 9. Non-Functional Priorities
1. **Privacy of biometric/media data** — webcam/mic recordings and derived emotion/eye-contact data are highly sensitive; strict access control, encryption, and retention limits apply (see `security.md`).
2. **Explainability** — every AI score must be traceable to the sub-parameters that produced it, not a black-box number.
3. **Real-time responsiveness** — speech transcription, emotion detection, and eye-contact tracking must run with minimal perceptible lag during a live session.
4. **Reliability of AI pipelines** — resume parsing, question generation, transcription, and scoring run asynchronously and must handle provider failures gracefully (retries, fallback messaging), never blocking the interview session itself.
5. **Scalability** — the platform must support multiple concurrent interview sessions without degrading transcription/scoring accuracy or dashboard responsiveness.

## 10. How to Use This Knowledge Base
All contributors (human or AI) should read `architecture.md`, `coding-standards.md`, and the relevant `backend-rules.md` / `frontend-rules.md` before implementing a feature. `security.md` and `database-guidelines.md` are mandatory reading before touching auth, models, migrations, or any media/biometric data handling. `milestone-1.md` (and future milestone docs) provide task-level detail for the current phase.
