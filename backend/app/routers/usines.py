# app/routers/usines.py
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
    return db_usine

@router.get("/", response_model=List[schemas.UsineResponse])
def get_usines(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    usines = db.query(models.Usine).offset(skip).limit(limit).all()
    return usines

@router.get("/{usine_id}", response_model=schemas.UsineResponse)
def get_usine(
    usine_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    usine = db.query(models.Usine).filter(models.Usine.id == usine_id).first()
    if not usine:
        raise HTTPException(404, "Usine non trouvée")
    return usine

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
    return usine

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