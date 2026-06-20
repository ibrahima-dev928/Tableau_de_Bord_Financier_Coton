from pydantic import BaseModel, computed_field
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional

class AchatBase(BaseModel):
    date_achat: datetime
    producteur_id: UUID
    zone_id: UUID
    quantite_kg: Decimal
    prix_kg: Decimal

class AchatCreate(AchatBase):
    pass

class AchatResponse(AchatBase):
    id: UUID
    montant_total: Decimal
    statut: str
    saisi_par_id: UUID
    producteur_nom: Optional[str] = None
    zone_nom: Optional[str] = None
    saisi_par_nom: Optional[str] = None
    # ...
    id: UUID
    montant_total: Decimal
    statut: str
    saisi_par_id: UUID

    @computed_field
    @property
    def montant_total_calcule(self) -> Decimal:
        return self.quantite_kg * self.prix_kg

    class Config:
        from_attributes = True