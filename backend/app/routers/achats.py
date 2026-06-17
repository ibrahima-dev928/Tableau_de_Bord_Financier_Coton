from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role
from decimal import Decimal

router = APIRouter()

@router.post("/", response_model=schemas.AchatResponse, status_code=status.HTTP_201_CREATED)
def create_achat(
    achat: schemas.AchatCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Responsable_terrain"))
):
    # Vérifier que l'utilisateur a le droit sur cette zone (optionnel)
    if current_user.zone_id and current_user.zone_id != achat.zone_id:
        raise HTTPException(403, "Vous ne pouvez saisir que dans votre zone")
    
    montant_total = achat.quantite_kg * achat.prix_kg
    db_achat = models.Achat(
        **achat.dict(),
        montant_total=montant_total,
        saisi_par_id=current_user.id,
        statut="en_attente"
    )
    db.add(db_achat)
    db.commit()
    db.refresh(db_achat)
    return db_achat

@router.get("/", response_model=List[schemas.AchatResponse])
def get_achats(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(models.Achat)
    # Restriction selon rôle
    if current_user.role == "Responsable_terrain":
        query = query.filter(models.Achat.zone_id == current_user.zone_id)
    achats = query.offset(skip).limit(limit).all()
    return achats

@router.get("/{achat_id}", response_model=schemas.AchatResponse)
def get_achat(
    achat_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    achat = db.query(models.Achat).filter(models.Achat.id == achat_id).first()
    if not achat:
        raise HTTPException(404, "Achat non trouvé")
    if current_user.role == "Responsable_terrain" and achat.zone_id != current_user.zone_id:
        raise HTTPException(403, "Accès non autorisé")
    return achat

@router.put("/{achat_id}/valider", response_model=schemas.AchatResponse)
def valider_achat(
    achat_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Comptabilite"))
):
    achat = db.query(models.Achat).filter(models.Achat.id == achat_id).first()
    if not achat:
        raise HTTPException(404, "Achat non trouvé")
    achat.statut = "valide"
    db.commit()
    db.refresh(achat)
    return achat