from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.job import Job
from ..models.user import User
from ..schemas.job import JobCreate, JobResponse
from ..services.security import get_current_user, require_role


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
@router.get("/", response_model=list[JobResponse])
def get_jobs(
    db: Session = Depends(get_db)
):
    jobs = (
        db.query(Job)
        .order_by(Job.id.desc())
        .all()
    )

    return jobs