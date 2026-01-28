from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models import Mandi
from app.mandi.schemas import MandiCreate, MandiUpdate


class MandiService:
    """Service class for Mandi operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, mandi_id: UUID) -> Mandi | None:
        """Get a mandi by ID."""
        return self.db.query(Mandi).filter(
            Mandi.id == mandi_id,
            Mandi.is_active == True,
        ).first()

    def get_by_market_code(self, market_code: str) -> Mandi | None:
        """Get a mandi by market code."""
        return self.db.query(Mandi).filter(
            Mandi.market_code == market_code.upper(),
            Mandi.is_active == True,
        ).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        state: str | None = None,
        district: str | None = None,
        is_active: bool | None = None,
        include_inactive: bool = False,
    ) -> list[Mandi]:
        """Get all mandis with optional filtering."""
        query = self.db.query(Mandi)

        # Handle is_active filter
        if is_active is not None:
            query = query.filter(Mandi.is_active == is_active)
        elif not include_inactive:
            query = query.filter(Mandi.is_active == True)

        if state:
            query = query.filter(Mandi.state == state)

        if district:
            query = query.filter(Mandi.district == district)

        return query.order_by(Mandi.name).offset(skip).limit(limit).all()

    def get_by_district(self, district: str) -> list[Mandi]:
        """Get all mandis in a specific district."""
        return self.db.query(Mandi).filter(
            Mandi.district == district.strip().title(),
            Mandi.is_active == True,
        ).order_by(Mandi.name).all()

    def create(self, mandi_data: MandiCreate) -> Mandi:
        """Create a new mandi."""
        try:
            mandi = Mandi(
                name=mandi_data.name,
                state=mandi_data.state,
                district=mandi_data.district,
                address=mandi_data.address,
                market_code=mandi_data.market_code,
                latitude=mandi_data.latitude,
                longitude=mandi_data.longitude,
                is_active=mandi_data.is_active,
            )
            self.db.add(mandi)
            self.db.commit()
            self.db.refresh(mandi)
            return mandi
        except IntegrityError:
            self.db.rollback()
            raise ValueError(f"Mandi with market code '{mandi_data.market_code}' already exists")
        except Exception:
            self.db.rollback()
            raise

    def update(self, mandi_id: UUID, mandi_data: MandiUpdate) -> Mandi | None:
        """Update an existing mandi."""
        mandi = self.db.query(Mandi).filter(Mandi.id == mandi_id).first()

        if not mandi:
            return None

        update_data = mandi_data.model_dump(exclude_unset=True)

        if not update_data:
            return mandi

        try:
            for field, value in update_data.items():
                setattr(mandi, field, value)

            self.db.commit()
            self.db.refresh(mandi)
            return mandi
        except IntegrityError:
            self.db.rollback()
            code = update_data.get("market_code", "unknown")
            raise ValueError(f"Mandi with market code '{code}' already exists")
        except Exception:
            self.db.rollback()
            raise

    def delete(self, mandi_id: UUID) -> bool:
        """Soft delete a mandi by setting is_active=False."""
        mandi = self.db.query(Mandi).filter(Mandi.id == mandi_id).first()

        if not mandi:
            return False

        try:
            mandi.is_active = False
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            raise

    def restore(self, mandi_id: UUID) -> Mandi | None:
        """Restore a soft-deleted mandi."""
        mandi = self.db.query(Mandi).filter(
            Mandi.id == mandi_id,
            Mandi.is_active == False,
        ).first()

        if not mandi:
            return None

        try:
            mandi.is_active = True
            self.db.commit()
            self.db.refresh(mandi)
            return mandi
        except Exception:
            self.db.rollback()
            raise

    def count(
        self,
        state: str | None = None,
        district: str | None = None,
        include_inactive: bool = False,
    ) -> int:
        """Count mandis with optional filtering."""
        query = self.db.query(Mandi)

        if not include_inactive:
            query = query.filter(Mandi.is_active == True)

        if state:
            query = query.filter(Mandi.state == state)

        if district:
            query = query.filter(Mandi.district == district)

        return query.count()

    def search(self, query: str, limit: int = 10) -> list[Mandi]:
        """Search mandis by name or market code."""
        search_term = f"%{query.strip()}%"
        return self.db.query(Mandi).filter(
            Mandi.is_active == True,
            (Mandi.name.ilike(search_term) | Mandi.market_code.ilike(search_term)),
        ).order_by(Mandi.name).limit(limit).all()