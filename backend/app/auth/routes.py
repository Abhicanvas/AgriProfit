"""
Authentication routes for OTP-based phone verification.

This module provides endpoints for:
- Requesting OTP codes sent via SMS
- Verifying OTP codes and receiving JWT tokens
- Phone number validation (Indian mobile numbers)
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.auth.service import AuthService
from app.auth.otp import generate_otp
from app.core.config import settings
from app.core.rate_limit import limiter, RATE_LIMIT_CRITICAL
from app.core.logging_config import log_auth_failure, get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# =============================================================================
# REQUEST/RESPONSE SCHEMAS
# =============================================================================

class OTPRequestSchema(BaseModel):
    """
    Schema for requesting an OTP code.

    The phone number must be a valid 10-digit Indian mobile number
    starting with 6, 7, 8, or 9.
    """
    phone_number: str = Field(
        ...,
        min_length=10,
        max_length=10,
        description="10-digit Indian mobile number",
        json_schema_extra={"example": "9876543210"}
    )

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Phone number must contain only digits")
        if v[0] not in "6789":
            raise ValueError("Phone number must start with 6, 7, 8, or 9")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "phone_number": "9876543210"
            }
        }
    )


class OTPVerifySchema(BaseModel):
    """
    Schema for verifying an OTP code.

    Both phone number and 6-digit OTP code are required.
    """
    phone_number: str = Field(
        ...,
        min_length=10,
        max_length=10,
        description="10-digit Indian mobile number",
        json_schema_extra={"example": "9876543210"}
    )
    otp: str = Field(
        ...,
        min_length=6,
        max_length=6,
        description="6-digit OTP code received via SMS",
        json_schema_extra={"example": "123456"}
    )

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Phone number must contain only digits")
        if v[0] not in "6789":
            raise ValueError("Phone number must start with 6, 7, 8, or 9")
        return v

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("OTP must contain only digits")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "phone_number": "9876543210",
                "otp": "123456"
            }
        }
    )


class OTPResponse(BaseModel):
    """Schema for OTP request response."""
    message: str = Field(..., description="Success message")
    expires_in_seconds: int = Field(..., description="OTP validity period in seconds")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "OTP sent successfully",
                "expires_in_seconds": 300
            }
        }
    )


class TokenResponse(BaseModel):
    """Schema for successful authentication response with JWT token."""
    access_token: str = Field(..., description="JWT access token for API authentication")
    token_type: str = Field(default="bearer", description="Token type (always 'bearer')")
    is_new_user: bool = Field(..., description="Whether this is a newly registered user")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "is_new_user": False
            }
        }
    )


class ErrorResponse(BaseModel):
    """Schema for error responses."""
    detail: str = Field(..., description="Error message")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "detail": "Invalid OTP"
            }
        }
    )


# =============================================================================
# ROUTES
# =============================================================================

@router.post(
    "/request-otp",
    response_model=OTPResponse,
    status_code=status.HTTP_200_OK,
    summary="Request OTP Code",
    description="Request a 6-digit OTP code to be sent via SMS to the provided phone number.",
    responses={
        200: {
            "description": "OTP sent successfully",
            "model": OTPResponse,
        },
        400: {
            "description": "Invalid phone number format",
            "content": {
                "application/json": {
                    "example": {"detail": "Phone number must start with 6, 7, 8, or 9"}
                }
            }
        },
        429: {
            "description": "Rate limit exceeded - cooldown period active",
            "content": {
                "application/json": {
                    "example": {"detail": "Please wait 45 seconds before requesting a new OTP"}
                }
            }
        },
    }
)
@limiter.limit(RATE_LIMIT_CRITICAL)
async def request_otp(
    request: Request,
    response: Response,
    otp_request: OTPRequestSchema,
    db: Session = Depends(get_db),
) -> OTPResponse:
    """
    Request an OTP code for phone number authentication.

    This endpoint initiates the authentication flow by generating a 6-digit
    OTP code and sending it via SMS to the provided phone number. The OTP
    is valid for 5 minutes.

    A cooldown period of 60 seconds is enforced between OTP requests for
    the same phone number to prevent abuse.

    Args:
        request: HTTP request (for rate limiting)
        otp_request: OTPRequestSchema containing the phone number
        db: Database session (injected)

    Returns:
        OTPResponse with success message and expiry time

    Raises:
        HTTPException 400: Invalid phone number format
        HTTPException 429: Cooldown period not elapsed (rate limited)

    Example:
        >>> response = client.post("/auth/request-otp", json={"phone_number": "9876543210"})
        >>> assert response.status_code == 200
        >>> assert response.json()["expires_in_seconds"] == 300
    """
    service = AuthService(db)

    # Check cooldown
    can_request, seconds_remaining = service.can_request_otp(otp_request.phone_number)
    if not can_request:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {seconds_remaining} seconds before requesting a new OTP",
        )

    # Generate OTP
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    # Log OTP in development for testing
    if settings.is_development:
        logger.info(f"[DEV] OTP for {otp_request.phone_number}: {otp}")

    # Create OTP request
    service.create_otp_request(otp_request.phone_number, otp, expires_at)

    # In production, send OTP via SMS
    # For development, OTP is logged above
    return OTPResponse(
        message="OTP sent successfully",
        expires_in_seconds=300,
    )


@router.post(
    "/verify-otp",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify OTP and Get Token",
    description="Verify the OTP code and receive a JWT access token for API authentication.",
    responses={
        200: {
            "description": "OTP verified successfully, token issued",
            "model": TokenResponse,
        },
        400: {
            "description": "Invalid or expired OTP",
            "content": {
                "application/json": {
                    "examples": {
                        "invalid_otp": {
                            "summary": "Invalid OTP",
                            "value": {"detail": "Invalid OTP"}
                        },
                        "expired_otp": {
                            "summary": "Expired OTP",
                            "value": {"detail": "OTP has expired"}
                        },
                        "no_otp": {
                            "summary": "No OTP request found",
                            "value": {"detail": "No OTP request found for this phone number"}
                        }
                    }
                }
            }
        },
    }
)
@limiter.limit(RATE_LIMIT_CRITICAL)
async def verify_otp(
    request: Request,
    response: Response,
    verify_data: OTPVerifySchema,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Verify OTP and receive JWT access token.

    This endpoint completes the authentication flow by verifying the OTP
    code. On successful verification:
    - If the user exists, a new JWT token is issued
    - If the user doesn't exist, a new account is created automatically

    The JWT token should be included in subsequent API requests as:
    `Authorization: Bearer <token>`

    Args:
        request: HTTP request (for rate limiting and IP logging)
        verify_data: OTPVerifySchema with phone number and OTP code
        db: Database session (injected)

    Returns:
        TokenResponse with JWT access token and user status

    Raises:
        HTTPException 400: Invalid OTP, expired OTP, or no OTP request found

    Example:
        >>> response = client.post("/auth/verify-otp", json={
        ...     "phone_number": "9876543210",
        ...     "otp": "123456"
        ... })
        >>> assert response.status_code == 200
        >>> token = response.json()["access_token"]
    """
    service = AuthService(db)

    # Get client IP for logging
    client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if not client_ip and request.client:
        client_ip = request.client.host

    # Verify OTP
    success, message = service.verify_otp(verify_data.phone_number, verify_data.otp)
    if not success:
        # Log authentication failure
        log_auth_failure(
            phone_number=verify_data.phone_number,
            ip_address=client_ip or "unknown",
            reason=message,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )

    # Get or create user
    user, is_new = service.get_or_create_user(verify_data.phone_number)

    # Generate tokens
    tokens = service.generate_tokens(user)

    return TokenResponse(
        access_token=tokens["access_token"],
        token_type=tokens["token_type"],
        is_new_user=is_new,
    )
