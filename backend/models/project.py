from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(
        Enum("active", "completed", "archived", name="project_status"),
        default="active",
        nullable=False,
    )

    priority: Mapped[str] = mapped_column(
        Enum("low", "medium", "high", "urgent", name="project_priority"),
        default="medium",
        nullable=False,
    )

    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    color: Mapped[str] = mapped_column(String(7), default="#6366f1", nullable=False)

    icon: Mapped[str] = mapped_column(String(10), default="📁", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
