"""
Mandi (Market) management routes.

This module provides endpoints for:
- Listing, searching, and filtering mandis (public)
- Creating, updating, deleting mandis (admin only)
- Looking up mandis by market code
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import User
from app.mandi.schemas import MandiCreate, MandiUpdate, MandiResponse
from app.mandi.service import MandiService
from app.auth.security import get_current_user, require_role

router = APIRouter(prefix="/mandis", tags=["Mandis"])


@router.post(
    "/",
    response_model=MandiResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Mandi (Admin)",
    description="Register a new mandi (market) in the system. Requires admin role.",
    responses={
        201: {"description": "Mandi created", "model": MandiResponse},
        400: {"description": "Validation error or duplicate market code"},
        401: {"description": "Not authenticated"},
        403: {"description": "Admin role required"},
    }
)
async def create_mandi(
    mandi_data: MandiCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> MandiResponse:
    """
    Create a new mandi (admin only).

    Register a new agricultural market with location details and unique market code.

    Args:
        mandi_data: MandiCreate with market details
        db: Database session (injected)
        current_user: Admin user (from JWT token)

    Returns:
        MandiResponse with created mandi details

    Raises:
        HTTPException 400: Validation error or duplicate market code
        HTTPException 401: Not authenticated
        HTTPException 403: Not an admin
    """
    service = MandiService(db)
    try:
        mandi = service.create(mandi_data)
        return mandi
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{mandi_id}",
    response_model=MandiResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Mandi",
    description="Retrieve a mandi by its ID. Public endpoint.",
    responses={
        200: {"description": "Mandi found", "model": MandiResponse},
        404: {"description": "Mandi not found"},
    }
)
async def get_mandi(
    mandi_id: UUID,
    db: Session = Depends(get_db),
) -> MandiResponse:
    """
    Get a mandi by ID.

    Args:
        mandi_id: UUID of the mandi
        db: Database session (injected)

    Returns:
        MandiResponse with mandi details

    Raises:
        HTTPException 404: Mandi not found
    """
    service = MandiService(db)
    mandi = service.get_by_id(mandi_id)
    if not mandi:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mandi not found")
    return mandi


@router.get(
    "/",
    response_model=list[MandiResponse],
    status_code=status.HTTP_200_OK,
    summary="List Mandis",
    description="List all mandis with optional district filtering. Public endpoint.",
    responses={200: {"description": "List of mandis"}},
)
async def list_mandis(
    db: Session = Depends(get_db),
    skip: int = Query(default=0, ge=0, description="Records to skip"),
    limit: int = Query(default=100, ge=1, le=100, description="Max records"),
    district: str | None = Query(default=None, description="Filter by district name"),
) -> list[MandiResponse]:
    """
    List mandis with optional filtering.

    Args:
        db: Database session (injected)
        skip: Pagination offset
        limit: Max records to return
        district: Optional district filter

    Returns:
        List of MandiResponse objects
    """
    service = MandiService(db)
    mandis = service.get_all(skip=skip, limit=limit, district=district)
    return mandis


@router.get(
    "/search/",
    response_model=list[MandiResponse],
    status_code=status.HTTP_200_OK,
    summary="Search Mandis",
    description="Search mandis by name or market code. Public endpoint.",
    responses={200: {"description": "Search results"}},
)
async def search_mandis(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(default=10, ge=1, le=50, description="Max results"),
    db: Session = Depends(get_db),
) -> list[MandiResponse]:
    """
    Search mandis by name or market code.

    Args:
        q: Search query
        limit: Max results
        db: Database session (injected)

    Returns:
        List of matching mandis
    """
    service = MandiService(db)
    mandis = service.search(query=q, limit=limit)
    return mandis


@router.get(
    "/by-code/{market_code}",
    response_model=MandiResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Mandi by Code",
    description="Retrieve a mandi by its unique market code. Public endpoint.",
    responses={
        200: {"description": "Mandi found", "model": MandiResponse},
        404: {"description": "Mandi not found"},
    }
)
async def get_mandi_by_code(
    market_code: str,
    db: Session = Depends(get_db),
) -> MandiResponse:
    """
    Get a mandi by market code.

    Args:
        market_code: Unique market identifier (e.g., 'KL-EKM-001')
        db: Database session (injected)

    Returns:
        MandiResponse with mandi details

    Raises:
        HTTPException 404: Mandi not found
    """
    service = MandiService(db)
    mandi = service.get_by_market_code(market_code)
    if not mandi:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mandi not found")
    return mandi


@router.put(
    "/{mandi_id}",
    response_model=MandiResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Mandi (Admin)",
    description="Update an existing mandi. Requires admin role.",
    responses={
        200: {"description": "Mandi updated", "model": MandiResponse},
        400: {"description": "Validation error"},
        401: {"description": "Not authenticated"},
        403: {"description": "Admin role required"},
        404: {"description": "Mandi not found"},
    }
)
async def update_mandi(
    mandi_id: UUID,
    mandi_data: MandiUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> MandiResponse:
    """
    Update an existing mandi (admin only).

    Args:
        mandi_id: UUID of the mandi
        mandi_data: MandiUpdate with fields to change
        db: Database session (injected)
        current_user: Admin user (from JWT token)

    Returns:
        MandiResponse with updated details

    Raises:
        HTTPException 400: Validation error
        HTTPException 404: Mandi not found
    """
    service = MandiService(db)
    update_data = mandi_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided for update",
        )
    try:
        mandi = service.update(mandi_id, mandi_data)
        if not mandi:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mandi not found")
        return mandi
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/{mandi_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Mandi (Admin)",
    description="Soft delete a mandi. Requires admin role.",
    responses={
        204: {"description": "Mandi deleted"},
        401: {"description": "Not authenticated"},
        403: {"description": "Admin role required"},
        404: {"description": "Mandi not found"},
    }
)
async def delete_mandi(
    mandi_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> None:
    """
    Soft delete a mandi (admin only).

    Args:
        mandi_id: UUID of the mandi to delete
        db: Database session (injected)
        current_user: Admin user (from JWT token)

    Raises:
        HTTPException 404: Mandi not found
    """
    service = MandiService(db)
    deleted = service.delete(mandi_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mandi not found")
