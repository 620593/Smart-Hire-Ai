# Frontend Rules — SmartHire AI (React.js)

## 1. Project Structure (feature-based)
```
src/
├── api/              # typed API client functions (Axios), one file per resource
├── components/        # shared, reusable, presentational components (Button, Modal, Table, Timer...)
├── features/
│   ├── auth/           # login, register, OAuth2 callback
│   ├── resume/          # upload, parsed-skill display, summary
│   ├── interview-room/   # webcam/mic capture, question flow, timer, recording upload
│   ├── dashboard/        # candidate performance tracking, history, trends
│   ├── assessment/       # score breakdown, rubric visualization, feedback display
│   ├── admin/            # user/recruiter management, AI configuration
│   └── recruiter/        # candidate analytics, comparison, interview templates
├── pages/              # route-level components, compose features
├── hooks/              # cross-cutting shared hooks
├── store/              # global state (Redux slices or Context providers)
├── lib/                # generic utilities (formatting, validation, media helpers)
└── App.tsx
```
Rule of thumb: if a component/hook is used by only one feature, it lives inside that feature folder. If used by 2+ features, promote it to `components/` or `hooks/`.

## 2. Component Organization
- One component per file; file name matches component name.
- Presentational components (`components/`) receive data via props only — no direct API calls or store access.
- Container components (`features/*/components` or `pages/`) handle data fetching/state and pass data down.
- Keep components under ~200 lines; extract subcomponents or hooks when they grow beyond that. The Interview Room screen especially should be decomposed into `QuestionPanel`, `RecordingControls`, `Timer`, `WebcamPreview`, etc. rather than one monolithic component.

## 3. State Management
- **Server state** (resumes, sessions, scores, feedback, dashboard analytics): fetched via Axios, cached/managed with a query layer (React Query or equivalent) — never duplicated into Redux.
- **Global client state**: Redux (or Context API for smaller slices) — used for cross-cutting UI state like auth status, active role, notification toasts.
- **Interview Room local state**: current question index, recording status (idle/recording/uploading/processing), elapsed timer — owned entirely within the `interview-room` feature, not leaked into global state, since it's short-lived and session-specific.
- Never store server data (transcripts, scores) in Redux/Context — it will drift from the source of truth; refetch or invalidate instead.

## 4. Data Fetching
- All HTTP calls go through `src/api/` using a shared Axios instance (base URL, auth header interceptor, standard error envelope parsing).
- Components never call `axios`/`fetch` directly — always via a hook wrapping an `api/` function.
- Endpoints that trigger async AI processing (session completion → scoring) return a "processing" status; the frontend polls or subscribes to a notification/websocket to know when results are ready — the UI must show an explicit "Analyzing your interview..." state, never a silent spinner with no feedback.

```tsx
function AssessmentView({ sessionId }: { sessionId: string }) {
  const { data, isLoading, error } = useAssessment(sessionId);

  if (isLoading) return <ProcessingState message="Analyzing your interview..." />;
  if (error) return <ErrorState message={error.message} />;
  return <ScoreBreakdown assessment={data} />;
}
```

## 5. Interview Room — Media Handling Rules
- Webcam/mic access requested via `navigator.mediaDevices.getUserMedia` inside a dedicated `useWebcamStream`/`useAudioRecorder` hook — never inline in a component.
- **Always** stop all `MediaStreamTrack`s on component unmount or session end — leaving camera/mic active after a session is a privacy bug and a review blocker.
- Show a clear, persistent recording indicator whenever audio/video capture is active.
- Upload audio/video in chunks (not one giant blob at the end) where feasible, to reduce data loss risk on connection issues.
- Handle and surface permission-denial (`NotAllowedError`) and no-device (`NotFoundError`) states explicitly with actionable guidance — never a blank/broken interview room.

## 6. Styling Conventions
- Tailwind CSS utility classes only; no inline `style={{}}` except for computed/dynamic values (e.g., a live audio-level meter bar width).
- Shared design tokens (colors, spacing, typography) come from `tailwind.config.ts`.
- Reusable UI primitives (Button, Input, Badge, Modal, ScoreGauge, Timer) live in `components/ui/`.
- Framer Motion is scoped to the `interview-room` and `assessment` features (question transitions, score reveal animation) — not used app-wide for routine UI to keep bundle size in check.

## 7. Routing
- `react-router` with route definitions centralized in `src/routes.tsx`.
- Route-level components live in `pages/`; each page composes feature components.
- Protected routes wrapped in `<RequireAuth>`; role-gated routes (recruiter/admin dashboards) wrapped in `<RequireRole roles={[...]}>`.
- The Interview Room route uses a route guard (`<RequireActiveSession>` or similar) that warns the user before navigating away mid-session (unsaved recording risk).

## 8. Forms & Validation
- `react-hook-form` + a schema validator (e.g. `zod`), mirroring backend validation rules (resume file type/size, interview template parameters).
- Validation schemas live alongside the feature (`features/resume/schemas.ts`).

## 9. Naming & File Conventions
- Components: `PascalCase.tsx` (`InterviewRoom.tsx`, `ScoreBreakdown.tsx`).
- Hooks: `useCamelCase.ts` (`useWebcamStream.ts`, `useInterviewTimer.ts`).
- Types/interfaces: `PascalCase`, suffixed meaningfully (`InterviewSessionDTO`, `AssessmentResult`).
- No default exports for shared components — use named exports.

## 10. Accessibility
- All interactive elements keyboard-navigable with accessible labels.
- Color is never the sole indicator of score/rating (Excellent/Good/Average/Needs Improvement/Poor) — pair with icon/text label.
- Recording state must be announced to assistive tech (e.g. `aria-live` region) since it's a privacy-relevant state change.
- Run automated a11y checks (`axe-core`) in CI for critical pages, including the Interview Room and Dashboard.

## 11. Testing
- Unit/behavior tests with Jest + React Testing Library; test user-visible behavior, not implementation details.
- Mock `getUserMedia`/`MediaRecorder` and all API calls (via MSW) in Interview Room tests — never require real camera/mic access in CI.
- Critical flows get integration-level tests: login/OAuth, resume upload, full mock-interview flow (start → answer questions → end → view results), recruiter candidate comparison.

## 12. Performance
- Code-split routes with `React.lazy` + `Suspense`, especially the Interview Room and Admin bundles.
- Virtualize long lists (candidate/session history tables) using a windowing library.
- Throttle/debounce any live-feedback UI (e.g., a live audio-level meter) to avoid excessive re-renders.
