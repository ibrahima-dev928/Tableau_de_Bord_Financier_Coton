from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role

router = APIRouter()

@router.post("/", response_model=schemas.PaiementResponse, status_code=201)
def create_paiement(
    paiement: schemas.PaiementCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Comptabilite"))
):
    db_paiement = models.Paiement(
        **paiement.dict(),
        saisi_par_id=current_user.id
    )
    db.add(db_paiement)
    db.commit()
    db.refresh(db_paiement)
    return db_paiement

@router.get("/producteur/{producteur_id}", response_model=List[schemas.PaiementResponse])
def get_paiements_producteur(
    producteur_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    paiements = db.query(models.Paiement).filter(models.Paiement.producteur_id == producteur_id).order_by(models.Paiement.date_paiement.desc()).all()
    return paiements

@router.get("/solde/{producteur_id}")
def get_solde_producteur(
    producteur_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    total_paye = db.query(func.sum(models.Paiement.montant)).filter(models.Paiement.producteur_id == producteur_id).scalar() or 0
    total_achats = db.query(func.sum(models.Achat.montant_total)).filter(
        models.Achat.producteur_id == producteur_id,
        models.Achat.statut == 'valide'
    ).scalar() or 0
    return {"total_paye": float(total_paye), "total_achats": float(total_achats), "solde": float(total_achats - total_paye)}