from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import Application
from app.models.job import Job
from app.models.resume import Resume
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate,
    RecruiterApplicationResponse,
    MyApplicationResponse,
    RecruiterDashboardResponse
)
from app.services.job_matcher import calculate_match
from app.services.security import get_current_user


router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)


@router.post(
    "/",
    response_model=ApplicationResponse
)
def apply_to_job(
    application: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    job = (
        db.query(Job)
        .filter(Job.id == application.job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == application.resume_id,
            Resume.user_id == current_user.id
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    existing_application = (
        db.query(Application)
        .filter(
            Application.job_id == application.job_id,
            Application.applicant_id == current_user.id
        )
        .first()
    )

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this job"
        )

    new_application = Application(
        job_id=application.job_id,
        applicant_id=current_user.id,
        resume_id=application.resume_id
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return new_application
@router.get(
    "/job/{job_id}",
    response_model=list[RecruiterApplicationResponse]
)
def get_job_applications(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.recruiter_id == current_user.id
        )
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found or you are not the recruiter of this job"
        )

    applications = (
        db.query(Application)
        .filter(Application.job_id == job_id)
        .order_by(Application.id.desc())
        .all()
    )

    results = []

    for application in applications:
        resume = application.resume

        if not resume or not resume.extracted_text:
            results.append({
                "application_id": application.id,
                "applicant_id": application.applicant_id,
                "resume_id": application.resume_id,
                "resume_filename": resume.filename if resume else "Unknown",
                "status": application.status,
                "applied_at": application.applied_at,
                "match_score": 0,
                "matched_skills": [],
                "missing_skills": [],
                "recommendation": "Resume text unavailable"
            })
            continue

        match_result = calculate_match(
            resume.extracted_text,
            job.required_skills or ""
        )

        score = match_result["match_score"]

        if score >= 80:
            recommendation = "Strong Match"
        elif score >= 60:
            recommendation = "Good Match"
        elif score >= 40:
            recommendation = "Partial Match"
        else:
            recommendation = "Low Match"

        results.append({
            "application_id": application.id,
            "applicant_id": application.applicant_id,
            "resume_id": application.resume_id,
            "resume_filename": resume.filename,
            "status": application.status,
            "applied_at": application.applied_at,
            "match_score": score,
            "matched_skills": match_result["matched_skills"],
            "missing_skills": match_result["missing_skills"],
            "recommendation": recommendation
        })

    results.sort(
        key=lambda application: application["match_score"],
        reverse=True
    )

    return results
@router.get(
    "/my",
    response_model=list[MyApplicationResponse]
)
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    applications = (
        db.query(Application)
        .filter(
            Application.applicant_id == current_user.id
        )
        .order_by(Application.id.desc())
        .all()
    )

    results = []

    for application in applications:
        job = application.job
        resume = application.resume

        results.append({
            "application_id": application.id,

            "job_id": application.job_id,
            "job_title": job.title,
            "company": job.company,
            "location": job.location,

            "resume_id": application.resume_id,
            "resume_filename": resume.filename,

            "status": application.status,
            "applied_at": application.applied_at
        })

    return results
@router.patch(
    "/{application_id}/status",
    response_model=ApplicationResponse
)
def update_application_status(
    application_id: int,
    status_data: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = (
        db.query(Application)
        .filter(Application.id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    job = (
        db.query(Job)
        .filter(
            Job.id == application.job_id,
            Job.recruiter_id == current_user.id
        )
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to update this application"
        )

    allowed_statuses = {
        "applied",
        "shortlisted",
        "interview",
        "selected",
        "rejected"
    }

    if status_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid application status"
        )

    application.status = status_data.status

    db.commit()
    db.refresh(application)

    return application
@router.get(
    "/dashboard",
    response_model=RecruiterDashboardResponse
)
def get_recruiter_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    jobs = (
        db.query(Job)
        .filter(Job.recruiter_id == current_user.id)
        .all()
    )

    job_ids = [job.id for job in jobs]

    if not job_ids:
        return {
            "total_jobs": 0,
            "total_applications": 0,
            "applied": 0,
            "shortlisted": 0,
            "interview": 0,
            "selected": 0,
            "rejected": 0
        }

    applications = (
        db.query(Application)
        .filter(Application.job_id.in_(job_ids))
        .all()
    )

    status_counts = {
        "applied": 0,
        "shortlisted": 0,
        "interview": 0,
        "selected": 0,
        "rejected": 0
    }

    for application in applications:
        if application.status in status_counts:
            status_counts[application.status] += 1

    return {
        "total_jobs": len(jobs),
        "total_applications": len(applications),
        "applied": status_counts["applied"],
        "shortlisted": status_counts["shortlisted"],
        "interview": status_counts["interview"],
        "selected": status_counts["selected"],
        "rejected": status_counts["rejected"]
    }
