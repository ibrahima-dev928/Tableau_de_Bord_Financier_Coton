from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role

router = APIRouter()

# --- Agriculture ---
@router.get("/previsions/agriculture", response_model=schemas.PrevisionAgricultureResponse)
def get_prevision_agriculture(
    campagne_id: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    if not campagne_id:
        campagne = db.query(models.Campagne).filter(models.Campagne.est_active == True).first()
        if not campagne:
            raise HTTPException(404, "Aucune campagne active")
        campagne_id = campagne.id
    prevision = db.query(models.PrevisionAgriculture).filter_by(campagne_id=campagne_id).first()
    if not prevision:
        # Retourner des valeurs par défaut ou créer une prévision vide
        return {
            "id": None,
            "campagne_id": campagne_id,
            "volume_prevu_tonnes": 0,
            "prix_plancher": 0,
            "seuil_alerte": 0,
            "delai_paiement_jours": 0,
            "created_at": "",
            "updated_at": None
        }
    return prevision

@router.put("/previsions/agriculture", response_model=schemas.PrevisionAgricultureResponse)
def update_prevision_agriculture(
    data: schemas.PrevisionAgricultureCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    prevision = db.query(models.PrevisionAgriculture).filter_by(campagne_id=data.campagne_id).first()
    if prevision:
        for key, value in data.dict().items():
            setattr(prevision, key, value)
    else:
        prevision = models.PrevisionAgriculture(**data.dict())
        db.add(prevision)
    db.commit()
    db.refresh(prevision)
    return prevision

# Même logique pour égrenage et ventes...