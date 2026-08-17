from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=False)

    experience = Column(String)
    salary = Column(String)

    description = Column(Text, nullable=False)
    required_skills = Column(Text)

    recruiter = relationship("User")