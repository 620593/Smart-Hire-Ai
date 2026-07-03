from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.core.security.dependencies import get_current_active_user
from app.services.resume import ResumeService
from app.schemas.resume import (
    ResumeResponse,
    ResumeListResponse,
    ResumeUploadResponse,
    ResumeUpdateResponse,
)

router = APIRouter(prefix="/resumes", tags=["resumes"])

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    target_user_id: Optional[UUID] = Query(None, description="The user owning the resume (Admins only for other users)"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a new PDF resume."""
    service = ResumeService(db)
    user_id = target_user_id or current_user.id
    user_roles = [role.name for role in current_user.roles]

    # Read uploaded bytes
    file_bytes = await file.read()

    # Trigger service upload
    resume = await service.upload_resume(
        current_user_id=current_user.id,
        current_user_roles=user_roles,
        target_user_id=user_id,
        file_bytes=file_bytes,
        filename=file.filename or "resume.pdf",
        content_type=file.content_type or "application/pdf"
    )

    return {
        "message": "Resume uploaded successfully.",
        "resume": resume
    }

@router.get("", response_model=ResumeListResponse)
async def list_resumes(
    user_id: Optional[UUID] = Query(None, description="Retrieve resumes for a specific user ID"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all resumes owned by current candidate or target user ID."""
    service = ResumeService(db)
    target_id = user_id or current_user.id
    user_roles = [role.name for role in current_user.roles]

    resumes = await service.list_resumes(
        current_user_id=current_user.id,
        current_user_roles=user_roles,
        target_user_id=target_id
    )

    return {"resumes": resumes}

@router.get("/{id}", response_model=ResumeResponse)
async def get_resume_metadata(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch metadata of a specific resume."""
    service = ResumeService(db)
    user_roles = [role.name for role in current_user.roles]

    return await service.get_resume(
        resume_id=id,
        current_user_id=current_user.id,
        current_user_roles=user_roles
    )

@router.get("/{id}/download")
async def download_resume_file(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Download physical PDF file of a specific resume."""
    service = ResumeService(db)
    user_roles = [role.name for role in current_user.roles]

    storage_path, filename, mime_type = await service.download_resume(
        resume_id=id,
        current_user_id=current_user.id,
        current_user_roles=user_roles
    )

    return FileResponse(
        path=storage_path,
        filename=filename,
        media_type=mime_type
    )

@router.put("/{id}", response_model=ResumeUpdateResponse)
async def replace_resume_file(
    id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Replace an existing resume file and its metadata."""
    service = ResumeService(db)
    user_roles = [role.name for role in current_user.roles]

    file_bytes = await file.read()

    resume = await service.replace_resume(
        resume_id=id,
        current_user_id=current_user.id,
        current_user_roles=user_roles,
        file_bytes=file_bytes,
        filename=file.filename or "resume.pdf",
        content_type=file.content_type or "application/pdf"
    )

    return {
        "message": "Resume updated successfully.",
        "resume": resume
    }

@router.delete("/{id}")
async def delete_resume(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a resume from DB and storage."""
    service = ResumeService(db)
    user_roles = [role.name for role in current_user.roles]

    await service.delete_resume(
        resume_id=id,
        current_user_id=current_user.id,
        current_user_roles=user_roles
    )

    return {"message": "Resume deleted successfully."}
