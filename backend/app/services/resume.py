import os
import shutil
from uuid import UUID, uuid4
from datetime import datetime, timezone
from fastapi import HTTPException
from app.repositories.resume import ResumeRepository
from app.models.resume import Resume
from app.db.enums import UserRole, ResumeStatus
from sqlalchemy.ext.asyncio import AsyncSession

class ResumeService:
    """Implement core business logic for resume management."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.resume_repo = ResumeRepository(db)
        # Root upload directory relative to backend folder
        self.upload_root = os.path.join("uploads", "resumes")

    def _verify_pdf_signature(self, file_bytes: bytes) -> bool:
        """Ensure file begins with the PDF magic header."""
        return file_bytes.startswith(b"%PDF")

    def _check_auth(
        self,
        current_user_id: UUID,
        current_user_roles: list[str],
        owner_id: UUID,
        action: str
    ) -> None:
        """Enforce Candidate/Recruiter/Admin RBAC rules."""
        is_admin = "admin" in current_user_roles
        is_recruiter = "recruiter" in current_user_roles
        
        if is_admin:
            return

        if action in ["read", "download", "list"]:
            # Candidates can access their own files
            if current_user_id == owner_id:
                return
            # Recruiters can read and download any resume
            if is_recruiter:
                return
        elif action in ["upload", "replace", "delete"]:
            # Candidates can mutate only their own files
            if current_user_id == owner_id:
                return

        raise HTTPException(
            status_code=403,
            detail="You do not have permission to perform this action."
        )

    async def upload_resume(
        self,
        current_user_id: UUID,
        current_user_roles: list[str],
        target_user_id: UUID,
        file_bytes: bytes,
        filename: str,
        content_type: str
    ) -> Resume:
        """Validate, store, and create database record for a new PDF resume."""
        # Check permissions
        self._check_auth(current_user_id, current_user_roles, target_user_id, "upload")

        # Validate file constraints
        if not filename.lower().endswith(".pdf") or content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

        file_size = len(file_bytes)
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds the 5 MB limit.")

        if not self._verify_pdf_signature(file_bytes):
            raise HTTPException(status_code=400, detail="Invalid or corrupted PDF file.")

        # Prepare storage directory
        user_dir = os.path.join(self.upload_root, str(target_user_id))
        os.makedirs(user_dir, exist_ok=True)

        # Generate unique storage filename
        random_uuid = str(uuid4())
        stored_filename = f"{random_uuid}.pdf"
        storage_path = os.path.join(user_dir, stored_filename)

        # Write file content to disk
        try:
            with open(storage_path, "wb") as f:
                f.write(file_bytes)
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to write file to local disk: {str(exc)}"
            )

        # Persist DB metadata
        return await self.resume_repo.create_resume(
            user_id=target_user_id,
            original_filename=filename,
            stored_filename=stored_filename,
            storage_path=storage_path,
            file_size=file_size,
            mime_type=content_type,
            status=ResumeStatus.PENDING
        )

    async def replace_resume(
        self,
        resume_id: UUID,
        current_user_id: UUID,
        current_user_roles: list[str],
        file_bytes: bytes,
        filename: str,
        content_type: str
    ) -> Resume:
        """Replace the physical file and metadata of an existing resume."""
        resume = await self.resume_repo.find_resume(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found.")

        # Check permissions
        self._check_auth(current_user_id, current_user_roles, resume.user_id, "replace")

        # Validate file constraints
        if not filename.lower().endswith(".pdf") or content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

        file_size = len(file_bytes)
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds the 5 MB limit.")

        if not self._verify_pdf_signature(file_bytes):
            raise HTTPException(status_code=400, detail="Invalid or corrupted PDF file.")

        # Delete existing file from disk
        if os.path.exists(resume.storage_path):
            try:
                os.remove(resume.storage_path)
            except Exception:
                pass

        # Write new file content to disk at the same path (or generate a new uuid path to avoid caching)
        user_dir = os.path.join(self.upload_root, str(resume.user_id))
        random_uuid = str(uuid4())
        stored_filename = f"{random_uuid}.pdf"
        storage_path = os.path.join(user_dir, stored_filename)

        try:
            with open(storage_path, "wb") as f:
                f.write(file_bytes)
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to replace file on disk: {str(exc)}"
            )

        # Update metadata in DB
        return await self.resume_repo.update_resume(
            resume,
            original_filename=filename,
            stored_filename=stored_filename,
            storage_path=storage_path,
            file_size=file_size,
            mime_type=content_type,
            status=ResumeStatus.PENDING,
            updated_at=datetime.now(timezone.utc)
        )

    async def delete_resume(
        self,
        resume_id: UUID,
        current_user_id: UUID,
        current_user_roles: list[str]
    ) -> None:
        """Remove physical file and DB record."""
        resume = await self.resume_repo.find_resume(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found.")

        # Check permissions
        self._check_auth(current_user_id, current_user_roles, resume.user_id, "delete")

        # Delete file from disk
        if os.path.exists(resume.storage_path):
            try:
                os.remove(resume.storage_path)
            except Exception:
                pass

        # Remove from database
        await self.resume_repo.delete_resume(resume)

    async def get_resume(
        self,
        resume_id: UUID,
        current_user_id: UUID,
        current_user_roles: list[str]
    ) -> Resume:
        """Fetch a resume metadata checking permissions."""
        resume = await self.resume_repo.find_resume(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found.")

        self._check_auth(current_user_id, current_user_roles, resume.user_id, "read")
        return resume

    async def list_resumes(
        self,
        current_user_id: UUID,
        current_user_roles: list[str],
        target_user_id: UUID
    ) -> list[Resume]:
        """List resumes for a target user ID checking permissions."""
        self._check_auth(current_user_id, current_user_roles, target_user_id, "list")
        return await self.resume_repo.list_user_resumes(target_user_id)

    async def download_resume(
        self,
        resume_id: UUID,
        current_user_id: UUID,
        current_user_roles: list[str]
    ) -> tuple[str, str, str]:
        """Retrieve storage details for a download operation."""
        resume = await self.resume_repo.find_resume(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found.")

        self._check_auth(current_user_id, current_user_roles, resume.user_id, "download")

        if not os.path.exists(resume.storage_path):
            raise HTTPException(status_code=404, detail="Physical resume file not found on disk.")

        return resume.storage_path, resume.original_filename, resume.mime_type
