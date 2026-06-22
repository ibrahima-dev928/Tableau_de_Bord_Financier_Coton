# app/schemas/prevision_vente.py
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from decimal import Decimal
from typing import Optional

class PrevisionVenteBase(BaseModel):
    campagne_id: UUID
    produit: str                      # 'fibre', 'graines', 'huile', 'tourteau'
    conditionnement: Optional[str] = None  # 'carton', 'sac', 'vrac'
    volume_prevu_tonnes: Decimal = Decimal(0)
    prix_vente_prevu: Decimal = Decimal(0)
    cout_logistique_estime: Decimal = Decimal(0)

class PrevisionVenteCreate(PrevisionVenteBase):
    pass

class PrevisionVenteResponse(PrevisionVenteBase):
    #id: UUID
    id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)