from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role

router = APIRouter()

@router.post("/", response_model=schemas.VenteResponse, status_code=201)
def create_vente(
    vente: schemas.VenteCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Comptabilite"))
):
    montant_total = vente.quantite_kg * vente.prix_unitaire
    db_vente = models.Vente(**vente.dict(), montant_total=montant_total, saisi_par_id=current_user.id)
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
    # Direction voit tout, comptabilité voit tout, terrain ne voit rien (ou on peut filtrer)
    query = db.query(models.Vente)
    return query.offset(skip).limit(limit).all()