import uuid as uuid_module
from datetime import datetime
from uuid import UUID
from sqlalchemy import String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Commodity(Base):
    __tablename__ = "commodities"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid_module.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
    )

    name_local: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    category: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    unit: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
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

    # 🔥 REQUIRED RELATIONSHIPS 🔥
    price_history: Mapped[list["PriceHistory"]] = relationship(
        "PriceHistory",
        back_populates="commodity",
        cascade="all, delete-orphan",
    )

    price_forecasts: Mapped[list["PriceForecast"]] = relationship(
        "PriceForecast",
        back_populates="commodity",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Commodity id={self.id} name={self.name}>"
