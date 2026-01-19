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
    Text,
    Boolean,
    TIMESTAMP,
    CheckConstraint,
    Index,
    ForeignKey,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    post_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("community_posts.id", ondelete="SET NULL"),
        nullable=True,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=text("NOW()"),
    )

    read_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP,
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="notifications",
        passive_deletes=True,
    )

    post: Mapped["CommunityPost | None"] = relationship(
        "CommunityPost",
        back_populates="notifications",
        passive_deletes=True,
    )

    __table_args__ = (
        CheckConstraint(
            "(is_read = FALSE AND read_at IS NULL) OR "
            "(is_read = TRUE AND read_at IS NOT NULL)",
            name="check_read_at_consistency",
        ),
        Index(
            "idx_notifications_user_read_created",
            text("user_id"),
            text("is_read"),
            text("created_at DESC"),
        ),
        Index(
            "idx_notifications_user_created",
            text("user_id"),
            text("created_at DESC"),
        ),
        Index(
            "idx_notifications_post_id",
            text("post_id"),
            postgresql_where=text("post_id IS NOT NULL"),
        ),
    )

    def __repr__(self) -> str:
        return f"<Notification id={self.id} read={self.is_read}>"


__all__ = ["Notification"]
