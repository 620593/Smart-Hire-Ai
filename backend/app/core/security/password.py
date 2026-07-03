"""Password manager using Argon2 exclusively via pwdlib."""

from __future__ import annotations

from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.core.config import get_settings


class PasswordManager:
    """Manage hashing, verification, and rehashing of user passwords."""

    def __init__(self) -> None:
        """Initialize the password manager using configured Argon2 cost settings."""
        settings = get_settings()
        self.argon2_hasher = Argon2Hasher(
            memory_cost=settings.password_hash_memory_cost,
            time_cost=settings.password_hash_time_cost,
            parallelism=settings.password_hash_parallelism,
            hash_len=settings.password_hash_hash_len,
            salt_len=settings.password_hash_salt_len,
        )
        self.password_hash = PasswordHash((self.argon2_hasher,))

    def hash_password(self, password: str) -> str:
        """Hash a plaintext password.

        Args:
            password: The plaintext password to hash.

        Returns:
            The Argon2 password hash.
        """
        return self.password_hash.hash(password)

    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify a plaintext password against a hash.

        Args:
            password: The plaintext password.
            hashed_password: The hashed password.

        Returns:
            True if the password matches the hash, False otherwise.
        """
        try:
            return self.password_hash.verify(password, hashed_password)
        except Exception:
            return False

    def needs_rehash(self, hashed_password: str) -> bool:
        """Check if a hash needs to be rehashed to match current settings.

        Args:
            hashed_password: The hashed password.

        Returns:
            True if the password hash needs rehashing, False otherwise.
        """
        if not hashed_password.startswith("$argon2"):
            return True

        settings = get_settings()
        try:
            # e.g., $argon2id$v=19$m=65536,t=3,p=4$...
            parts = hashed_password.split("$")
            if len(parts) >= 4:
                params_str = parts[3]
                params = dict(param.split("=") for param in params_str.split(","))
                m = int(params.get("m", 0))
                t = int(params.get("t", 0))
                p = int(params.get("p", 0))

                if (
                    m != settings.password_hash_memory_cost
                    or t != settings.password_hash_time_cost
                    or p != settings.password_hash_parallelism
                ):
                    return True
        except Exception:
            return True

        return False
