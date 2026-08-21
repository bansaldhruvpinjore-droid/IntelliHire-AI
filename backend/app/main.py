from fastapi import FastAPI
from sqlalchemy import text
from app.routes import resumes

from .database import Base, engine
from .models.user import User
from .routes.auth import router as auth_router
from .routes.users import router as users_router
from app.routes import jobs
from app.routes.applications import router as applications_router

# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="IntelliHire AI API",
    description="AI-powered intelligent recruitment platform",
    version="1.0.0"
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(applications_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to IntelliHire AI",
        "status": "running"
    }


@app.get("/health/db")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "status": "healthy"
        }

    except Exception as e:
        return {
            "database": "disconnected",
            "status": "error",
            "message": str(e)
        }
class RecruiterDashboardResponse(BaseModel):
    total_jobs: int
    total_applications: int
    applied: int
    shortlisted: int
    interview: int
    selected: int
    rejected: int