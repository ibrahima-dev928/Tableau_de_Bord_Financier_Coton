from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role

router = APIRouter()

@router.get("/", response_model=List[schemas.ZoneResponse])
def get_zones(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    zones = db.query(models.Zone).offset(skip).limit(limit).all()
    return zones

@router.post("/", response_model=schemas.ZoneResponse, status_code=status.HTTP_201_CREATED)
def create_zone(
    zone: schemas.ZoneCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    db_zone = models.Zone(**zone.dict())
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone

@router.get("/{zone_id}", response_model=schemas.ZoneResponse)
def get_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    zone = db.query(models.Zone).filter(models.Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(404, "Zone non trouvée")
    return zone

@router.put("/{zone_id}", response_model=schemas.ZoneResponse)
def update_zone(
    zone_id: str,
    zone_update: schemas.ZoneCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    zone = db.query(models.Zone).filter(models.Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(404, "Zone non trouvée")
    for key, value in zone_update.dict().items():
        setattr(zone, key, value)
    db.commit()
    db.refresh(zone)
    return zone

@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    zone = db.query(models.Zone).filter(models.Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(404, "Zone non trouvée")
    db.delete(zone)
    db.commit()