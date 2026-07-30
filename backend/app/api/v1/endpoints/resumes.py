from uuid import UUID
from typing import Optional
import io
from fastapi import APIRouter, Depends, File, UploadFile, Query
from fastapi.responses import StreamingResponse
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

    pdf_bytes, filename, mime_type = await service.download_resume(
        resume_id=id,
        current_user_id=current_user.id,
        current_user_roles=user_roles,
    )

    return StreamingResponse(
        content=io.BytesIO(pdf_bytes),
        media_type=mime_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@router.get("/{id}/text")
async def get_resume_text(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Extract and return the plain text content of a resume PDF."""
    from fastapi.responses import JSONResponse
    from app.utils.pdf_parser import parse_resume

    service = ResumeService(db)
    user_roles = [role.name for role in current_user.roles]

    # Fetch PDF bytes from the environment-appropriate storage backend
    try:
        pdf_bytes, _ = await service.get_resume_bytes(
            resume_id=id,
            current_user_id=current_user.id,
            current_user_roles=user_roles,
        )
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Resume not found or unreadable: {e}")

    # Parse PDF from in-memory bytes (no temp file written)
    try:
        from app.utils.pdf_parser import parse_resume_from_bytes
        result = parse_resume_from_bytes(pdf_bytes)
        text = result.get("text", "") if isinstance(result, dict) else str(result)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Failed to parse resume PDF: {str(e)}")

    return JSONResponse(content={"text": text, "char_count": len(text)})

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
