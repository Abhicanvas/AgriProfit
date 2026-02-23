from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator

class InventoryBase(BaseModel):
    commodity_id: UUID
    quantity: float = Field(..., gt=0, description="Quantity of the commodity")
    unit: str = Field(..., min_length=1, max_length=20, description="Unit of measurement (e.g., kg, ton)")

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    quantity: float | None = Field(None, gt=0)
    unit: str | None = Field(None, min_length=1, max_length=20)

class InventoryResponse(InventoryBase):
    id: UUID
    user_id: UUID
    quantity: float = Field(..., ge=0, description="Quantity of the commodity")  # Allow 0 for existing DB records
    commodity_name: str | None = None
    updated_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode='before')
    @classmethod
    def extract_commodity_name(cls, data):
        """Extract commodity name from relationship if available."""
        if hasattr(data, 'commodity') and data.commodity:
            # SQLAlchemy model object
            return {
                'id': data.id,
                'user_id': data.user_id,
                'commodity_id': data.commodity_id,
                'quantity': data.quantity,
                'unit': data.unit,
                'commodity_name': data.commodity.name,
                'updated_at': data.updated_at,
                'created_at': data.created_at,
            }
        return data
