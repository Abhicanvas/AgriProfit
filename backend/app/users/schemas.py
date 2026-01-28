"""
User schemas for API requests and responses.

This module defines Pydantic models for:
- User profile responses
- User profile updates
- Kerala district validation
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, computed_field


# Valid Kerala district codes
KERALA_DISTRICTS = [
    "KL-TVM",  # Thiruvananthapuram
    "KL-KLM",  # Kollam
    "KL-PTA",  # Pathanamthitta
    "KL-ALP",  # Alappuzha
    "KL-KTM",  # Kottayam
    "KL-IDK",  # Idukki
    "KL-EKM",  # Ernakulam
    "KL-TSR",  # Thrissur
    "KL-PKD",  # Palakkad
    "KL-MLP",  # Malappuram
    "KL-KKD",  # Kozhikode
    "KL-WYD",  # Wayanad
    "KL-KNR",  # Kannur
    "KL-KSD",  # Kasaragod
]

# District code to name mapping
DISTRICT_NAMES = {
    "KL-TVM": "Thiruvananthapuram",
    "KL-KLM": "Kollam",
    "KL-PTA": "Pathanamthitta",
    "KL-ALP": "Alappuzha",
    "KL-KTM": "Kottayam",
    "KL-IDK": "Idukki",
    "KL-EKM": "Ernakulam",
    "KL-TSR": "Thrissur",
    "KL-PKD": "Palakkad",
    "KL-MLP": "Malappuram",
    "KL-KKD": "Kozhikode",
    "KL-WYD": "Wayanad",
    "KL-KNR": "Kannur",
    "KL-KSD": "Kasaragod",
}


def get_district_name(district_code: str | None) -> str | None:
    """Get district name from district code."""
    if district_code is None:
        return None
    return DISTRICT_NAMES.get(district_code, "Unknown")


class UserResponse(BaseModel):
    """
    Schema for user profile API responses.

    Returns user details including computed district name from district code.
    """
    id: UUID = Field(..., description="Unique user identifier")
    phone_number: str = Field(..., description="10-digit Indian mobile number")
    role: str = Field(..., description="User role: 'farmer' or 'admin'")
    district: str | None = Field(None, description="Kerala district code (e.g., 'KL-EKM')")
    language: str = Field(..., description="Preferred language: 'en' (English) or 'ml' (Malayalam)")
    created_at: datetime = Field(..., description="Account creation timestamp")

    @computed_field
    @property
    def district_name(self) -> str | None:
        """Computed district name from district code."""
        return get_district_name(self.district)

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "phone_number": "9876543210",
                "role": "farmer",
                "district": "KL-EKM",
                "language": "ml",
                "created_at": "2024-01-15T10:30:00Z",
                "district_name": "Ernakulam"
            }
        }
    )


class UserUpdate(BaseModel):
    """
    Schema for updating user profile.

    Only district and language can be updated by users.
    Both fields are optional - only provided fields will be updated.
    """
    district: str | None = Field(
        default=None,
        description="Kerala district code (e.g., 'KL-EKM' for Ernakulam)",
        json_schema_extra={"example": "KL-EKM"}
    )
    language: str | None = Field(
        default=None,
        description="Preferred language: 'en' (English) or 'ml' (Malayalam)",
        json_schema_extra={"example": "ml"}
    )

    @field_validator("district")
    @classmethod
    def validate_district(cls, v: str | None) -> str | None:
        if v is not None:
            if v not in KERALA_DISTRICTS:
                raise ValueError(f"Invalid district code. Must be one of: {', '.join(KERALA_DISTRICTS)}")
        return v

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str | None) -> str | None:
        if v is not None:
            if v not in ("en", "ml"):
                raise ValueError("Language must be 'en' or 'ml'")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "summary": "Update district only",
                    "value": {"district": "KL-TSR"}
                },
                {
                    "summary": "Update language only",
                    "value": {"language": "ml"}
                },
                {
                    "summary": "Update both fields",
                    "value": {"district": "KL-KKD", "language": "en"}
                }
            ]
        }
    )


class UserListResponse(BaseModel):
    """Schema for paginated user list (admin only)."""
    items: list[UserResponse] = Field(..., description="List of users")
    total: int = Field(..., description="Total number of users matching filters")
    skip: int = Field(..., description="Number of records skipped")
    limit: int = Field(..., description="Maximum records returned")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "phone_number": "9876543210",
                        "role": "farmer",
                        "district": "KL-EKM",
                        "language": "ml",
                        "created_at": "2024-01-15T10:30:00Z",
                        "district_name": "Ernakulam"
                    }
                ],
                "total": 150,
                "skip": 0,
                "limit": 100
            }
        }
    )
