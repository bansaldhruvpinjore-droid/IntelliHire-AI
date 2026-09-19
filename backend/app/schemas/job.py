from typing import List, Optional

from pydantic import BaseModel


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
    title: str
    company: str
    location: str
    experience: Optional[str] = None
    salary: Optional[str] = None
    description: str
    required_skills: Optional[str] = None
    recruiter_id: int

    class Config:
        from_attributes = True


class JobMatchResponse(BaseModel):
    resume_id: int
    resume_filename: str

    job_id: int
    job_title: str
    company: str

    match_score: int

    matched_skills: List[str]
    missing_skills: List[str]

    exact_matches: List[str]
    related_matches: List[str]

    exact_match_count: int
    related_match_count: int
    missing_match_count: int

    total_required_skills: int
    skill_coverage: int

    recommendation: str


class JobRecommendationResponse(BaseModel):
    job_id: int
    job_title: str
    company: str
    location: str
    match_score: int
    matched_skills: List[str]
    missing_skills: List[str]
    recommendation: str