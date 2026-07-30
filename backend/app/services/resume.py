"""Resume service — environment-aware storage strategy.

Storage backend is selected automatically based on APP_ENV:

  - ``development``  → local disk  (./uploads/resumes/<user_id>/<uuid>.pdf)
  - ``production``   → PostgreSQL  (BYTEA column on the resumes table)

This means local development workflow is unchanged (files land on disk),
while Render deployment is fully safe from ephemeral filesystem resets.
"""

from __future__ import annotations

import os
from uuid import UUID, uuid4
from datetime import datetime, timezone
from fastapi import HTTPException
from app.repositories.resume import ResumeRepository
from app.models.resume import Resume
from app.db.enums import ResumeStatus
from sqlalchemy.ext.asyncio import AsyncSession


def _is_production() -> bool:
    """Return True when running in the Render (production) environment."""
    return os.environ.get("APP_ENV", "development").lower() == "production"


class ResumeService:
    """Implement core business logic for resume management.

    Storage behaviour:
      - Local  (APP_ENV=development): PDF written to ./uploads/resumes/
      - Render (APP_ENV=production):  PDF stored as BYTEA in PostgreSQL
    """

    UPLOAD_ROOT = os.path.join("uploads", "resumes")

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.resume_repo = ResumeRepository(db)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _verify_pdf_signature(self, file_bytes: bytes) -> bool:
        """Ensure file begins with the PDF magic header."""
        return file_bytes.startswith(b"%PDF")

    def _check_auth(
        self,
        current_user_id: UUID,
        current_user_roles: list[str],
        owner_id: UUID,
        action: str,
    ) -> None:
        """Enforce Candidate / Recruiter / Admin RBAC rules."""
        is_admin = "admin" in current_user_roles
        is_recruiter = "recruiter" in current_user_roles

        if is_admin:
            return
        if action in ["read", "download", "list"]:
            if current_user_id == owner_id or is_recruiter:
                return
        elif action in ["upload", "replace", "delete"]:
            if current_user_id == owner_id:
                return

        raise HTTPException(
            status_code=403,
            detail="You do not have permission to perform this action.",
        )

    def _validate_pdf(self, file_bytes: bytes, filename: str, content_type: str) -> None:
        """Centralised PDF validation — raises HTTPException on any failure."""
        if not filename.lower().endswith(".pdf") or content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

        file_size = len(file_bytes)
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds the 5 MB limit.")

        if not self._verify_pdf_signature(file_bytes):
            raise HTTPException(status_code=400, detail="Invalid or corrupted PDF file.")

    # ------------------------------------------------------------------
    # Local-disk helpers (development only)
    # ------------------------------------------------------------------

    def _write_to_disk(self, user_id: UUID, file_bytes: bytes) -> tuple[str, str]:
        """Write PDF bytes to local disk and return (stored_filename, storage_path)."""
        user_dir = os.path.join(self.UPLOAD_ROOT, str(user_id))
        os.makedirs(user_dir, exist_ok=True)
        stored_filename = f"{uuid4()}.pdf"
        storage_path = os.path.join(user_dir, stored_filename)
        try:
            with open(storage_path, "wb") as fh:
                fh.write(file_bytes)
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to write file to local disk: {exc}",
            )
        return stored_filename, storage_path

    def _delete_from_disk(self, storage_path: str | None) -> None:
        """Remove a file from local disk if it exists (silent on errors)."""
        if storage_path and os.path.exists(storage_path):
            try:
                os.remove(storage_path)
            except Exception:
                pass

    # ------------------------------------------------------------------
    # Upload
    # ------------------------------------------------------------------

    async def upload_resume(
        self,
        current_user_id: UUID,
        current_user_roles: list[str],
        target_user_id: UUID,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> Resume:
        """Validate and store a PDF resume using the environment-appropriate backend."""
        self._check_auth(current_user_id, current_user_roles, target_user_id, "upload")
        self._validate_pdf(file_bytes, filename, content_type)

        if _is_production():
            # ── Render / Production: store bytes in PostgreSQL BYTEA ──
            return await self.resume_repo.create_resume(
                user_id=target_user_id,
                original_filename=filename,
                file_size=len(file_bytes),
                mime_type=content_type,
                file_data=file_bytes,
                status=ResumeStatus.PENDING,
            )
        else:
            # ── Local / Development: write to ./uploads ──
            stored_filename, storage_path = self._write_to_disk(target_user_id, file_bytes)
            return await self.resume_repo.create_resume(
                user_id=target_user_id,
                original_filename=filename,
                file_size=len(file_bytes),
                mime_type=content_type,
                file_data=None,
                stored_filename=stored_filename,
                storage_path=storage_path,
                status=ResumeStatus.PENDING,
            )

    # ------------------------------------------------------------------
    # Replace
    # ------------------------------------------------------------------

    async def replace_resume(
        self,
        resume_id: UUID,
        current_user_id: UUID,
        current_user_roles: list[str],
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> Resume:
        """Replace the binary data and metadata of an existing resume."""
        resume = await self.resume_repo.find_resume(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found.")

        self._check_auth(current_user_id, current_user_roles, resume.user_id, "replace")
        self._validate_pdf(file_bytes, filename, content_type)

        if _is_production():
            return await self.resume_repo.update_resume(
                resume,
                original_filename=filename,
                file_size=len(file_bytes),
                mime_type=content_type,
                file_data=file_bytes,
                stored_filename=None,
                storage_path=None,
                status=ResumeStatus.PENDING,
                updated_at=datetime.now(timezone.utc),
            )
        else:
            # Delete old disk file first
            self._delete_from_disk(resume.storage_path)
            stored_filename, storage_path = self._write_to_disk(resume.user_id, file_bytes)
            return await self.resume_repo.update_resume(
                resume,
                original_filename=filename,
                file_size=len(file_bytes),
                mime_type=content_type,
                file_data=None,
                stored_filename=stored_filename,
                storage_path=storage_path,
                status=ResumeStatus.PENDING,
                updated_at=datetime.now(timezone.utc),
            )

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete_resume(
        self,
        resume_id: UUID,
        current_user_id: UUID,
        current_user_roles: list[str],
    ) -> None:
        """Remove the resume from storage and the database."""
        resume = await self.resume_repo.find_resume(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found.")

        self._check_auth(current_user_id, current_user_roles, resume.user_id, "delete")

        # Clean up local disk file if present (no-op in production)
        self._delete_from_disk(resume.storage_path)

        await self.resume_repo.delete_resume(resume)

    # ------------------------------------------------------------------
    # Read / List
    # ------------------------------------------------------------------

    async def get_resume(
        self,
        resume_id: UUID,
        current_user_id: UUID,
        current_user_roles: list[str],
    ) -> Resume:
        """Fetch resume metadata (no binary payload)."""
        resume = await self.resume_repo.find_resume(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found.")
        self._check_auth(current_user_id, current_user_roles, resume.user_id, "read")
        return resume

    async def list_resumes(
        self,
        current_user_id: UUID,
        current_user_roles: list[str],
        target_user_id: UUID,
    ) -> list[Resume]:
        """List all resumes for a target user, with permission check."""
        self._check_auth(current_user_id, current_user_roles, target_user_id, "list")
        return await self.resume_repo.list_user_resumes(target_user_id)

    # ------------------------------------------------------------------
    # Download
    # ------------------------------------------------------------------

    async def download_resume(
        self,
        resume_id: UUID,
        current_user_id: UUID,
        current_user_roles: list[str],
    ) -> tuple[bytes, str, str]:
        """Return (pdf_bytes, original_filename, mime_type) for download.

        Works in both storage modes:
          - Production: fetches bytes from the BYTEA DB column.
          - Development: reads bytes off the local disk.
        """
        resume = await self.resume_repo.find_resume(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found.")

        self._check_auth(current_user_id, current_user_roles, resume.user_id, "download")

        if _is_production():
            # ── Fetch from PostgreSQL BYTEA ──
            pdf_bytes = await self.resume_repo.get_file_data(resume_id)
            if not pdf_bytes:
                raise HTTPException(
                    status_code=404,
                    detail="Resume binary data is not available in the database.",
                )
        else:
            # ── Read from local disk ──
            if not resume.storage_path or not os.path.exists(resume.storage_path):
                raise HTTPException(
                    status_code=404,
                    detail="Physical resume file not found on disk.",
                )
            with open(resume.storage_path, "rb") as fh:
                pdf_bytes = fh.read()

        return pdf_bytes, resume.original_filename, resume.mime_type

    async def get_resume_bytes(
        self,
        resume_id: UUID,
        current_user_id: UUID,
        current_user_roles: list[str],
    ) -> tuple[bytes, str]:
        """Convenience method: return (pdf_bytes, original_filename) for in-memory parsing.

        Used by the /text endpoint and the ATS pipeline so PDFs are never
        written to a temp file when running in production.
        """
        pdf_bytes, filename, _ = await self.download_resume(
            resume_id=resume_id,
            current_user_id=current_user_id,
            current_user_roles=current_user_roles,
        )
        return pdf_bytes, filename
