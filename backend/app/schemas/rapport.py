from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date

class RapportBase(BaseModel):
    type: str   # KPIMensuel, BilanCampagne, EtatAchats, ReleveEpargne
    periode_debut: date
    periode_fin: date
    format: str = "PDF"

class RapportCreate(RapportBase):
    pass

class RapportResponse(RapportBase):
    id: UUID
    fichier_path: str
    genere_par_id: UUID
    genere_le: datetime

    class Config:
        from_attributes = True