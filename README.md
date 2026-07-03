# SmartHire AI

SmartHire AI is a production-focused monorepo for an AI-powered interview platform. This repository is initialized with the project structure, development conventions, and delivery workflow that will support backend, frontend, and infrastructure work in future phases.

## Tech Stack

- Backend: FastAPI, Python 3.12, uv, SQLAlchemy 2.0 Async, Alembic, PostgreSQL
- Frontend: React, Vite, TypeScript, Tailwind CSS, Shadcn UI
- DevOps: Docker, Docker Compose, GitHub Actions

## Folder Structure

```text
smarthire-ai/
├── backend/
├── frontend/
├── docs/
├── docker/
├── .github/
├── .gitignore
├── README.md
├── LICENSE
├── docker-compose.yml
└── .editorconfig
```

### Backend

```text
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   ├── utils/
│   └── main.py
├── tests/
├── alembic/
├── pyproject.toml
├── uv.lock
└── .env.example
```

### Frontend

```text
frontend/
├── src/
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

## Getting Started

This repository has been initialized for future implementation work.

1. Install backend dependencies with `uv`.
2. Install frontend dependencies with `npm` or `pnpm`.
3. Copy the example environment files before configuring local services.
4. Bring up the stack with Docker Compose once application services are added.

## Contribution Workflow

1. Create a focused feature branch from `main`.
2. Keep changes scoped to a single concern.
3. Open a pull request using the repository template.
4. Request review after local validation is complete.

## Branch Strategy

- `main`: stable, releasable work only
- `develop`: integration branch for ongoing work if the team adopts one
- `feature/*`: new features and enhancements
- `fix/*`: bug fixes and small corrective changes
- `chore/*`: maintenance, tooling, and non-product updates

## Notes

- This repository is scaffold-only for now.
- Business logic, authentication, APIs, database models, and UI pages will be added later.
