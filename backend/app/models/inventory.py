import uuid as uuid_module
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, ForeignKey, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


def utcnow() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[uuid_module.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid_module.uuid4,
    )

    user_id: Mapped[uuid_module.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    commodity_id: Mapped[uuid_module.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("commodities.id", ondelete="RESTRICT"),
        nullable=False,
    )

    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)  # kg, quintal, ton

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=text("NOW()"),
    )

    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=text("NOW()"),
        onupdate=utcnow,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", backref="inventory_items")
    commodity: Mapped["Commodity"] = relationship("Commodity")

    def __repr__(self) -> str:
        return f"<Inventory user={self.user_id} commodity={self.commodity_id} qty={self.quantity}{self.unit}>"
