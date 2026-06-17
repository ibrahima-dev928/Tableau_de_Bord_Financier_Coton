from fastapi import APIRouter, Depends
from app.utils.security import get_current_user

router = APIRouter()

@router.get("")
def get_parametres(current_user = Depends(get_current_user)):
    # Données mockées pour l'instant
    return {
        "campagne_en_cours": "2025-2026",
        "prix_plancher": 250,
        "seuil_alerte": 300,
        "notifications": True,
        "periode_reporting": "mensuel"
    }

@router.put("")
def update_parametres(
    params: dict,
    current_user = Depends(get_current_user)
):
    # À implémenter avec stockage en base plus tard
    return {"message": "Paramètres mis à jour", "params": params}