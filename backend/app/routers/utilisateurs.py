from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from passlib.context import CryptContext
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/", response_model=List[schemas.UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    hashed = pwd_context.hash(user.mot_de_passe)
    db_user = models.User(
        nom=user.nom,
        email=user.email,
        mot_de_passe_hash=hashed,
        role=user.role,
        zone_id=user.zone_id,
        actif=user.actif
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}/toggle-actif", response_model=schemas.UserResponse)
def toggle_user_actif(
    user_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")
    user.actif = not user.actif
    db.commit()
    db.refresh(user)
    return user