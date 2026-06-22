# app/routers/parametres.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role

router = APIRouter()

# ==================== HELPERS ====================

def get_or_create_campagne(db: Session, campagne_id: Optional[UUID] = None) -> models.Campagne:
    if campagne_id is not None:
        campagne = db.query(models.Campagne).filter(models.Campagne.id == campagne_id).first()
        if not campagne:
            raise HTTPException(status_code=404, detail="Campagne non trouvée")
        return campagne
    campagne = db.query(models.Campagne).filter(models.Campagne.est_active == True).first()
    if not campagne:
        raise HTTPException(status_code=404, detail="Aucune campagne active trouvée")
    return campagne


# ==================== AGRICULTURE ====================

@router.get("/previsions/agriculture", response_model=schemas.PrevisionAgricultureResponse)
def get_prevision_agriculture(
    campagne_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    campagne = get_or_create_campagne(db, campagne_id)
    prevision = db.query(models.PrevisionAgriculture).filter_by(campagne_id=campagne.id).first()
    if not prevision:
        return schemas.PrevisionAgricultureResponse(
            id=None,
            campagne_id=campagne.id,
            volume_prevu_tonnes=0,
            prix_plancher=0,
            seuil_alerte=0,
            delai_paiement_jours=30,
            created_at=datetime.now(),
            updated_at=None
        )
    return prevision


@router.put("/previsions/agriculture", response_model=schemas.PrevisionAgricultureResponse)
def update_prevision_agriculture(
    data: schemas.PrevisionAgricultureCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    campagne = get_or_create_campagne(db, data.campagne_id)
    prevision = db.query(models.PrevisionAgriculture).filter_by(campagne_id=campagne.id).first()
    if prevision:
        for key, value in data.dict().items():
            if key != 'campagne_id':
                setattr(prevision, key, value)
    else:
        prevision = models.PrevisionAgriculture(**data.dict())
        db.add(prevision)
    db.commit()
    db.refresh(prevision)
    return prevision


# ==================== ÉGRENAGE ====================

@router.get("/previsions/egrenage", response_model=schemas.PrevisionEgrenageResponse)
def get_prevision_egrenage(
    campagne_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    campagne = get_or_create_campagne(db, campagne_id)
    prevision = db.query(models.PrevisionEgrenage).filter_by(campagne_id=campagne.id).first()
    if not prevision:
        return schemas.PrevisionEgrenageResponse(
            id=None,
            campagne_id=campagne.id,
            coton_graine_prevu_tonnes=0,
            rendement_attendu_pourcent=41.2,
            cout_transformation_estime=0,
            created_at=datetime.now(),
            updated_at=None
        )
    return prevision


@router.put("/previsions/egrenage", response_model=schemas.PrevisionEgrenageResponse)
def update_prevision_egrenage(
    data: schemas.PrevisionEgrenageCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    campagne = get_or_create_campagne(db, data.campagne_id)
    prevision = db.query(models.PrevisionEgrenage).filter_by(campagne_id=campagne.id).first()
    if prevision:
        for key, value in data.dict().items():
            if key != 'campagne_id':
                setattr(prevision, key, value)
    else:
        prevision = models.PrevisionEgrenage(**data.dict())
        db.add(prevision)
    db.commit()
    db.refresh(prevision)
    return prevision


# ==================== VENTES ====================

@router.get("/previsions/ventes", response_model=List[schemas.PrevisionVenteResponse])
def get_previsions_ventes(
    campagne_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    campagne = get_or_create_campagne(db, campagne_id)
    previsions = db.query(models.PrevisionVente).filter_by(campagne_id=campagne.id).all()
    return previsions


@router.put("/previsions/ventes", response_model=List[schemas.PrevisionVenteResponse])
def update_previsions_ventes(
    data: List[schemas.PrevisionVenteCreate],
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    if not data:
        raise HTTPException(status_code=400, detail="Aucune donnée de vente fournie")
    campagne_id = data[0].campagne_id
    campagne = get_or_create_campagne(db, campagne_id)

    # Supprimer les anciennes prévisions
    db.query(models.PrevisionVente).filter_by(campagne_id=campagne.id).delete()

    # Créer les nouvelles
    new_previsions = [models.PrevisionVente(**item.dict()) for item in data]
    db.add_all(new_previsions)
    db.commit()

    result = db.query(models.PrevisionVente).filter_by(campagne_id=campagne.id).all()
    return result