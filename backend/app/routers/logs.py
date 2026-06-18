from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models
from app.utils.security import get_current_user, require_role

router = APIRouter()

@router.get("/", response_model=List[dict])
def get_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Direction"))  # seul le Directeur ou Admin peut voir les logs
):
    logs = db.query(models.LogAudit).offset(skip).limit(limit).order_by(models.LogAudit.date_action.desc()).all()
    return [
        {
            "id": str(log.id),
            "utilisateur_id": str(log.utilisateur_id),
            "action": log.action,
            "table_concernee": log.table_concernee,
            "ancienne_valeur": log.ancienne_valeur,
            "nouvelle_valeur": log.nouvelle_valeur,
            "date_action": log.date_action.isoformat() if log.date_action else None,
            "ip_adresse": log.ip_adresse
        }
        for log in logs
    ]