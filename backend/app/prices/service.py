from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models import PriceHistory
from app.prices.schemas import PriceHistoryCreate, PriceHistoryUpdate


class PriceHistoryService:
    """Service class for PriceHistory operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, price_data: PriceHistoryCreate) -> PriceHistory:
        """Create a new price history record."""
        try:
            price = PriceHistory(
                commodity_id=price_data.commodity_id,
                mandi_id=price_data.mandi_id,
                price_date=price_data.price_date,
                min_price=price_data.min_price,
                max_price=price_data.max_price,
                modal_price=price_data.modal_price,
            )
            self.db.add(price)
            self.db.commit()
            self.db.refresh(price)
            return price
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Price record for this commodity, mandi, and date already exists")
        except Exception:
            self.db.rollback()
            raise

    def get_by_id(self, price_id: UUID) -> PriceHistory | None:
        """Get a single price history record by ID."""
        return self.db.query(PriceHistory).filter(PriceHistory.id == price_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        commodity_id: UUID | None = None,
        mandi_id: UUID | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> list[PriceHistory]:
        """Get price history records with optional filtering."""
        query = self.db.query(PriceHistory)

        if commodity_id:
            query = query.filter(PriceHistory.commodity_id == commodity_id)

        if mandi_id:
            query = query.filter(PriceHistory.mandi_id == mandi_id)

        if start_date:
            query = query.filter(PriceHistory.price_date >= start_date)

        if end_date:
            query = query.filter(PriceHistory.price_date <= end_date)

        return query.order_by(PriceHistory.price_date.desc()).offset(skip).limit(limit).all()

    def get_latest(self, commodity_id: UUID, mandi_id: UUID) -> PriceHistory | None:
        """Get the latest price record for a commodity at a mandi."""
        return self.db.query(PriceHistory).filter(
            PriceHistory.commodity_id == commodity_id,
            PriceHistory.mandi_id == mandi_id,
        ).order_by(PriceHistory.price_date.desc()).first()

    def get_by_commodity(
        self,
        commodity_id: UUID,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = 100,
    ) -> list[PriceHistory]:
        """Get all price records for a specific commodity."""
        query = self.db.query(PriceHistory).filter(PriceHistory.commodity_id == commodity_id)

        if start_date:
            query = query.filter(PriceHistory.price_date >= start_date)

        if end_date:
            query = query.filter(PriceHistory.price_date <= end_date)

        return query.order_by(PriceHistory.price_date.desc()).limit(limit).all()

    def get_by_mandi(
        self,
        mandi_id: UUID,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = 100,
    ) -> list[PriceHistory]:
        """Get all price records for a specific mandi."""
        query = self.db.query(PriceHistory).filter(PriceHistory.mandi_id == mandi_id)

        if start_date:
            query = query.filter(PriceHistory.price_date >= start_date)

        if end_date:
            query = query.filter(PriceHistory.price_date <= end_date)

        return query.order_by(PriceHistory.price_date.desc()).limit(limit).all()

    def get_on_date(
        self,
        commodity_id: UUID,
        mandi_id: UUID,
        price_date: date,
    ) -> PriceHistory | None:
        """Get price record for a specific commodity, mandi, and date."""
        return self.db.query(PriceHistory).filter(
            PriceHistory.commodity_id == commodity_id,
            PriceHistory.mandi_id == mandi_id,
            PriceHistory.price_date == price_date,
        ).first()

    def update(self, price_id: UUID, price_data: PriceHistoryUpdate) -> PriceHistory | None:
        """Update an existing price history record."""
        price = self.db.query(PriceHistory).filter(PriceHistory.id == price_id).first()

        if not price:
            return None

        update_data = price_data.model_dump(exclude_unset=True)

        if not update_data:
            return price

        try:
            for field, value in update_data.items():
                setattr(price, field, value)

            self.db.commit()
            self.db.refresh(price)
            return price
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Price record for this commodity, mandi, and date already exists")
        except Exception:
            self.db.rollback()
            raise

    def delete(self, price_id: UUID) -> bool:
        """Hard delete a price history record."""
        price = self.db.query(PriceHistory).filter(PriceHistory.id == price_id).first()

        if not price:
            return False

        try:
            self.db.delete(price)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            raise

    def count(
        self,
        commodity_id: UUID | None = None,
        mandi_id: UUID | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> int:
        """Count price history records with optional filtering."""
        query = self.db.query(PriceHistory)

        if commodity_id:
            query = query.filter(PriceHistory.commodity_id == commodity_id)

        if mandi_id:
            query = query.filter(PriceHistory.mandi_id == mandi_id)

        if start_date:
            query = query.filter(PriceHistory.price_date >= start_date)

        if end_date:
            query = query.filter(PriceHistory.price_date <= end_date)

        return query.count()