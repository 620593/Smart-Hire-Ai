import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  useResumeList, 
  useResume, 
  useUploadResume, 
  useReplaceResume, 
  useDeleteResume 
} from "./useResume";
import { apiClient } from "@/lib/axios";

// Mock axios client wrapper
vi.mock("@/lib/axios", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useResume Hooks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("useResumeList fetches resumes successfully", async () => {
    const mockResumes = {
      resumes: [
        {
          id: "res-123",
          original_filename: "resume.pdf",
          file_size: 1024,
          mime_type: "application/pdf",
          status: "completed",
          uploaded_at: "2023-10-24T12:00:00Z"
        }
      ]
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockResumes });

    const { result } = renderHook(() => useResumeList(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResumes);
    expect(apiClient.get).toHaveBeenCalledWith("/resumes");
  });

  it("useResume fetches specific resume details successfully", async () => {
    const mockResume = {
      id: "res-123",
      original_filename: "resume.pdf",
      status: "completed"
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockResume });

    const { result } = renderHook(() => useResume("res-123"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResume);
    expect(apiClient.get).toHaveBeenCalledWith("/resumes/res-123");
  });

  it("useUploadResume uploads file successfully", async () => {
    const mockResponse = {
      message: "Uploaded successfully",
      resume: { id: "res-123", original_filename: "resume.pdf" }
    };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useUploadResume(), { wrapper: createWrapper() });

    const file = new File(["pdf content"], "resume.pdf", { type: "application/pdf" });
    result.current.mutate({ file });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(apiClient.post).toHaveBeenCalled();
  });

  it("useReplaceResume replaces file successfully", async () => {
    const mockResponse = {
      message: "Updated successfully",
      resume: { id: "res-123", original_filename: "new.pdf" }
    };
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useReplaceResume(), { wrapper: createWrapper() });

    const file = new File(["new content"], "new.pdf", { type: "application/pdf" });
    result.current.mutate({ id: "res-123", file });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(apiClient.put).toHaveBeenCalled();
  });

  it("useDeleteResume deletes resume successfully", async () => {
    const mockResponse = { message: "Deleted successfully" };
    vi.mocked(apiClient.delete).mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useDeleteResume(), { wrapper: createWrapper() });

    result.current.mutate("res-123");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(apiClient.delete).toHaveBeenCalledWith("/resumes/res-123");
  });
});
