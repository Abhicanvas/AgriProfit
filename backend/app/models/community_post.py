import uuid as uuid_module
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


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid_module.uuid4,
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    post_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    district: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_admin_override: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
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

    deleted_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP,
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="community_posts",
        passive_deletes=True,
    )

    notifications: Mapped[list["Notification"]] = relationship(
        "Notification",
        back_populates="post",
        passive_deletes=True,
    )

    __table_args__ = (
        CheckConstraint(
            "post_type IN ('normal', 'alert')",
            name="community_posts_post_type_check",
        ),
        Index(
            "idx_posts_district_created",
            text("district"),
            text("created_at DESC"),
        ),
        Index(
            "idx_posts_type_created",
            text("post_type"),
            text("created_at DESC"),
        ),
        Index(
            "idx_posts_user_created",
            text("user_id"),
            text("created_at DESC"),
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index(
            "idx_posts_active",
            text("created_at DESC"),
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    def __repr__(self) -> str:
        return f"<CommunityPost id={self.id} type={self.post_type}>"


__all__ = ["CommunityPost"]
