from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from typing import Optional
from datetime import datetime

# ====================================================
# 1. BASES (classes mères)
# ====================================================

class PrevisionAgricultureBase(BaseModel):
    volume_prevu_tonnes: Decimal
    prix_plancher: Decimal
    seuil_alerte: Decimal
    delai_paiement_jours: int

class PrevisionEgrenageBase(BaseModel):
    coton_graine_prevu_tonnes: Decimal
    rendement_attendu_pourcent: Decimal
    cout_transformation_estime: Decimal

class PrevisionVenteBase(BaseModel):
    produit: str
    volume_prevu_tonnes: Decimal
    prix_vente_prevu: Decimal
    cout_logistique_estime: Decimal

# ====================================================
# 2. SCHÉMAS DE CRÉATION (avec campagne_id)
# ====================================================

class PrevisionAgricultureCreate(PrevisionAgricultureBase):
    campagne_id: UUID

class PrevisionEgrenageCreate(PrevisionEgrenageBase):
    campagne_id: UUID

class PrevisionVenteCreate(PrevisionVenteBase):
    campagne_id: UUID

# ====================================================
# 3. SCHÉMAS DE RÉPONSE (id et timestamps optionnels)
# ====================================================

class PrevisionAgricultureResponse(PrevisionAgricultureBase):
    id: Optional[UUID] = None
    campagne_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PrevisionEgrenageResponse(PrevisionEgrenageBase):
    id: Optional[UUID] = None
    campagne_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PrevisionVenteResponse(PrevisionVenteBase):
    id: Optional[UUID] = None
    campagne_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True