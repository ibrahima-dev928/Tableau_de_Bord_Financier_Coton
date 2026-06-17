from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, List

# Définition de ZoneBase (manquante)
class ZoneBase(BaseModel):
    nom: str
    type: Optional[str] = None
    parent_id: Optional[UUID] = None

class ZoneCreate(ZoneBase):
    pass

class ZoneResponse(ZoneBase):
    id: UUID
    enfants: Optional[List['ZoneResponse']] = Field(default_factory=list)

    class Config:
        from_attributes = True

# Résoudre la référence circulaire
ZoneResponse.model_rebuild()