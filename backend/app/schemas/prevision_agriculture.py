from typing import Optional
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class PrevisionAgricultureBase(BaseModel):
    campagne_id: UUID
    volume_prevu_tonnes: Decimal = Decimal(0)
    prix_plancher: Decimal = Decimal(0)
    seuil_alerte: Decimal = Decimal(0)
    delai_paiement_jours: int = 30

class PrevisionAgricultureCreate(PrevisionAgricultureBase):
    pass

class PrevisionAgricultureResponse(PrevisionAgricultureBase):
    id: Optional[UUID] = None  # ✅ Rendre le champ facultatif
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)