import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuthContext } from "./AuthContext";
import { AuthService } from "@/services/auth";

vi.mock("@/services/auth", () => ({
  AuthService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
  },
}));

vi.mock("@/lib/axios", () => ({
  apiClient: {},
  setAccessToken: vi.fn(),
}));

function TestComponent() {
  const { user, isAuthenticated, login, logout } = useAuthContext();
  return (
    <div>
      <div data-testid="auth-state">{isAuthenticated ? "auth" : "guest"}</div>
      <div data-testid="username">{user?.username || ""}</div>
      <button onClick={() => login({ username_or_email: "test", password: "pwd" })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes as unauthenticated if no session", async () => {
    vi.mocked(AuthService.refresh).mockRejectedValueOnce(new Error("No token"));

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId("auth-state").textContent).toBe("guest");
  });

  it("restores session if active token exists", async () => {
    const mockUser = { id: "1", username: "john_doe", email: "john@example.com", roles: ["candidate"] };
    vi.mocked(AuthService.refresh).mockResolvedValueOnce({ access_token: "t", token_type: "b" });
    vi.mocked(AuthService.getCurrentUser).mockResolvedValueOnce(mockUser as any);

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId("auth-state").textContent).toBe("auth");
    expect(screen.getByTestId("username").textContent).toBe("john_doe");
  });
});
