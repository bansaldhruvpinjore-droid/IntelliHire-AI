from pydantic import BaseModel
from typing import List


class ResumeAnalysisResponse(BaseModel):
    resume_id: int
    filename: str
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    skills: List[str] = []
    education: List[str] = []
    experience: List[str] = []