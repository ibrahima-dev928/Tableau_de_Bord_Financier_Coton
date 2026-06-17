from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class UserBase(BaseModel):
    nom: str
    email: str
    role: str
    zone_id: Optional[UUID] = None
    actif: bool = True

class UserCreate(UserBase):
    mot_de_passe: str

class UserResponse(UserBase):
    id: UUID

    class Config:
        from_attributes = True