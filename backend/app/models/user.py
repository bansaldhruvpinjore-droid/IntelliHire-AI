from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(30),
        nullable=False,
        default="candidate"
    )

    is_active = Column(
        Boolean,
        default=True
    )
    phone = Column(String, nullable=True)
    resumes = relationship(
    "Resume",
    back_populates="user",
    cascade="all, delete-orphan"
    )