import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID, uuid4

from app.db.enums import UserRole, ResumeStatus
from app.models.user import User
from app.models.role import Role
from app.models.resume import Resume
from app.core.security.password import PasswordManager
from app.core.security.tokens import create_access_token
from app.repositories.resume import ResumeRepository
from app.services.resume import ResumeService

password_manager = PasswordManager()

async def create_test_user(db: AsyncSession, username: str, role: UserRole) -> tuple[User, str]:
    """Helper to create a user and generate their access token."""
    email = f"{username}@example.com"
    hashed_pass = password_manager.hash_password("Password123!")
    
    # Retrieve target role
    role_query = select(Role).where(Role.name == role)
    role_result = await db.execute(role_query)
    db_role = role_result.scalar_one_or_none()
    if not db_role:
        db_role = Role(name=role, description=f"{role.value} role")
        db.add(db_role)
        await db.flush()

    user = User(
        email=email,
        username=username,
        hashed_password=hashed_pass,
        is_active=True,
        is_verified=True
    )
    user.roles.append(db_role)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    access_token = create_access_token(subject=str(user.id), email=user.email, role=role.value)
    return user, access_token

@pytest.mark.asyncio
async def test_repository_and_service_direct(db: AsyncSession) -> None:
    """Test Repository and Service methods directly."""
    user, _ = await create_test_user(db, "directuser", UserRole.CANDIDATE)
    
    repo = ResumeRepository(db)
    
    # Test Create
    resume = await repo.create_resume(
        user_id=user.id,
        original_filename="resume.pdf",
        stored_filename="stored.pdf",
        storage_path="uploads/resumes/test.pdf",
        file_size=1024,
        mime_type="application/pdf",
        status=ResumeStatus.PENDING
    )
    assert resume.id is not None
    assert resume.original_filename == "resume.pdf"
    
    # Test Find
    found = await repo.find_resume(resume.id)
    assert found is not None
    assert found.id == resume.id
    
    # Test List
    resumes = await repo.list_user_resumes(user.id)
    assert len(resumes) == 1
    
    # Test Update
    updated = await repo.update_resume(resume, status=ResumeStatus.COMPLETED)
    assert updated.status == ResumeStatus.COMPLETED
    
    # Test Delete
    await repo.delete_resume(resume)
    deleted = await repo.find_resume(resume.id)
    assert deleted is None

@pytest.mark.asyncio
async def test_api_upload_flow(client: AsyncClient, db: AsyncSession) -> None:
    """Test successful upload, download, metadata, replace, and delete API lifecycle."""
    candidate, token = await create_test_user(db, "candidate1", UserRole.CANDIDATE)
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Upload valid PDF
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<Root 1 0 R>>\n%%EOF"
    files = {"file": ("my_resume.pdf", pdf_content, "application/pdf")}
    
    upload_response = await client.post("/api/v1/resumes/upload", files=files, headers=headers)
    assert upload_response.status_code == 200
    upload_data = upload_response.json()
    assert "resume" in upload_data
    resume_id = upload_data["resume"]["id"]
    
    # 2. Get metadata
    metadata_response = await client.get(f"/api/v1/resumes/{resume_id}", headers=headers)
    assert metadata_response.status_code == 200
    meta_data = metadata_response.json()
    assert meta_data["original_filename"] == "my_resume.pdf"
    
    # 3. Download
    download_response = await client.get(f"/api/v1/resumes/{resume_id}/download", headers=headers)
    assert download_response.status_code == 200
    assert download_response.content == pdf_content
    
    # 4. List resumes
    list_response = await client.get("/api/v1/resumes", headers=headers)
    assert list_response.status_code == 200
    list_data = list_response.json()
    assert len(list_data["resumes"]) == 1
    
    # 5. Replace PDF
    new_pdf_content = b"%PDF-1.5\nnew content\n%%EOF"
    new_files = {"file": ("new_resume.pdf", new_pdf_content, "application/pdf")}
    replace_response = await client.put(f"/api/v1/resumes/{resume_id}", files=new_files, headers=headers)
    assert replace_response.status_code == 200
    
    # Verify download has updated content
    download_response_2 = await client.get(f"/api/v1/resumes/{resume_id}/download", headers=headers)
    assert download_response_2.status_code == 200
    assert download_response_2.content == new_pdf_content
    
    # 6. Delete
    delete_response = await client.delete(f"/api/v1/resumes/{resume_id}", headers=headers)
    assert delete_response.status_code == 200
    
    # Verify metadata is now 404
    missing_response = await client.get(f"/api/v1/resumes/{resume_id}", headers=headers)
    assert missing_response.status_code == 404

