from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role
from decimal import Decimal

router = APIRouter()

@router.post("/", response_model=schemas.TransformationResponse, status_code=status.HTTP_201_CREATED)
def create_transformation(
    transformation: schemas.TransformationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Comptabilite"))
):
    campagne_active = db.query(models.Campagne).filter(models.Campagne.est_active == True).first()
    campagne_id = campagne_active.id if campagne_active else None
    
    db_transformation = models.Transformation(
        **transformation.dict(),
        saisi_par_id=current_user.id,
        campagne_id=campagne_id
    )
    db.add(db_transformation)
    db.commit()
    db.refresh(db_transformation)
    return db_transformation

@router.get("/", response_model=List[schemas.TransformationResponse])
def get_transformations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    transformations = db.query(models.Transformation).offset(skip).limit(limit).all()
    return transformations

@router.get("/{transformation_id}", response_model=schemas.TransformationResponse)
def get_transformation(
    transformation_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    transformation = db.query(models.Transformation).filter(models.Transformation.id == transformation_id).first()
    if not transformation:
        raise HTTPException(404, "Transformation non trouvée")
    return transformation

@router.put("/{transformation_id}", response_model=schemas.TransformationResponse)
def update_transformation(
    transformation_id: UUID,
    transformation_data: schemas.TransformationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Comptabilite"))
):
    transformation = db.query(models.Transformation).filter(models.Transformation.id == transformation_id).first()
    if not transformation:
        raise HTTPException(404, "Transformation non trouvée")
    for key, value in transformation_data.dict().items():
        setattr(transformation, key, value)
    db.commit()
    db.refresh(transformation)
    return transformation

@router.delete("/{transformation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transformation(
    transformation_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Comptabilite"))
):
    transformation = db.query(models.Transformation).filter(models.Transformation.id == transformation_id).first()
    if not transformation:
        raise HTTPException(404, "Transformation non trouvée")
    db.delete(transformation)
    db.commit()