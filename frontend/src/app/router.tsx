import { createBrowserRouter } from "react-router-dom";

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

export const router = createBrowserRouter([
  // ── Landing (has its own MainLayout navbar) ──
  {
    element: <MainLayout />,
    children: [
      { index: true, element: <LandingPage /> },
    ],
  },

  // ── Public auth pages — all full-screen split-panel layouts ──
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: "/get-started",
    element: (
      <PublicRoute>
        <GetStartedPage />
      </PublicRoute>
    ),
  },
  {
    path: "/recruiter-register",
    element: (
      <PublicRoute>
        <RecruiterRegisterPage />
      </PublicRoute>
    ),
  },

  // ── Protected dashboard routes (DashboardLayout has sidebar) ──
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
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
