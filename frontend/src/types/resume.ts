export type ResumeStatus = "pending" | "processing" | "completed" | "failed";

export interface Resume {
  id: string;
  user_id: string;
  original_filename: string;
  stored_filename: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  status: ResumeStatus;
  parsed_at: string | null;
  processed_at: string | null;
  parser_version: string | null;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface ResumeListResponse {
  resumes: Resume[];
}

export interface ResumeUploadResponse {
  message: string;
  resume: Resume;
}

export interface ResumeUpdateResponse {
  message: string;
  resume: Resume;
}
