from fastapi import FastAPI
from sqlalchemy import text

from .database import Base, engine
from .models.user import User
from .routes.auth import router as auth_router
from .routes.users import router as users_router


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="IntelliHire AI API",
    description="AI-powered intelligent recruitment platform",
    version="1.0.0"
)

app.include_router(auth_router)
app.include_router(users_router)

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