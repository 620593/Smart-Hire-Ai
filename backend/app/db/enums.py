"""Centralized database enums for SmartHire AI backend."""

from __future__ import annotations

from enum import Enum


class UserRole(str, Enum):
	"""Supported user roles for future authorization and persistence."""

	ADMIN = "admin"
	RECRUITER = "recruiter"
	CANDIDATE = "candidate"


class ResumeStatus(str, Enum):
	"""Supported resume states for future persistence."""

	PENDING = "pending"
	PROCESSING = "processing"
	COMPLETED = "completed"
	FAILED = "failed"


__all__ = ["ResumeStatus", "UserRole"]