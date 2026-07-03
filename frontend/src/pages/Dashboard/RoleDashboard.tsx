/**
 * RoleDashboard — selects the correct dashboard page based on the user's role.
 * Candidates → DashboardPage (existing)
 * Recruiters → RecruiterDashboardPage
 * Admins → AdminDashboardPage
 */
import { useAuth } from "@/hooks/useAuth";
import { DashboardPage } from "./DashboardPage";
import { RecruiterDashboardPage } from "./RecruiterDashboardPage";
import { AdminDashboardPage } from "./AdminDashboardPage";

export function RoleDashboard() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];

  if (roles.includes("admin")) return <AdminDashboardPage />;
  if (roles.includes("recruiter")) return <RecruiterDashboardPage />;
  return <DashboardPage />;
}
