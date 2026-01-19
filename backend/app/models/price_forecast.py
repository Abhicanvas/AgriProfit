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
class PriceForecast(Base):
    __tablename__ = "price_forecasts"
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
    forecast_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    forecasted_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    confidence_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
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
        back_populates="price_forecasts",
    )
    __table_args__ = (
        CheckConstraint(
            "forecasted_price >= 0",
            name="price_forecasts_forecasted_price_check",
        ),
        CheckConstraint(
            "confidence_score BETWEEN 0 AND 100",
            name="price_forecasts_confidence_score_check",
        ),
        Index(
            "price_forecasts_commodity_id_mandi_name_forecast_date_key",
            "commodity_id",
            "mandi_name",
            "forecast_date",
            unique=True,
        ),
        Index(
            "idx_price_forecasts_main",
            text("commodity_id"),
            text("mandi_name"),
            text("forecast_date DESC"),
        ),
        Index(
            "idx_price_forecasts_date",
            text("forecast_date"),
        ),
    )
    def __repr__(self) -> str:
        return (
            f"<PriceForecast commodity={self.commodity_id} "
            f"mandi={self.mandi_name} date={self.forecast_date} "
            f"price={self.forecasted_price} confidence={self.confidence_score}>"
        )
__all__ = ["PriceForecast"]