from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class PaiementBase(BaseModel):
    montant: Decimal
    reference: Optional[str] = None
    commentaire: Optional[str] = None

class PaiementCreate(PaiementBase):
    producteur_id: UUID

class PaiementResponse(PaiementBase):
    id: UUID
    producteur_id: UUID
    date_paiement: datetime
    saisi_par_id: UUID

    class Config:
        from_attributes = True