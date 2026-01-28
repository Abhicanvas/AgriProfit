"""
User management routes.

This module provides endpoints for:
- Viewing and updating user profiles
- Admin user management (list, view, delete users)
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import User
from app.users.schemas import UserResponse, UserUpdate
from app.users.service import UserService
from app.auth.security import get_current_user, require_role
from app.core.rate_limit import limiter, RATE_LIMIT_READ, RATE_LIMIT_WRITE

router = APIRouter(prefix="/users", tags=["Users"])


# =============================================================================
# CURRENT USER ENDPOINTS
# =============================================================================

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get My Profile",
    description="Retrieve the authenticated user's profile information.",
    responses={
        200: {
            "description": "User profile retrieved successfully",
            "model": UserResponse,
        },
        401: {
            "description": "Not authenticated",
            "content": {
                "application/json": {
                    "example": {"detail": "Not authenticated"}
                }
            }
        },
    }
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Get the current authenticated user's profile.

    Returns the complete profile information including phone number,
    role, district, and language preferences.

    Args:
        current_user: Authenticated user (from JWT token)

    Returns:
        UserResponse with complete user profile

    Raises:
        HTTPException 401: If not authenticated

    Example:
        >>> response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
        >>> assert response.status_code == 200
        >>> assert "phone_number" in response.json()
    """
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update My Profile",
    description="Update the authenticated user's profile information (district and/or language).",
    responses={
        200: {
            "description": "Profile updated successfully",
            "model": UserResponse,
        },
        400: {
            "description": "Validation error or no fields provided",
            "content": {
                "application/json": {
                    "examples": {
                        "no_fields": {
                            "summary": "No fields provided",
                            "value": {"detail": "At least one field must be provided for update"}
                        },
                        "invalid_district": {
                            "summary": "Invalid district code",
                            "value": {"detail": "Invalid district code. Must be one of: KL-TVM, KL-KLM, ..."}
                        },
                        "invalid_language": {
                            "summary": "Invalid language",
                            "value": {"detail": "Language must be 'en' or 'ml'"}
                        }
                    }
                }
            }
        },
        401: {
            "description": "Not authenticated",
            "content": {
                "application/json": {
                    "example": {"detail": "Not authenticated"}
                }
            }
        },
    }
)
async def update_current_user_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Update the current user's profile.

    Users can update their district (Kerala district code) and/or
    preferred language (English or Malayalam). At least one field
    must be provided.

    Args:
        user_data: UserUpdate with fields to update
        db: Database session (injected)
        current_user: Authenticated user (from JWT token)

    Returns:
        UserResponse with updated profile

    Raises:
        HTTPException 400: No fields provided or validation failed
        HTTPException 401: Not authenticated

    Example:
        >>> response = client.put(
        ...     "/users/me",
        ...     json={"district": "KL-EKM", "language": "ml"},
        ...     headers={"Authorization": f"Bearer {token}"}
        ... )
        >>> assert response.status_code == 200
    """
    service = UserService(db)

    update_data = user_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided for update",
        )

    updated_user = service.update_user(current_user, user_data)
    return updated_user


# =============================================================================
# ADMIN USER MANAGEMENT ENDPOINTS
# =============================================================================

@router.get(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get User by ID (Admin)",
    description="Retrieve a user's profile by their ID. Requires admin role.",
    responses={
        200: {
            "description": "User profile retrieved successfully",
            "model": UserResponse,
        },
        401: {
            "description": "Not authenticated",
            "content": {
                "application/json": {
                    "example": {"detail": "Not authenticated"}
                }
            }
        },
        403: {
            "description": "Admin role required",
            "content": {
                "application/json": {
                    "example": {"detail": "Admin role required"}
                }
            }
        },
        404: {
            "description": "User not found",
            "content": {
                "application/json": {
                    "example": {"detail": "User not found"}
                }
            }
        },
    }
)
async def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> UserResponse:
    """
    Get a user by their ID (admin only).

    Allows administrators to view any user's profile information.

    Args:
        user_id: UUID of the user to retrieve
        db: Database session (injected)
        current_user: Admin user (from JWT token)

    Returns:
        UserResponse with the requested user's profile

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 403: Not an admin
        HTTPException 404: User not found
    """
    service = UserService(db)
    user = service.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.get(
    "/",
    response_model=list[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List All Users (Admin)",
    description="List all users with pagination and optional filtering. Requires admin role.",
    responses={
        200: {
            "description": "List of users",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "phone_number": "9876543210",
                            "role": "farmer",
                            "district": "KL-EKM",
                            "language": "ml",
                            "created_at": "2024-01-15T10:30:00Z",
                            "district_name": "Ernakulam"
                        }
                    ]
                }
            }
        },
        401: {
            "description": "Not authenticated",
            "content": {
                "application/json": {
                    "example": {"detail": "Not authenticated"}
                }
            }
        },
        403: {
            "description": "Admin role required",
            "content": {
                "application/json": {
                    "example": {"detail": "Admin role required"}
                }
            }
        },
    }
)
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=100, ge=1, le=100, description="Maximum records to return"),
    role: str | None = Query(default=None, description="Filter by role: 'farmer' or 'admin'"),
    district: str | None = Query(default=None, description="Filter by Kerala district code"),
) -> list[UserResponse]:
    """
    List all users with pagination and filtering (admin only).

    Supports pagination via skip/limit and optional filtering by
    role and/or district.

    Args:
        db: Database session (injected)
        current_user: Admin user (from JWT token)
        skip: Number of records to skip (pagination offset)
        limit: Maximum records to return (1-100)
        role: Optional filter by user role
        district: Optional filter by district code

    Returns:
        List of UserResponse objects

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 403: Not an admin

    Example:
        >>> # Get first 50 farmers from Ernakulam
        >>> response = client.get(
        ...     "/users/?role=farmer&district=KL-EKM&limit=50",
        ...     headers={"Authorization": f"Bearer {admin_token}"}
        ... )
    """
    service = UserService(db)
    users = service.get_all(skip=skip, limit=limit, role=role, district=district)
    return users


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete User (Admin)",
    description="Soft delete a user by their ID. Requires admin role.",
    responses={
        204: {
            "description": "User deleted successfully"
        },
        401: {
            "description": "Not authenticated",
            "content": {
                "application/json": {
                    "example": {"detail": "Not authenticated"}
                }
            }
        },
        403: {
            "description": "Admin role required",
            "content": {
                "application/json": {
                    "example": {"detail": "Admin role required"}
                }
            }
        },
        404: {
            "description": "User not found",
            "content": {
                "application/json": {
                    "example": {"detail": "User not found"}
                }
            }
        },
    }
)
async def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> None:
    """
    Soft delete a user (admin only).

    Performs a soft delete by setting the deleted_at timestamp.
    The user's data is preserved but they can no longer log in.

    Args:
        user_id: UUID of the user to delete
        db: Database session (injected)
        current_user: Admin user (from JWT token)

    Raises:
        HTTPException 401: Not authenticated
        HTTPException 403: Not an admin
        HTTPException 404: User not found
    """
    service = UserService(db)
    deleted = service.soft_delete(user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
