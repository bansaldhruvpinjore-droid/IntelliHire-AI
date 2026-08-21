from pydantic import BaseModel, Field
from typing import List


class ResumeAnalysisResponse(BaseModel):
    resume_id: int
    filename: str
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    skills: List[str] = Field(default_factory=list)
    education: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list)