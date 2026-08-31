from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    application_id = Column(
        Integer,
        ForeignKey("applications.id"),
        nullable=False
    )

    old_status = Column(
        String(30),
        nullable=True
    )

    new_status = Column(
        String(30),
        nullable=False
    )

    changed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    changed_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )