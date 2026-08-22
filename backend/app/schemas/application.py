from datetime import datetime

from pydantic import BaseModel


class ApplicationStatusUpdate(BaseModel):
    status: str


class ApplicationCreate(BaseModel):
    job_id: int
    resume_id: int


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    applicant_id: int
    resume_id: int
    status: str
    applied_at: datetime

    class Config:
        from_attributes = True


class RecruiterApplicationResponse(BaseModel):
    application_id: int
    applicant_id: int
    resume_id: int
    resume_filename: str

    status: str
    applied_at: datetime

    match_score: int
    matched_skills: list[str]
    missing_skills: list[str]
    recommendation: str
class MyApplicationResponse(BaseModel):
    application_id: int

    job_id: int
    job_title: str
    company: str
    location: str

    resume_id: int
    resume_filename: str

    status: str
    applied_at: datetime
class RecruiterDashboardResponse(BaseModel):
    total_jobs: int
    total_applications: int
    applied: int
    shortlisted: int
    interview: int
    selected: int
    rejected: int
class RecruiterMatchAnalyticsResponse(BaseModel):
    total_applications: int
    strong_matches: int
    good_matches: int
    partial_matches: int
    low_matches: int