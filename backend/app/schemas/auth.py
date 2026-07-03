"""Authentication request and response validation schemas."""

from __future__ import annotations

from typing import Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class RegisterRequest(BaseModel):
    """Schema for candidate registration request."""

    email: EmailStr = Field(..., max_length=255)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    phone_number: str | None = Field(default=None, max_length=20)

    @model_validator(mode="before")
    @classmethod
    def trim_password(cls, data: Any) -> Any:
        """Trim leading/trailing whitespace from password before validation."""
        if isinstance(data, dict) and "password" in data:
            if isinstance(data["password"], str):
                data["password"] = data["password"].strip()
        return data


class RecruiterRegisterRequest(BaseModel):
    """Schema for recruiter registration request (requires admin approval)."""

    email: EmailStr = Field(..., max_length=255)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., max_length=200)
    company_name: str = Field(..., max_length=255)

    @model_validator(mode="before")
    @classmethod
    def trim_password(cls, data: Any) -> Any:
        """Trim leading/trailing whitespace from password before validation."""
        if isinstance(data, dict) and "password" in data:
            if isinstance(data["password"], str):
                data["password"] = data["password"].strip()
        return data


class LoginRequest(BaseModel):
    """Schema for user login request."""

    username: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    username_or_email: str | None = Field(default=None, max_length=255)
    password: str = Field(...)

    @model_validator(mode="after")
    def validate_identifier(self) -> LoginRequest:
        """Verify that at least one login identifier is provided."""
        if not self.username and not self.email and not self.username_or_email:
            raise ValueError("Must provide either username, email, or username_or_email.")
        return self


class TokenResponse(BaseModel):
    """Schema for authentication token response."""

    access_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request in case of body submission."""

    refresh_token: str | None = Field(default=None)


class CurrentUserResponse(BaseModel):
    """Schema for authenticated user response profile."""

    id: UUID
    email: EmailStr
    username: str
    first_name: str | None
    last_name: str | None
    phone_number: str | None
    company_name: str | None = None
    roles: list[str]
    is_active: bool
    is_verified: bool
    is_approved: bool = True

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def map_roles(cls, data: Any) -> Any:
        """Map Role model instances to role name strings."""
        if hasattr(data, "roles") and not isinstance(data.roles, list):
            return data
        
        # If it's an ORM object:
        if hasattr(data, "roles"):
            roles_list = []
            for r in data.roles:
                if hasattr(r, "name"):
                    roles_list.append(str(r.name.value if hasattr(r.name, "value") else r.name))
                else:
                    roles_list.append(str(r))
            data_dict = {
                "id": data.id,
                "email": data.email,
                "username": data.username,
                "first_name": data.first_name,
                "last_name": data.last_name,
                "phone_number": data.phone_number,
                "company_name": getattr(data, "company_name", None),
                "roles": roles_list,
                "is_active": data.is_active,
                "is_verified": data.is_verified,
                "is_approved": getattr(data, "is_approved", True),
            }
            return data_dict
        return data
