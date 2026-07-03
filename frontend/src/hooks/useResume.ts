import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import axios, { AxiosProgressEvent, CancelTokenSource } from "axios";
import type { Resume, ResumeListResponse, ResumeUploadResponse, ResumeUpdateResponse } from "@/types/resume";

export function useResumeList(userId?: string) {
  return useQuery<ResumeListResponse>({
    queryKey: ["resumes", userId],
    queryFn: async () => {
      const url = userId ? `/resumes?user_id=${userId}` : "/resumes";
      const response = await apiClient.get<ResumeListResponse>(url);
      return response.data;
    }
  });
}

export function useResume(id: string) {
  return useQuery<Resume>({
    queryKey: ["resume", id],
    queryFn: async () => {
      const response = await apiClient.get<Resume>(`/resumes/${id}`);
      return response.data;
    },
    enabled: !!id
  });
}

interface UploadArgs {
  file: File;
  targetUserId?: string;
  onProgress?: (progressEvent: AxiosProgressEvent) => void;
  cancelSource?: CancelTokenSource;
}

export function useUploadResume() {
  const queryClient = useQueryClient();

  return useMutation<ResumeUploadResponse, Error, UploadArgs>({
    mutationFn: async ({ file, targetUserId, onProgress, cancelSource }) => {
      const formData = new FormData();
      formData.append("file", file);

      const url = targetUserId
        ? `/resumes/upload?target_user_id=${targetUserId}`
        : "/resumes/upload";

      const response = await apiClient.post<ResumeUploadResponse>(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: onProgress,
        cancelToken: cancelSource?.token
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    }
  });
}

interface ReplaceArgs {
  id: string;
  file: File;
  onProgress?: (progressEvent: AxiosProgressEvent) => void;
  cancelSource?: CancelTokenSource;
}

export function useReplaceResume() {
  const queryClient = useQueryClient();

  return useMutation<ResumeUpdateResponse, Error, ReplaceArgs>({
    mutationFn: async ({ id, file, onProgress, cancelSource }) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.put<ResumeUpdateResponse>(`/resumes/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: onProgress,
        cancelToken: cancelSource?.token
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["resume", variables.id] });
    }
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<{ message: string }>(`/resumes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    }
  });
}
export { axios };
export type { CancelTokenSource };
export type { AxiosProgressEvent };
