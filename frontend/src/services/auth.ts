import { apiClient, setAccessToken } from "@/lib/axios";
import type { User, TokenResponse } from "@/types/auth";

export const AuthService = {
  async register(payload: Record<string, any>): Promise<User> {
    const response = await apiClient.post<User>("/auth/register", payload);
    return response.data;
  },

  async registerRecruiter(payload: Record<string, any>): Promise<User> {
    const response = await apiClient.post<User>("/auth/register/recruiter", payload);
    return response.data;
  },

  async login(payload: Record<string, any>): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>("/auth/login", payload);
    setAccessToken(response.data.access_token);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
    setAccessToken(null);
  },

  async refresh(): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>("/auth/refresh");
    setAccessToken(response.data.access_token);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// Types returned by the new admin endpoints
// ---------------------------------------------------------------------------

export interface PlatformStats {
  total_users: number;
  total_recruiters: number;
  total_candidates: number;
  pending_recruiters: number;
  active_recruiters: number;
  suspended_recruiters: number;
}

export interface ApiStatus {
  service: string;
  status: "ok" | "degraded" | "unconfigured";
  latency_ms: number | null;
  detail: string;
}

export interface SystemHealth {
  checked_at: string;
  database: ApiStatus;
  gemini: ApiStatus;
  groq: ApiStatus;
}

// ---------------------------------------------------------------------------
// AdminService — all calls require an admin Bearer token
// ---------------------------------------------------------------------------

export const AdminService = {
  // ── Recruiter management ─────────────────────────────────────────────────

  async listPendingRecruiters(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>("/admin/recruiters/pending");
    return data;
  },

  async listAllRecruiters(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>("/admin/recruiters");
    return data;
  },

  async approveRecruiter(userId: string): Promise<User> {
    const { data } = await apiClient.post<User>(`/admin/recruiters/${userId}/approve`);
    return data;
  },

  async rejectRecruiter(userId: string): Promise<User> {
    const { data } = await apiClient.post<User>(`/admin/recruiters/${userId}/reject`);
    return data;
  },

  async deleteRecruiter(userId: string): Promise<void> {
    await apiClient.delete(`/admin/recruiters/${userId}`);
  },

  // ── User management ──────────────────────────────────────────────────────

  async listAllUsers(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>("/admin/users");
    return data;
  },

  async deactivateUser(userId: string): Promise<User> {
    const { data } = await apiClient.post<User>(`/admin/users/${userId}/deactivate`);
    return data;
  },

  async activateUser(userId: string): Promise<User> {
    const { data } = await apiClient.post<User>(`/admin/users/${userId}/activate`);
    return data;
  },

  // ── Platform statistics & health ─────────────────────────────────────────

  async getPlatformStats(): Promise<PlatformStats> {
    const { data } = await apiClient.get<PlatformStats>("/admin/stats");
    return data;
  },

  async getSystemHealth(): Promise<SystemHealth> {
    const { data } = await apiClient.get<SystemHealth>("/admin/health");
    return data;
  },
};
