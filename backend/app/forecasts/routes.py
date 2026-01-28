"""
Price Forecast routes for ML-powered price predictions.

This module provides endpoints for:
- Creating and managing forecasts (admin only)
- Querying forecasts by commodity, mandi, date range
- Getting latest forecasts for decision making
"""
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import User
from app.forecasts.schemas import (
    PriceForecastCreate, PriceForecastUpdate,
    PriceForecastResponse, PriceForecastListResponse,
)
from app.forecasts.service import PriceForecastService
from app.auth.security import get_current_user, require_role

router = APIRouter(prefix="/forecasts", tags=["Forecasts"])


@router.post(
    "/",
    response_model=PriceForecastResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Forecast (Admin)",
    description="Create a new ML-powered price forecast. Requires admin role.",
    responses={
        201: {"description": "Forecast created", "model": PriceForecastResponse},
        400: {"description": "Validation error"},
        401: {"description": "Not authenticated"},
        403: {"description": "Admin role required"},
    }
)
async def create_forecast(
    forecast_data: PriceForecastCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> PriceForecastResponse:
    """
    Create a new price forecast (admin only).

    Records ML model predictions with confidence scores for future prices.
    """
    service = PriceForecastService(db)
    try:
        forecast = service.create(forecast_data)
        return forecast
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/latest",
    response_model=PriceForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Latest Forecast",
    description="Get the most recent forecast for a commodity at a mandi. Public endpoint.",
    responses={
        200: {"description": "Forecast found", "model": PriceForecastResponse},
        404: {"description": "No forecast found"},
    }
)
async def get_latest_forecast(
    commodity_id: UUID = Query(..., description="Commodity UUID"),
    mandi_id: UUID = Query(..., description="Mandi UUID"),
    db: Session = Depends(get_db),
) -> PriceForecastResponse:
    """Get the latest forecast for a commodity at a mandi."""
    service = PriceForecastService(db)
    forecast = service.get_latest(commodity_id, mandi_id)
    if not forecast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No forecast found for this commodity and mandi",
        )
    return forecast


@router.get(
    "/{forecast_id}",
    response_model=PriceForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Forecast",
    description="Retrieve a specific forecast by ID. Public endpoint.",
    responses={
        200: {"description": "Forecast found", "model": PriceForecastResponse},
        404: {"description": "Forecast not found"},
    }
)
async def get_forecast(
    forecast_id: UUID,
    db: Session = Depends(get_db),
) -> PriceForecastResponse:
    """Get a forecast by ID."""
    service = PriceForecastService(db)
    forecast = service.get_by_id(forecast_id)
    if not forecast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Forecast not found")
    return forecast


@router.get(
    "/",
    response_model=PriceForecastListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Forecasts",
    description="List forecasts with filtering by commodity, mandi, date range, model version. Public endpoint.",
    responses={200: {"description": "Paginated forecasts"}},
)
async def list_forecasts(
    db: Session = Depends(get_db),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    commodity_id: UUID | None = Query(default=None, description="Filter by commodity"),
    mandi_id: UUID | None = Query(default=None, description="Filter by mandi"),
    start_date: date | None = Query(default=None, description="Filter by forecast date start"),
    end_date: date | None = Query(default=None, description="Filter by forecast date end"),
    model_version: str | None = Query(default=None, description="Filter by ML model version"),
) -> PriceForecastListResponse:
    """List forecasts with optional filtering."""
    service = PriceForecastService(db)
    forecasts = service.get_all(
        skip=skip, limit=limit, commodity_id=commodity_id, mandi_id=mandi_id,
        start_date=start_date, end_date=end_date, model_version=model_version,
    )
    total = service.count(
        commodity_id=commodity_id, mandi_id=mandi_id,
        start_date=start_date, end_date=end_date, model_version=model_version,
    )
    return PriceForecastListResponse(items=forecasts, total=total, skip=skip, limit=limit)


@router.get(
    "/commodity/{commodity_id}",
    response_model=list[PriceForecastResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Forecasts by Commodity",
    description="Get all forecasts for a specific commodity. Public endpoint.",
    responses={200: {"description": "List of forecasts"}},
)
async def get_forecasts_by_commodity(
    commodity_id: UUID,
    db: Session = Depends(get_db),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=100),
) -> list[PriceForecastResponse]:
    """Get forecasts for a specific commodity."""
    service = PriceForecastService(db)
    return service.get_by_commodity(
        commodity_id=commodity_id, start_date=start_date, end_date=end_date, limit=limit,
    )


@router.get(
    "/mandi/{mandi_id}",
    response_model=list[PriceForecastResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Forecasts by Mandi",
    description="Get all forecasts for a specific mandi. Public endpoint.",
    responses={200: {"description": "List of forecasts"}},
)
async def get_forecasts_by_mandi(
    mandi_id: UUID,
    db: Session = Depends(get_db),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=100),
) -> list[PriceForecastResponse]:
    """Get forecasts for a specific mandi."""
    service = PriceForecastService(db)
    return service.get_by_mandi(
        mandi_id=mandi_id, start_date=start_date, end_date=end_date, limit=limit,
    )


@router.put(
    "/{forecast_id}",
    response_model=PriceForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Forecast (Admin)",
    description="Update an existing price forecast. Requires admin role.",
    responses={
        200: {"description": "Forecast updated", "model": PriceForecastResponse},
        400: {"description": "Validation error"},
        401: {"description": "Not authenticated"},
        403: {"description": "Admin role required"},
        404: {"description": "Forecast not found"},
    }
)
async def update_forecast(
    forecast_id: UUID,
    forecast_data: PriceForecastUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> PriceForecastResponse:
    """Update an existing forecast (admin only)."""
    service = PriceForecastService(db)
    update_data = forecast_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided for update",
        )
    try:
        forecast = service.update(forecast_id, forecast_data)
        if not forecast:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Forecast not found")
        return forecast
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/{forecast_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Forecast (Admin)",
    description="Delete a price forecast. Requires admin role.",
    responses={
        204: {"description": "Forecast deleted"},
        401: {"description": "Not authenticated"},
        403: {"description": "Admin role required"},
        404: {"description": "Forecast not found"},
    }
)
async def delete_forecast(
    forecast_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> None:
    """Delete a forecast (admin only)."""
    service = PriceForecastService(db)
    deleted = service.delete(forecast_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Forecast not found")
