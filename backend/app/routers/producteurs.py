from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role

router = APIRouter()

@router.get("/", response_model=List[schemas.ProducteurResponse])
def get_producteurs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    producteurs = db.query(models.Producteur).offset(skip).limit(limit).all()
    return producteurs

@router.post("/", response_model=schemas.ProducteurResponse, status_code=status.HTTP_201_CREATED)
def create_producteur(
    producteur: schemas.ProducteurCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    db_prod = models.Producteur(**producteur.dict())
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    return db_prod

@router.put("/{producteur_id}", response_model=schemas.ProducteurResponse)
def update_producteur(
    producteur_id: str,
    producteur_update: schemas.ProducteurCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    prod = db.query(models.Producteur).filter(models.Producteur.id == producteur_id).first()
    if not prod:
        raise HTTPException(404, "Producteur non trouvé")
    for key, value in producteur_update.dict().items():
        setattr(prod, key, value)
    db.commit()
    db.refresh(prod)
    return prod

@router.delete("/{producteur_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_producteur(
    producteur_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    prod = db.query(models.Producteur).filter(models.Producteur.id == producteur_id).first()
    if not prod:
        raise HTTPException(404, "Producteur non trouvé")
    db.delete(prod)
    db.commit()