# Git Workflow — SmartHire AI

## 1. Branching Strategy (Trunk-Based with Short-Lived Feature Branches)
- `main` — always deployable; protected branch, no direct pushes.
- `develop` — integration branch for the current milestone/week.
- Feature branches: `feature/<ticket-id>-short-description` (e.g., `feature/SH-118-whisper-transcription-worker`).
- Bugfix branches: `fix/<ticket-id>-short-description`.
- Hotfix branches (production): `hotfix/<ticket-id>-short-description`, branched from `main`, merged back to both `main` and `develop`.
- Chore/infra branches: `chore/<short-description>` (CI config, dependency bumps, docs).

Branches should live no longer than a few days, ideally scoped to fit within the current week's milestone tasks (see `milestone-1.md` and subsequent milestone docs). Rebase on `main`/`develop` regularly to avoid painful merges.

## 2. Commit Message Convention (Conventional Commits)
```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```
**Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`, `ci`.
**Scope**: the affected module/feature (`auth`, `resume`, `interview-session`, `question-gen`, `transcription`, `scoring`, `dashboard`).

Examples:
```
feat(question-gen): generate technical questions from parsed resume skills

fix(transcription): retry Whisper call on transient timeout

refactor(scoring): extract rubric weights into scoring_constants module

docs(security): document biometric data retention policy
```
- Subject line ≤ 72 chars, imperative mood ("add", not "added"/"adds").
- Reference the ticket ID in the footer when applicable: `Refs: SH-118`.
- Breaking changes flagged with `BREAKING CHANGE:` in the footer.

## 3. Pull Request Workflow
1. Branch off `main` (or `develop`), implement the change, commit in logical, reviewable chunks.
2. Keep PRs small and focused — one feature/fix per PR. Target < 400 lines changed where possible; split larger AI-pipeline work (e.g., "scoring service") into stacked PRs (constants → signal extraction → weighting → API integration).
3. Before opening the PR: rebase on latest target branch, run linter/formatter/tests locally.
4. Open PR with: clear title following commit convention, description of what/why/how-to-test, screenshots or a short clip for UI changes (especially Interview Room UX), linked ticket/issue.
5. CI must pass (lint, type-check, tests, build) before review is requested.
6. Address review comments via new commits (don't force-push during active review); squash before merge.

## 4. Code Review Process
- Minimum **1 approval** required before merge; **2 approvals** for changes touching `security.md`-covered areas (auth, JWT, OAuth, RBAC, biometric/media data handling), scoring-weight/rubric logic, or database migrations.
- Reviewers check against `coding-standards.md` and the relevant `backend-rules.md`/`frontend-rules.md` checklist.
- Any PR touching `SCORING_WEIGHTS`/rubric thresholds must be explicitly flagged in the description and reviewed by someone familiar with the scoring model in `architecture.md` §5.
- Review turnaround target: within 1 business day.
- Author resolves all conversations before merging; reviewer re-approves after significant changes.

## 5. Merge Strategy
- **Squash and merge** into `main`/`develop` — linear history, one commit per PR.
- Merge commit message = the PR title (conventional commit format), with a brief bullet summary if the PR contained multiple logical changes.
- Delete the branch after merge.

## 6. Release Strategy
- The project runs on an **8-week, 4-milestone plan** (see `project-context.md` §8): each milestone corresponds to a tagged release once its acceptance criteria are met.
  - `v0.1.0` — Milestone 1 (Week 2): Foundation — auth, DB schema, core setup.
  - `v0.2.0` — Milestone 2 (Week 4): Resume Parsing & Interview Engine.
  - `v0.3.0` — Milestone 3 (Week 6): Speech Analysis & AI Monitoring.
  - `v1.0.0` — Milestone 4 (Week 8): Analytics, Testing & Deployment (production-ready).
- Semantic versioning within/after that: `MAJOR` — breaking API changes; `MINOR` — new features, backward-compatible; `PATCH` — bug fixes.
- Each release has a `CHANGELOG.md` entry generated from conventional commit history.
- Hotfixes bump `PATCH` and are merged into any active release branch as needed.

## 7. Handling Migrations in Git
- Migration files (Alembic or Django) are committed alongside the model change in the **same PR** — never as a follow-up.
- Migration PRs require review from someone familiar with `database-guidelines.md`.
- Never edit a migration that has already been merged to `main`; create a new migration to amend it.

## 8. Prohibited Practices
- No direct commits to `main`.
- No force-pushing to shared branches (`main`, `develop`).
- No committing secrets, `.env` files, API keys (OpenAI/Whisper/S3/OAuth), or sample candidate media/PII (enforced via pre-commit hook + `.gitignore`).
- No merging with failing CI, even with an approval.
