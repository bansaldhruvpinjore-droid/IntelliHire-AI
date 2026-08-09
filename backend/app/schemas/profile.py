from pydantic import BaseModel


class ProfileUpdate(BaseModel):
    phone: str | None = None

class ProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    role: str
    is_active: bool