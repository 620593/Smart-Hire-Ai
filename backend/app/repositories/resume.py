from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.resume import Resume

class ResumeRepository:
    """Implement database operations for Resumes."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_resume(
        self,
        user_id: UUID,
        original_filename: str,
        stored_filename: str,
        storage_path: str,
        file_size: int,
        mime_type: str,
        status: str = "pending"
    ) -> Resume:
        """Create and persist a new resume record."""
        resume = Resume(
            user_id=user_id,
            original_filename=original_filename,
            stored_filename=stored_filename,
            storage_path=storage_path,
            file_size=file_size,
            mime_type=mime_type,
            status=status
        )
        self.db.add(resume)
        await self.db.commit()
        await self.db.refresh(resume)
        return resume

    async def find_resume(self, resume_id: UUID) -> Resume | None:
        """Find a resume by its ID."""
        query = select(Resume).where(Resume.id == resume_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_user_resumes(self, user_id: UUID) -> list[Resume]:
        """Retrieve all resumes owned by a specific user."""
        query = select(Resume).where(Resume.user_id == user_id).order_by(Resume.uploaded_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_resume(self, resume: Resume, **kwargs) -> Resume:
        """Update fields of an existing resume record."""
        for key, val in kwargs.items():
            setattr(resume, key, val)
        self.db.add(resume)
        await self.db.commit()
        await self.db.refresh(resume)
        return resume

    async def delete_resume(self, resume: Resume) -> None:
        """Delete a resume record from the database."""
        await self.db.delete(resume)
        await self.db.commit()

    async def download_resume(self, resume_id: UUID) -> Resume | None:
        """Return the database record of a resume for downloading purpose."""
        return await self.find_resume(resume_id)
