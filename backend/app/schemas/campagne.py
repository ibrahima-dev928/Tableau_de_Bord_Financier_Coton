from pydantic import BaseModel
from datetime import date
from uuid import UUID
from typing import Optional

class CampagneBase(BaseModel):
    libelle: str
    date_debut: date
    date_fin: date
    objectif_tonnes: Optional[float] = None
    est_active: Optional[bool] = False

class CampagneCreate(CampagneBase):
    pass

class CampagneUpdate(BaseModel):
    libelle: Optional[str] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    objectif_tonnes: Optional[float] = None
    est_active: Optional[bool] = None

class CampagneResponse(CampagneBase):
    id: UUID
    est_active: bool

    class Config:
        from_attributes = True