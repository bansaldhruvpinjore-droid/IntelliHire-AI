from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.job import Job
from app.models.resume import Resume
from app.models.user import User
from app.schemas.job import (
    JobCreate,
    JobMatchResponse,
    JobRecommendationResponse,
    JobResponse,
)
from app.routes.auth import get_current_user
from app.services.job_matcher import calculate_match


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


@router.post("/", response_model=JobResponse)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can create jobs.",
        )

    job = Job(
        title=job_data.title,
        company=job_data.company,
        location=job_data.location,
        experience=job_data.experience,
        salary=job_data.salary,
        description=job_data.description,
        required_skills=job_data.required_skills,
        recruiter_id=current_user.id,
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


@router.get("/", response_model=list[JobResponse])
def get_jobs(
    db: Session = Depends(get_db),
):
    return (
        db.query(Job)
        .order_by(Job.id.desc())
        .all()
    )


@router.get("/search", response_model=list[JobResponse])
def search_jobs(
    query: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    jobs_query = db.query(Job)

    if query:
        search_text = f"%{query}%"

        jobs_query = jobs_query.filter(
            Job.title.ilike(search_text)
            | Job.company.ilike(search_text)
            | Job.description.ilike(search_text)
            | Job.required_skills.ilike(search_text)
        )

    if location:
        jobs_query = jobs_query.filter(
            Job.location.ilike(f"%{location}%")
        )

    return (
        jobs_query
        .order_by(Job.id.desc())
        .all()
    )


@router.get("/mine", response_model=list[JobResponse])
def get_my_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can access their jobs.",
        )

    return (
        db.query(Job)
        .filter(Job.recruiter_id == current_user.id)
        .order_by(Job.id.desc())
        .all()
    )


@router.get(
    "/{job_id}/match/{resume_id}",
    response_model=JobMatchResponse,
)
def match_resume_with_job(
    job_id: int,
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id)
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found.",
        )

    if resume.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only analyze your own resume.",
        )

    result = calculate_match(
        resume_text=resume.extracted_text or "",
        required_skills=job.required_skills or "",
    )

    return {
        "resume_id": resume.id,
        "resume_filename": resume.filename,
        "job_id": job.id,
        "job_title": job.title,
        "company": job.company,
        **result,
    }


@router.get(
    "/recommended/{resume_id}",
    response_model=list[JobRecommendationResponse],
)
def get_recommended_jobs(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id)
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found.",
        )

    if resume.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only get recommendations for your own resume.",
        )

    jobs = (
        db.query(Job)
        .order_by(Job.id.desc())
        .all()
    )

    recommendations = []

    for job in jobs:
        result = calculate_match(
            resume_text=resume.extracted_text or "",
            required_skills=job.required_skills or "",
        )

        recommendations.append(
            {
                "job_id": job.id,
                "job_title": job.title,
                "company": job.company,
                "location": job.location,
                "match_score": result["match_score"],
                "matched_skills": result["matched_skills"],
                "missing_skills": result["missing_skills"],
                "recommendation": result["recommendation"],
            }
        )

    recommendations.sort(
        key=lambda item: item["match_score"],
        reverse=True,
    )

    return recommendations