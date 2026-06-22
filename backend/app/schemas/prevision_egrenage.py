from typing import Optional
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class PrevisionEgrenageBase(BaseModel):
    campagne_id: UUID
    coton_graine_prevu_tonnes: Decimal = Decimal(0)
    rendement_attendu_pourcent: Decimal = Decimal(41.2)
    cout_transformation_estime: Decimal = Decimal(0)

class PrevisionEgrenageCreate(PrevisionEgrenageBase):
    pass

class PrevisionEgrenageResponse(PrevisionEgrenageBase):
    id: Optional[UUID] = None          # ✅ Rendre facultatif
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)