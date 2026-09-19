import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.resume import Resume
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.routes.auth import get_current_user
from app.services.resume_analyzer import analyze_resume


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"]
)


@router.post("/upload")
def upload_resume(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    upload_dir = Path("uploads/resumes")
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Resume file not found."
        )

    resume = Resume(
        user_id=current_user.id,
        filename=filename,
        file_path=str(file_path)
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


@router.get("/")
def get_my_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.id.desc())
        .all()
    )

    return resumes


@router.get("/{resume_id}/analysis")
def get_resume_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found."
        )

    if not resume.file_path:
        raise HTTPException(
            status_code=404,
            detail="Resume file path is not available."
        )

    file_path = Path(resume.file_path)

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Resume file not found."
        )

    try:
        analysis = analyze_resume(str(file_path))
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Resume analysis failed: {str(error)}"
        )

    return analysis


@router.get("/{resume_id}/file")
def view_resume_file(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Securely return a resume PDF to an authorized user.

    Candidates can access their own resumes.

    Recruiters can access a resume when that resume was
    submitted with an application to one of the recruiter's jobs.
    """

    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id)
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found."
        )

    # Candidate owns the resume.
    if resume.user_id == current_user.id:
        authorized = True

    else:
        # Recruiter authorization:
        # The resume must belong to an application for
        # a job owned by the current recruiter.
        authorized = (
            db.query(Application)
            .join(Job, Application.job_id == Job.id)
            .filter(
                Application.resume_id == resume_id,
                Job.recruiter_id == current_user.id
            )
            .first()
            is not None
        )

    if not authorized:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this resume."
        )

    if not resume.file_path:
        raise HTTPException(
            status_code=404,
            detail="Resume file path is not available."
        )

    file_path = Path(resume.file_path)

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Resume file not found."
        )

    if file_path.suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF resume files are supported."
        )

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=file_path.name
    )