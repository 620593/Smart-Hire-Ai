import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth, useCurrentUser } from "./useAuth";
import { useAuthContext } from "@/features/auth/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/features/auth/AuthContext", () => ({
  useAuthContext: vi.fn(),
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useAuth Hooks", () => {
  it("useAuth returns auth context", () => {
    const mockContext = { isAuthenticated: true, user: { username: "test" } };
    vi.mocked(useAuthContext).mockReturnValue(mockContext as any);

    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.username).toBe("test");
  });

  it("useCurrentUser returns current user from query", () => {
    const mockUser = { id: "1", username: "testuser", email: "test@example.com", roles: ["candidate"] };
    vi.mocked(useAuthContext).mockReturnValue({
      user: mockUser,
      isInitialized: true,
      refreshUser: vi.fn(),
    } as any);

    const { result } = renderHook(() => useCurrentUser(), { wrapper });
    expect(result.current.user).toEqual(mockUser);
  });
});
