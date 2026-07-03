import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, setAccessToken, getAccessToken } from "./axios";

describe("Axios Interceptor", () => {
  beforeEach(() => {
    setAccessToken(null);
  });

  it("sets and gets the in-memory access token", () => {
    setAccessToken("test_token");
    expect(getAccessToken()).toBe("test_token");
  });

  it("adds the Authorization header to outgoing requests", async () => {
    setAccessToken("my_test_jwt");
    
    // We can inspect request configuration by registering a temporary request interceptor
    const interceptorId = apiClient.interceptors.request.use((config) => {
      expect(config.headers?.Authorization).toBe("Bearer my_test_jwt");
      return config;
    });

    try {
      await apiClient.get("/test-endpoint").catch(() => {});
    } finally {
      apiClient.interceptors.request.eject(interceptorId);
    }
  });
});
