from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from app.db.enums import ResumeStatus

class ResumeResponse(BaseModel):
    id: UUID
    user_id: UUID
    original_filename: str
    stored_filename: str
    storage_path: str
    file_size: int
    mime_type: str
    status: ResumeStatus
    parsed_at: datetime | None = None
    processed_at: datetime | None = None
    parser_version: str | None = None
    uploaded_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ResumeListResponse(BaseModel):
    resumes: list[ResumeResponse]

class ResumeUploadResponse(BaseModel):
    message: str
    resume: ResumeResponse

class ResumeUpdateResponse(BaseModel):
    message: str
    resume: ResumeResponse
