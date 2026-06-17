from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.TransformationResponse)
def create_transformation(
    transf: schemas.TransformationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_transf = models.Transformation(**transf.dict(), saisi_par_id=current_user.id)
    db.add(db_transf)
    db.commit()
    db.refresh(db_transf)
    return db_transf

@router.get("/", response_model=List[schemas.TransformationResponse])
def get_transformations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(models.Transformation).offset(skip).limit(limit).all()