# app/routers/producteurs.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role

router = APIRouter()

@router.post("/", response_model=schemas.ProducteurResponse, status_code=status.HTTP_201_CREATED)
def create_producteur(
    producteur: schemas.ProducteurCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    db_producteur = models.Producteur(**producteur.dict())
    db.add(db_producteur)
    db.commit()
    db.refresh(db_producteur)
    zone = db.query(models.Zone).filter(models.Zone.id == db_producteur.zone_id).first()
    zone_nom = zone.nom if zone else None
    return {
        "id": db_producteur.id,
        "nom": db_producteur.nom,
        "prenom": db_producteur.prenom,
        "telephone": db_producteur.telephone,
        "zone_id": db_producteur.zone_id,
        "zone_nom": zone_nom
    }

@router.get("/", response_model=List[schemas.ProducteurResponse])
def get_producteurs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    producteurs = db.query(models.Producteur).join(models.Zone, models.Producteur.zone_id == models.Zone.id).offset(skip).limit(limit).all()
    result = []
    for p in producteurs:
        zone_nom = p.zone.nom if p.zone else None
        result.append({
            "id": p.id,
            "nom": p.nom,
            "prenom": p.prenom,
            "telephone": p.telephone,
            "zone_id": p.zone_id,
            "zone_nom": zone_nom
        })
    return result

@router.get("/{producteur_id}", response_model=schemas.ProducteurResponse)
def get_producteur(
    producteur_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    producteur = db.query(models.Producteur).filter(models.Producteur.id == producteur_id).first()
    if not producteur:
        raise HTTPException(404, "Producteur non trouvé")
    zone = db.query(models.Zone).filter(models.Zone.id == producteur.zone_id).first()
    zone_nom = zone.nom if zone else None
    return {
        "id": producteur.id,
        "nom": producteur.nom,
        "prenom": producteur.prenom,
        "telephone": producteur.telephone,
        "zone_id": producteur.zone_id,
        "zone_nom": zone_nom
    }

@router.put("/{producteur_id}", response_model=schemas.ProducteurResponse)
def update_producteur(
    producteur_id: UUID,
    producteur_data: schemas.ProducteurCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    producteur = db.query(models.Producteur).filter(models.Producteur.id == producteur_id).first()
    if not producteur:
        raise HTTPException(404, "Producteur non trouvé")
    for key, value in producteur_data.dict().items():
        setattr(producteur, key, value)
    db.commit()
    db.refresh(producteur)
    zone = db.query(models.Zone).filter(models.Zone.id == producteur.zone_id).first()
    zone_nom = zone.nom if zone else None
    return {
        "id": producteur.id,
        "nom": producteur.nom,
        "prenom": producteur.prenom,
        "telephone": producteur.telephone,
        "zone_id": producteur.zone_id,
        "zone_nom": zone_nom
    }

@router.delete("/{producteur_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_producteur(
    producteur_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    producteur = db.query(models.Producteur).filter(models.Producteur.id == producteur_id).first()
    if not producteur:
        raise HTTPException(404, "Producteur non trouvé")
    db.delete(producteur)
    db.commit()