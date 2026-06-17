from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class TransformationBase(BaseModel):
    date: datetime
    usine_id: UUID
    qte_coton_graine_kg: Decimal
    qte_fibre_kg: Decimal
    qte_graine_kg: Decimal
    cout_transformation: Decimal

class TransformationCreate(TransformationBase):
    pass

class TransformationResponse(TransformationBase):
    id: UUID
    saisi_par_id: UUID

    class Config:
        from_attributes = True