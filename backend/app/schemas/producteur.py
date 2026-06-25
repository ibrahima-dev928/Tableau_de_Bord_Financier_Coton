from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class ProducteurBase(BaseModel):
    nom: str
    prenom: Optional[str] = None
    telephone: Optional[str] = None
    zone_id: UUID

class ProducteurCreate(ProducteurBase):
    pass

class ProducteurResponse(ProducteurBase):
    id: UUID
    zone_nom: Optional[str] = None

    class Config:
        from_attributes = True