"""Unit tests for JWT generation and verification."""

from __future__ import annotations

from datetime import timedelta
import pytest

from app.core.security.exceptions import ExpiredToken, TokenTypeMismatch, InvalidToken
from app.core.security.jwt import encode_jwt, decode_jwt
from app.core.security.tokens import create_access_token, create_refresh_token, verify_token


def test_create_access_token() -> None:
    """Test that access token is created with correct claims."""
    subject = "12345678-1234-5678-1234-567812345678"
    email = "candidate@example.com"
    role = "candidate"

    token = create_access_token(subject, email, role)
    payload = verify_token(token, expected_type="access")

    assert payload["sub"] == subject
    assert payload["email"] == email
    assert payload["role"] == role
    assert payload["type"] == "access"
    assert "iat" in payload
    assert "exp" in payload
    assert "jti" in payload


def test_create_refresh_token() -> None:
    """Test that refresh token is created with correct claims."""
    subject = "12345678-1234-5678-1234-567812345678"

    token = create_refresh_token(subject)
    payload = verify_token(token, expected_type="refresh")

    assert payload["sub"] == subject
    assert payload["type"] == "refresh"
    assert "email" not in payload
    assert "role" not in payload
    assert "iat" in payload
    assert "exp" in payload
    assert "jti" in payload


def test_verify_token_type_mismatch() -> None:
    """Test that verification raises TokenTypeMismatch for wrong type claim."""
    subject = "12345678-1234-5678-1234-567812345678"
    email = "candidate@example.com"
    role = "candidate"

    access_token = create_access_token(subject, email, role)

    with pytest.raises(TokenTypeMismatch):
        verify_token(access_token, expected_type="refresh")

    refresh_token = create_refresh_token(subject)

    with pytest.raises(TokenTypeMismatch):
        verify_token(refresh_token, expected_type="access")


def test_expired_token() -> None:
    """Test that expired token raises ExpiredToken exception."""
    payload = {"sub": "123", "type": "access"}
    expired_token = encode_jwt(payload, expires_delta=timedelta(seconds=-60))

    with pytest.raises(ExpiredToken):
        decode_jwt(expired_token)
