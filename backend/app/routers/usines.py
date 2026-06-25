from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role

router = APIRouter()

@router.post("/", response_model=schemas.UsineResponse, status_code=status.HTTP_201_CREATED)
def create_usine(
    usine: schemas.UsineCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    db_usine = models.Usine(**usine.dict())
    db.add(db_usine)
    db.commit()
    db.refresh(db_usine)
    # Récupérer le nom de la zone pour la réponse
    zone = db.query(models.Zone).filter(models.Zone.id == db_usine.zone_id).first()
    zone_nom = zone.nom if zone else None
    # Construire la réponse
    return {
        "id": db_usine.id,
        "nom": db_usine.nom,
        "zone_id": db_usine.zone_id,
        "capacite_kg_jour": db_usine.capacite_kg_jour,
        "zone_nom": zone_nom
    }

@router.get("/", response_model=List[schemas.UsineResponse])
def get_usines(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Jointure avec la table zones pour récupérer le nom
    usines = db.query(models.Usine).join(models.Zone, models.Usine.zone_id == models.Zone.id).offset(skip).limit(limit).all()
    result = []
    for u in usines:
        # Pour chaque usine, on récupère le nom de la zone (via la relation ou l'objet joint)
        zone_nom = u.zone.nom if u.zone else None
        result.append({
            "id": u.id,
            "nom": u.nom,
            "zone_id": u.zone_id,
            "capacite_kg_jour": u.capacite_kg_jour,
            "zone_nom": zone_nom
        })
    return result

@router.get("/{usine_id}", response_model=schemas.UsineResponse)
def get_usine(
    usine_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    usine = db.query(models.Usine).filter(models.Usine.id == usine_id).first()
    if not usine:
        raise HTTPException(404, "Usine non trouvée")
    zone = db.query(models.Zone).filter(models.Zone.id == usine.zone_id).first()
    zone_nom = zone.nom if zone else None
    return {
        "id": usine.id,
        "nom": usine.nom,
        "zone_id": usine.zone_id,
        "capacite_kg_jour": usine.capacite_kg_jour,
        "zone_nom": zone_nom
    }

@router.put("/{usine_id}", response_model=schemas.UsineResponse)
def update_usine(
    usine_id: UUID,
    usine_data: schemas.UsineCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    usine = db.query(models.Usine).filter(models.Usine.id == usine_id).first()
    if not usine:
        raise HTTPException(404, "Usine non trouvée")
    for key, value in usine_data.dict().items():
        setattr(usine, key, value)
    db.commit()
    db.refresh(usine)
    zone = db.query(models.Zone).filter(models.Zone.id == usine.zone_id).first()
    zone_nom = zone.nom if zone else None
    return {
        "id": usine.id,
        "nom": usine.nom,
        "zone_id": usine.zone_id,
        "capacite_kg_jour": usine.capacite_kg_jour,
        "zone_nom": zone_nom
    }

@router.delete("/{usine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_usine(
    usine_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    usine = db.query(models.Usine).filter(models.Usine.id == usine_id).first()
    if not usine:
        raise HTTPException(404, "Usine non trouvée")
    db.delete(usine)
    db.commit()