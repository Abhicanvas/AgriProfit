import uuid
from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, DECIMAL,
    ForeignKey, Text, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base
from datetime import datetime
from uuid import UUID
from sqlalchemy import (
    String,
    TIMESTAMP,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base
class Commodity(Base):
    __tablename__ = "commodities"
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,  # This creates the unique index automatically
    )
    name_local: Mapped[str | None] = mapped_column(
        String(100),
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
    # No __table_args__ needed - unique constraint on name is sufficient
    def __repr__(self) -> str:
        return f"<Commodity id={self.id} name={self.name}>"
__all__ = ["Commodity"]