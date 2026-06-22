from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role

router = APIRouter()

# GET /api/campagnes  -> liste toutes les campagnes
@router.get("/", response_model=List[schemas.CampagneResponse])
def get_campagnes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    campagnes = db.query(models.Campagne).order_by(models.Campagne.date_debut.desc()).all()
    return campagnes

# GET /api/campagnes/{id} -> détail d'une campagne
@router.get("/{campagne_id}", response_model=schemas.CampagneResponse)
def get_campagne(
    campagne_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    campagne = db.query(models.Campagne).filter(models.Campagne.id == campagne_id).first()
    if not campagne:
        raise HTTPException(404, "Campagne non trouvée")
    return campagne

# PUT /api/campagnes/{id} -> met à jour libelle, date_debut, date_fin
@router.put("/{campagne_id}", response_model=schemas.CampagneResponse)
def update_campagne(
    campagne_id: UUID,
    campagne_data: schemas.CampagneUpdate,  # schéma Pydantic à créer
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    campagne = db.query(models.Campagne).filter(models.Campagne.id == campagne_id).first()
    if not campagne:
        raise HTTPException(404, "Campagne non trouvée")
    for key, value in campagne_data.dict(exclude_unset=True).items():
        setattr(campagne, key, value)
    db.commit()
    db.refresh(campagne)
    return campagne