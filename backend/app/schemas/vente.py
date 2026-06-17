from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class VenteBase(BaseModel):
    date: datetime
    type_vente: str   # Fibre, Graines, Huile, Tourteau
    quantite_kg: Decimal
    prix_unitaire: Decimal
    devise: str = "FCFA"
    couts_logistiques: Decimal = 0

class VenteCreate(VenteBase):
    pass

class VenteResponse(VenteBase):
    id: UUID
    montant_total: Decimal
    saisi_par_id: UUID

    class Config:
        from_attributes = True