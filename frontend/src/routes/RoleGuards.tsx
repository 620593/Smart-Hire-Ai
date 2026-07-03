import type { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";

export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>;
}

export function RecruiterRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={["recruiter"]}>{children}</ProtectedRoute>;
}

export function CandidateRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={["candidate"]}>{children}</ProtectedRoute>;
}
