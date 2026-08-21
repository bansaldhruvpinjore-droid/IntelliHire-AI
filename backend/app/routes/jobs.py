from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.job import Job
from ..models.resume import Resume
from ..models.user import User
from ..schemas.job import JobCreate, JobResponse, JobMatchResponse
from ..services.security import get_current_user, require_role
from ..services.job_matcher import calculate_match


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


@router.post(
    "/",
    response_model=JobResponse,
    dependencies=[Depends(require_role("recruiter"))]
)
def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = Job(
        recruiter_id=current_user.id,
        title=job_data.title,
        company=job_data.company,
        location=job_data.location,
        experience=job_data.experience,
        salary=job_data.salary,
        description=job_data.description,
        required_skills=job_data.required_skills
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


@router.get(
    "/",
    response_model=list[JobResponse]
)
def get_jobs(
    db: Session = Depends(get_db)
):
    jobs = (
        db.query(Job)
        .order_by(Job.id.desc())
        .all()
    )

    return jobs


@router.get(
    "/{job_id}/match/{resume_id}",
    response_model=JobMatchResponse
)
def match_resume_to_job(
    job_id: int,
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find the job
    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # Find the resume belonging to the current user
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    # Make sure resume text exists
    if not resume.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Resume text has not been extracted"
        )

    # Calculate match
    result = calculate_match(
        resume.extracted_text,
        job.required_skills or ""
    )

    # Generate recommendation
    score = result["match_score"]

    if score >= 80:
        recommendation = "Strong Match"
    elif score >= 60:
        recommendation = "Good Match"
    elif score >= 40:
        recommendation = "Partial Match"
    else:
        recommendation = "Low Match"

    return {
        "resume_id": resume.id,
        "resume_filename": resume.filename,
        "job_id": job.id,
        "job_title": job.title,
        "company": job.company,
        "match_score": score,
        "matched_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"],
        "recommendation": recommendation
    }