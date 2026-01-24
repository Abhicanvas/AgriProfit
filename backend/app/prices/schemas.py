from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class PriceHistoryBase(BaseModel):
    """Base schema for PriceHistory with shared fields."""

    commodity_id: UUID
    mandi_id: UUID
    date: date
    min_price: float = Field(..., gt=0, description="Minimum price per unit")
    max_price: float = Field(..., gt=0, description="Maximum price per unit")
    modal_price: float = Field(..., gt=0, description="Most common price per unit")
    arrival_quantity: float | None = Field(default=None, ge=0, description="Quantity arrived in market")

    @field_validator("min_price", "max_price", "modal_price")
    @classmethod
    def validate_price(cls, v: float) -> float:
        """Ensure price is positive and reasonable."""
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        if v > 1000000:
            raise ValueError("Price seems unreasonably high")
        return round(v, 2)

    @field_validator("arrival_quantity")
    @classmethod
    def validate_quantity(cls, v: float | None) -> float | None:
        """Validate arrival quantity if provided."""
        if v is not None:
            if v < 0:
                raise ValueError("Arrival quantity cannot be negative")
            return round(v, 2)
        return v

    @model_validator(mode="after")
    def validate_price_order(self):
        """Ensure min_price <= modal_price <= max_price."""
        if self.min_price > self.max_price:
            raise ValueError("min_price cannot be greater than max_price")
        if self.modal_price < self.min_price:
            raise ValueError("modal_price cannot be less than min_price")
        if self.modal_price > self.max_price:
            raise ValueError("modal_price cannot be greater than max_price")
        return self


class PriceHistoryCreate(PriceHistoryBase):
    """Schema for creating a new price history record."""

    pass


class PriceHistoryUpdate(BaseModel):
    """Schema for updating an existing price history record."""

    date: date | None = Field(default=None)
    min_price: float | None = Field(default=None, gt=0)
    max_price: float | None = Field(default=None, gt=0)
    modal_price: float | None = Field(default=None, gt=0)
    arrival_quantity: float | None = Field(default=None, ge=0)

    @field_validator("min_price", "max_price", "modal_price")
    @classmethod
    def validate_price(cls, v: float | None) -> float | None:
        """Ensure price is positive and reasonable."""
        if v is not None:
            if v <= 0:
                raise ValueError("Price must be greater than 0")
            if v > 1000000:
                raise ValueError("Price seems unreasonably high")
            return round(v, 2)
        return v

    @field_validator("arrival_quantity")
    @classmethod
    def validate_quantity(cls, v: float | None) -> float | None:
        """Validate arrival quantity if provided."""
        if v is not None:
            if v < 0:
                raise ValueError("Arrival quantity cannot be negative")
            return round(v, 2)
        return v


class PriceHistoryResponse(PriceHistoryBase):
    """Schema for PriceHistory API responses."""

    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PriceHistoryListResponse(BaseModel):
    """Schema for paginated price history list."""

    items: list[PriceHistoryResponse]
    total: int
    skip: int
    limit: int


class PriceTrendResponse(BaseModel):
    """Schema for price trend data."""

    commodity_id: UUID
    mandi_id: UUID
    dates: list[date]
    min_prices: list[float]
    max_prices: list[float]
    modal_prices: list[float]
    avg_modal_price: float
    price_change_percent: float | None