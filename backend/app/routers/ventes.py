from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role
from decimal import Decimal

router = APIRouter()

@router.post("/", response_model=schemas.VenteResponse, status_code=status.HTTP_201_CREATED)
def create_vente(
    vente: schemas.VenteCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Comptabilite"))
):
    campagne_active = db.query(models.Campagne).filter(models.Campagne.est_active == True).first()
    campagne_id = campagne_active.id if campagne_active else None
    
    montant_total = vente.quantite_kg * vente.prix_unitaire
    db_vente = models.Vente(
        **vente.dict(),
        montant_total=montant_total,
        saisi_par_id=current_user.id,
        campagne_id=campagne_id
    )
    db.add(db_vente)
    db.commit()
    db.refresh(db_vente)
    return db_vente

@router.get("/", response_model=List[schemas.VenteResponse])
def get_ventes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    ventes = db.query(models.Vente).offset(skip).limit(limit).all()
    return ventes

@router.get("/{vente_id}", response_model=schemas.VenteResponse)
def get_vente(
    vente_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    vente = db.query(models.Vente).filter(models.Vente.id == vente_id).first()
    if not vente:
        raise HTTPException(404, "Vente non trouvée")
    return vente

@router.put("/{vente_id}", response_model=schemas.VenteResponse)
def update_vente(
    vente_id: UUID,
    vente_data: schemas.VenteCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Comptabilite"))
):
    vente = db.query(models.Vente).filter(models.Vente.id == vente_id).first()
    if not vente:
        raise HTTPException(404, "Vente non trouvée")
    for key, value in vente_data.dict().items():
        setattr(vente, key, value)
    db.commit()
    db.refresh(vente)
    return vente

@router.delete("/{vente_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vente(
    vente_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Comptabilite"))
):
    vente = db.query(models.Vente).filter(models.Vente.id == vente_id).first()
    if not vente:
        raise HTTPException(404, "Vente non trouvée")
    db.delete(vente)
    db.commit()