"""Unit tests for the PasswordManager class."""

from __future__ import annotations

from app.core.security.password import PasswordManager


def test_password_hashing() -> None:
    """Test that password hashing and verification works successfully."""
    pwd_manager = PasswordManager()
    password = "SuperSecurePassword123!"

    hashed = pwd_manager.hash_password(password)
    assert hashed != password
    assert hashed.startswith("$argon2id$")

    assert pwd_manager.verify_password(password, hashed) is True
    assert pwd_manager.verify_password("wrong_password", hashed) is False


def test_needs_rehash() -> None:
    """Test that needs_rehash identifies updated parameters or settings."""
    pwd_manager = PasswordManager()
    password = "AnotherPassword456"

    hashed = pwd_manager.hash_password(password)
    assert pwd_manager.needs_rehash(hashed) is False
