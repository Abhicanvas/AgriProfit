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
    ForeignKey,
    Index,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
class AdminAction(Base):
    __tablename__ = "admin_actions"
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    admin_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    action_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    action_metadata: Mapped[dict[str, object] | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=text("NOW()"),
    )
    admin: Mapped["User"] = relationship(
        "User",
        back_populates="admin_actions",
        passive_deletes=True,  # ✅ Required for ON DELETE RESTRICT
    )
    __table_args__ = (
        Index(
            "idx_admin_actions_admin_created",
            text("admin_id"),
            text("created_at DESC"),
        ),
        Index(
            "idx_admin_actions_type_created",
            text("action_type"),
            text("created_at DESC"),
        ),
        Index(
            "idx_admin_actions_metadata",
            text("action_metadata"),
            postgresql_using="gin",
        ),
    )
    def __repr__(self) -> str:
        return f"<AdminAction id={self.id} type={self.action_type}>"
__all__ = ["AdminAction"]