@pytest.mark.asyncio
async def test_api_upload_validation_rules(client: AsyncClient, db: AsyncSession) -> None:
    """Test validation boundaries: wrong MIME, oversized, corrupted, and empty files."""
    _, token = await create_test_user(db, "candidate2", UserRole.CANDIDATE)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Case A: Wrong MIME type
    wrong_mime_files = {"file": ("test.png", b"fake png content", "image/png")}
    response = await client.post("/api/v1/resumes/upload", files=wrong_mime_files, headers=headers)
    assert response.status_code == 400
    assert "Only PDF files are allowed" in response.json()["error"]["message"]

    # Case B: Empty file
    empty_files = {"file": ("test.pdf", b"", "application/pdf")}
    response = await client.post("/api/v1/resumes/upload", files=empty_files, headers=headers)
    assert response.status_code == 400
    assert "empty" in response.json()["error"]["message"].lower()

    # Case C: Corrupted/Fake PDF (starts with non-PDF header bytes)
    corrupted_files = {"file": ("test.pdf", b"NOTAPDF header bytes", "application/pdf")}
    response = await client.post("/api/v1/resumes/upload", files=corrupted_files, headers=headers)
    assert response.status_code == 400
    assert "Invalid or corrupted PDF file" in response.json()["error"]["message"]

    # Case D: Oversized file (exceeds 5MB)
    huge_content = b"%PDF-1.4\n" + (b"X" * (5 * 1024 * 1024 + 10))
    huge_files = {"file": ("huge.pdf", huge_content, "application/pdf")}
    response = await client.post("/api/v1/resumes/upload", files=huge_files, headers=headers)
    assert response.status_code == 400
    assert "exceeds" in response.json()["error"]["message"].lower()

@pytest.mark.asyncio
async def test_api_security_and_rbac(client: AsyncClient, db: AsyncSession) -> None:
    """Test authorization roles: candidate, recruiter, admin, unauthorized, forbidden."""
    # Create Candidate 1
    cand1, cand1_token = await create_test_user(db, "candidate_rbac_1", UserRole.CANDIDATE)
    # Create Candidate 2
    _, cand2_token = await create_test_user(db, "candidate_rbac_2", UserRole.CANDIDATE)
    # Create Recruiter
    _, recruiter_token = await create_test_user(db, "recruiter_rbac", UserRole.RECRUITER)
    # Create Admin
    _, admin_token = await create_test_user(db, "admin_rbac", UserRole.ADMIN)
    
    cand1_headers = {"Authorization": f"Bearer {cand1_token}"}
    cand2_headers = {"Authorization": f"Bearer {cand2_token}"}
    recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Candidate 1 uploads a resume
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<Root 1 0 R>>\n%%EOF"
    files = {"file": ("my_resume.pdf", pdf_content, "application/pdf")}
    upload_res = await client.post("/api/v1/resumes/upload", files=files, headers=cand1_headers)
    assert upload_res.status_code == 200
    resume_id = upload_res.json()["resume"]["id"]

    # 2. Candidate 2 attempts to read Candidate 1's resume metadata (Forbidden - 403)
    response = await client.get(f"/api/v1/resumes/{resume_id}", headers=cand2_headers)
    assert response.status_code == 403

    # 3. Recruiter attempts to read Candidate 1's resume metadata (Allowed - 200)
    response = await client.get(f"/api/v1/resumes/{resume_id}", headers=recruiter_headers)
    assert response.status_code == 200

    # 4. Recruiter attempts to delete Candidate 1's resume (Forbidden - 403)
    response = await client.delete(f"/api/v1/resumes/{resume_id}", headers=recruiter_headers)
    assert response.status_code == 403

    # 5. Admin attempts to delete Candidate 1's resume (Allowed - 200)
    response = await client.delete(f"/api/v1/resumes/{resume_id}", headers=admin_headers)
    assert response.status_code == 200

    # 6. Anonymous request (Unauthorized - 401)
    response = await client.get(f"/api/v1/resumes/{resume_id}")
    assert response.status_code == 401
