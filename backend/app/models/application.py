from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False
    )

    applicant_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    resume_id = Column(
        Integer,
        ForeignKey("resumes.id"),
        nullable=False
    )

    status = Column(
        String,
        default="applied",
        nullable=False
    )

    applied_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    job = relationship("Job")
    applicant = relationship("User")
    resume = relationship("Resume")