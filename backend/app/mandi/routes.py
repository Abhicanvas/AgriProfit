from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import User
from app.mandi.schemas import MandiCreate, MandiUpdate, MandiResponse  # ✅ Correct
from app.mandi.service import MandiService  # ✅ Correct
from app.auth.security import get_current_user, require_role

router = APIRouter(prefix="/mandis", tags=["Mandis"])


@router.post(
    "/",
    response_model=MandiResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_mandi(
    mandi_data: MandiCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> MandiResponse:
    """Create a new mandi (admin only)."""
    service = MandiService(db)
    try:
        mandi = service.create(mandi_data)
        return mandi
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/{mandi_id}",
    response_model=MandiResponse,
    status_code=status.HTTP_200_OK,
)
async def get_mandi(
    mandi_id: UUID,
    db: Session = Depends(get_db),
) -> MandiResponse:
    """Get a single mandi by ID."""
    service = MandiService(db)
    mandi = service.get_by_id(mandi_id)
    if not mandi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mandi not found",
        )
    return mandi


@router.get(
    "/",
    response_model=list[MandiResponse],
    status_code=status.HTTP_200_OK,
)
async def list_mandis(
    db: Session = Depends(get_db),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    district: str | None = Query(default=None),
) -> list[MandiResponse]:
    """List all mandis with optional filtering."""
    service = MandiService(db)
    mandis = service.get_all(skip=skip, limit=limit, district=district)
    return mandis


@router.get(
    "/search/",
    response_model=list[MandiResponse],
    status_code=status.HTTP_200_OK,
)
async def search_mandis(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[MandiResponse]:
    """Search mandis by name or market code."""
    service = MandiService(db)
    mandis = service.search(query=q, limit=limit)
    return mandis


@router.get(
    "/by-code/{market_code}",
    response_model=MandiResponse,
    status_code=status.HTTP_200_OK,
)
async def get_mandi_by_code(
    market_code: str,
    db: Session = Depends(get_db),
) -> MandiResponse:
    """Get a mandi by market code."""
    service = MandiService(db)
    mandi = service.get_by_market_code(market_code)
    if not mandi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mandi not found",
        )
    return mandi


@router.put(
    "/{mandi_id}",
    response_model=MandiResponse,
    status_code=status.HTTP_200_OK,
)
async def update_mandi(
    mandi_id: UUID,
    mandi_data: MandiUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> MandiResponse:
    """Update an existing mandi (admin only)."""
    service = MandiService(db)

    # Check if at least one field is provided
    update_data = mandi_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided for update",
        )

    try:
        mandi = service.update(mandi_id, mandi_data)
        if not mandi:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mandi not found",
            )
        return mandi
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/{mandi_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_mandi(
    mandi_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> None:
    """Soft delete a mandi (admin only)."""
    service = MandiService(db)
    deleted = service.delete(mandi_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mandi not found",
        )
