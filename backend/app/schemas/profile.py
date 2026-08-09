from pydantic import BaseModel


class ProfileUpdate(BaseModel):
    phone: str | None = None