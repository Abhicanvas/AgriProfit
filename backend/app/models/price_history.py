import uuid
from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, DECIMAL,
    ForeignKey, Text, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    Date,
    String,
    Text,
    Numeric,
    TIMESTAMP,
    CheckConstraint,
    Index,
    ForeignKey,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )

    commodity_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("commodities.id", ondelete="CASCADE"),
        nullable=False,
    )

    mandi_name: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    price_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    unit: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=text("NOW()"),
    )

    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=text("NOW()"),
    )

    commodity: Mapped["Commodity"] = relationship(
        "Commodity",
        back_populates="price_history",
        passive_deletes=True,
    )

    __table_args__ = (
        CheckConstraint(
            "price >= 0",
            name="check_price_non_negative",
        ),
        Index(
            "price_history_commodity_id_mandi_name_price_date_key",
            "commodity_id",
            "mandi_name",
            "price_date",
            unique=True,
        ),
        Index(
            "idx_price_history_main",
            text("commodity_id"),
            text("mandi_name"),
            text("price_date DESC"),
        ),
        Index(
            "idx_price_history_date",
            text("price_date DESC"),
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<PriceHistory commodity={self.commodity_id} "
            f"mandi={self.mandi_name} date={self.price_date} price={self.price}>"
        )


__all__ = ["PriceHistory"]
