import { createBrowserRouter, useRouteError, Link } from "react-router-dom";

import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicRoute } from "@/routes/PublicRoute";

// Pages
import { LandingPage } from "@/pages/Landing/LandingPage";
import { LoginPage } from "@/pages/Login/LoginPage";
import { RegisterPage } from "@/pages/Register/RegisterPage";
import { GetStartedPage } from "@/pages/GetStarted/GetStartedPage";
import { RecruiterRegisterPage } from "@/pages/RecruiterRegister/RecruiterRegisterPage";
import { RoleDashboard } from "@/pages/Dashboard/RoleDashboard";
import { InterviewPage } from "@/pages/Interview/InterviewPage";
import { ReportPage } from "@/pages/Report/ReportPage";
import { ResumePage } from "@/pages/Resume/ResumePage";
import { UnauthorizedPage } from "@/pages/Error/UnauthorizedPage";
import { ForbiddenPage } from "@/pages/Error/ForbiddenPage";
import { NotFoundPage } from "@/pages/NotFound/NotFoundPage";

function RouteErrorBoundary() {
  const error: any = useRouteError();
  console.error("Route error caught by boundary:", error);

  return (
    <div className="min-h-screen bg-[#070c18] text-[#dae2fd] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 shadow-lg shadow-red-500/10">
        <span className="material-symbols-outlined text-red-400 text-3xl">warning</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Unexpected UI Exception</h1>
      <p className="text-xs text-slate-400 font-mono bg-slate-900/60 p-3 rounded-xl border border-white/10 max-w-md mb-6 break-words">
        {error?.message || error?.statusText || "An unexpected error occurred while loading this section."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Reload Page
        </button>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-[#5b5cf6] hover:bg-[#4f50e2] text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  // ── Landing (has its own MainLayout navbar) ──
  {
    element: <MainLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <LandingPage /> },
    ],
  },

  // ── Public auth pages ──
  {
    path: "/login",
    errorElement: <RouteErrorBoundary />,
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    errorElement: <RouteErrorBoundary />,
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: "/get-started",
    errorElement: <RouteErrorBoundary />,
    element: (
      <PublicRoute>
        <GetStartedPage />
      </PublicRoute>
    ),
  },
  {
    path: "/recruiter-register",
    errorElement: <RouteErrorBoundary />,
    element: (
      <PublicRoute>
        <RecruiterRegisterPage />
      </PublicRoute>
    ),
  },

  // ── Protected dashboard routes ──
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/dashboard", element: <RoleDashboard /> },
      { path: "/interviews", element: <InterviewPage /> },
      { path: "/reports", element: <ReportPage /> },
      { path: "/resume", element: <ResumePage /> },
    ],
  },

  // ── Error pages ──
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "/forbidden", element: <ForbiddenPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
