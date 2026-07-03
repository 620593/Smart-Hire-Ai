import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth";
import { apiClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
  setAccessToken: vi.fn(),
}));

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a user successfully", async () => {
    const mockUser = { id: "1", username: "test", email: "test@example.com" };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockUser });

    const payload = { username: "test", email: "test@example.com", password: "password" };
    const result = await AuthService.register(payload);

    expect(apiClient.post).toHaveBeenCalledWith("/auth/register", payload);
    expect(result).toEqual(mockUser);
  });

  it("logs in successfully", async () => {
    const mockToken = { access_token: "token123", token_type: "bearer" };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockToken });

    const payload = { username_or_email: "test", password: "password" };
    const result = await AuthService.login(payload);

    expect(apiClient.post).toHaveBeenCalledWith("/auth/login", payload);
    expect(result).toEqual(mockToken);
  });

  it("fetches current user successfully", async () => {
    const mockUser = { id: "1", username: "test", email: "test@example.com" };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockUser });

    const result = await AuthService.getCurrentUser();

    expect(apiClient.get).toHaveBeenCalledWith("/auth/me");
    expect(result).toEqual(mockUser);
  });
});
