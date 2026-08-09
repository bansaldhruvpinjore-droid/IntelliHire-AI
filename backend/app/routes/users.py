from fastapi import APIRouter, Depends

from ..models.user import User
from ..services.security import (
    get_current_user,
    require_role
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active
    }

@router.get("/recruiter-test")
def recruiter_test(
    current_user: User = Depends(
        require_role("recruiter")
    )
):
    return {
        "message": "Recruiter access granted",
        "user_id": current_user.id,
        "role": current_user.role
    }