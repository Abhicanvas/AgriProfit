from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Commodity
from app.commodities.schemas import CommodityCreate, CommodityUpdate


class CommodityService:
    """Service class for Commodity operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, commodity_id: UUID) -> Commodity | None:
        """Get a commodity by ID."""
        return self.db.query(Commodity).filter(
            Commodity.id == commodity_id,
        ).first()

    def get_by_name(self, name: str) -> Commodity | None:
        """Get a commodity by name."""
        return self.db.query(Commodity).filter(
            Commodity.name == name,
        ).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        category: str | None = None,
    ) -> list[Commodity]:
        """Get all commodities with pagination and optional filtering."""
        query = self.db.query(Commodity)
        if category:
            query = query.filter(Commodity.category == category)
        return query.order_by(Commodity.name).offset(skip).limit(limit).all()

    def search(self, query: str, limit: int = 10) -> list[Commodity]:
        """Search commodities by name."""
        return self.db.query(Commodity).filter(
            Commodity.name.ilike(f"%{query}%"),
        ).order_by(Commodity.name).limit(limit).all()

    def create(self, commodity_data: CommodityCreate) -> Commodity:
        """Create a new commodity."""
        # Check for duplicate name
        existing = self.get_by_name(commodity_data.name)
        if existing:
            raise ValueError(f"Commodity with name '{commodity_data.name}' already exists")

        try:
            commodity = Commodity(
                name=commodity_data.name,
                name_local=commodity_data.name_local,
                category=commodity_data.category,
                unit=commodity_data.unit,
            )
            self.db.add(commodity)
            self.db.commit()
            self.db.refresh(commodity)
            return commodity
        except Exception:
            self.db.rollback()
            raise

    def update(self, commodity_id: UUID, commodity_data: CommodityUpdate) -> Commodity | None:
        """Update an existing commodity."""
        commodity = self.get_by_id(commodity_id)
        if not commodity:
            return None

        update_data = commodity_data.model_dump(exclude_unset=True)

        if not update_data:
            return commodity

        # Check for duplicate name if name is being updated
        if "name" in update_data:
            existing = self.get_by_name(update_data["name"])
            if existing and existing.id != commodity_id:
                raise ValueError(f"Commodity with name '{update_data['name']}' already exists")

        try:
            for field, value in update_data.items():
                setattr(commodity, field, value)
            self.db.commit()
            self.db.refresh(commodity)
            return commodity
        except Exception:
            self.db.rollback()
            raise

    def delete(self, commodity_id: UUID) -> bool:
        """Delete a commodity."""
        commodity = self.get_by_id(commodity_id)
        if not commodity:
            return False

        try:
            self.db.delete(commodity)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            raise

    def count(self, category: str | None = None) -> int:
        """Count total commodities with optional category filter."""
        query = self.db.query(Commodity)
        if category:
            query = query.filter(Commodity.category == category)
        return query.count()
