"""Integration tests for authentication API endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_auth_flow(client: AsyncClient, db: AsyncSession) -> None:
    """Test full registration, login, refresh, profile, and logout flow."""
    # 1. Register candidate user
    register_payload = {
        "email": "testcandidate@example.com",
        "username": "testcandidate",
        "password": "Password123!",
        "first_name": "Test",
        "last_name": "Candidate",
        "phone_number": "1234567890",
    }
    register_response = await client.post("/api/v1/auth/register", json=register_payload)
    assert register_response.status_code == 201
    reg_data = register_response.json()
    assert reg_data["email"] == register_payload["email"]
    assert reg_data["username"] == register_payload["username"]
    assert "roles" in reg_data
    assert "candidate" in reg_data["roles"]

    # 2. Login user
    login_payload = {
        "username_or_email": "testcandidate@example.com",
        "password": "Password123!",
    }
    login_response = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    access_token = login_data["access_token"]

    # Check that refresh_token cookie was set
    assert "refresh_token" in login_response.cookies
    refresh_token = login_response.cookies["refresh_token"]

    # 3. GET /me (using bearer token)
    headers = {"Authorization": f"Bearer {access_token}"}
    me_response = await client.get("/api/v1/auth/me", headers=headers)
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == register_payload["email"]
    assert me_data["username"] == register_payload["username"]

    # 4. Refresh token
    refresh_response = await client.post("/api/v1/auth/refresh")
    assert refresh_response.status_code == 200
    refresh_data = refresh_response.json()
    assert "access_token" in refresh_data
    new_access_token = refresh_data["access_token"]
    assert new_access_token != access_token
    assert "refresh_token" in refresh_response.cookies

    # 5. Logout
    logout_response = await client.post("/api/v1/auth/logout")
    assert logout_response.status_code == 204
    # The cookie should have been deleted (e.g. max-age=0 or deleted from cookies)
    # Since HTTPX client updates cookies, let's verify cookie removal or expired state
    # Cookie is usually either gone or expired
    cookie = logout_response.cookies.get("refresh_token")
    assert cookie is None or cookie == ""
