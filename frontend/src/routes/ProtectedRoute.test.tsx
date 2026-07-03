import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("ProtectedRoute", () => {
  it("shows loading indicator during session initialization", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isRefreshing: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText("Protected Content")).toBeNull();
  });

  it("redirects unauthenticated users to login", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      isRefreshing: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Page")).toBeDefined();
    expect(screen.queryByText("Protected Content")).toBeNull();
  });

  it("renders children if user is authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "1", username: "candidate", email: "candidate@example.com", roles: ["candidate"] } as any,
      isAuthenticated: true,
      isInitialized: true,
      isRefreshing: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Content")).toBeDefined();
  });

  it("redirects to forbidden page if user lacks required role", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "1", username: "candidate", email: "candidate@example.com", roles: ["candidate"] } as any,
      isAuthenticated: true,
      isInitialized: true,
      isRefreshing: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <div>Admin Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/forbidden" element={<div>Forbidden Access</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Forbidden Access")).toBeDefined();
    expect(screen.queryByText("Admin Dashboard")).toBeNull();
  });
});
