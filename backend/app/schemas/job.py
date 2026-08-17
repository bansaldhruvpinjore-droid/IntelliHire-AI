from pydantic import BaseModel
from typing import Optional


class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    experience: Optional[str] = None
    salary: Optional[str] = None
    description: str
    required_skills: Optional[str] = None


class JobResponse(BaseModel):
    id: int
    recruiter_id: int
    title: str
    company: str
    location: str
    experience: Optional[str] = None
    salary: Optional[str] = None
    description: str
    required_skills: Optional[str] = None

    class Config:
        from_attributes = True
        