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

    class Config:
        from_attributes = True