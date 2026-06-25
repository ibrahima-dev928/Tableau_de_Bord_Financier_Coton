from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from decimal import Decimal

class UsineBase(BaseModel):
    nom: str
    zone_id: UUID
    capacite_kg_jour: Optional[Decimal] = None

class UsineCreate(UsineBase):
    pass

class UsineResponse(UsineBase):
    id: UUID
    zone_nom: Optional[str] = None 

    class Config:
        from_attributes = True