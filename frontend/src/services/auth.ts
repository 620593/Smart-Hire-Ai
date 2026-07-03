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

export const AdminService = {
  async listPendingRecruiters(): Promise<User[]> {
    const response = await apiClient.get<User[]>("/admin/recruiters/pending");
    return response.data;
  },

  async approveRecruiter(userId: string): Promise<User> {
    const response = await apiClient.post<User>(`/admin/recruiters/${userId}/approve`);
    return response.data;
  },

  async rejectRecruiter(userId: string): Promise<User> {
    const response = await apiClient.post<User>(`/admin/recruiters/${userId}/reject`);
    return response.data;
  },
};
