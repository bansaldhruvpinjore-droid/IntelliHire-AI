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


class JobMatchResponse(BaseModel):
    resume_id: int
    resume_filename: str

    job_id: int
    job_title: str
    company: str

    match_score: int

    matched_skills: list[str]
    missing_skills: list[str]

    recommendation: str