from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.utils.security import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Seuls les utilisateurs Direction ou Admin peuvent voir les notifications
    if current_user.role not in ["Direction", "Admin"]:
        return {"notifications": []}

    # Récupérer les dernières actions (ex: dernières 24h)
    since = datetime.now() - timedelta(hours=24)

    achats = db.query(models.Achat).filter(models.Achat.date_achat >= since).order_by(models.Achat.date_achat.desc()).limit(10).all()
    transformations = db.query(models.Transformation).filter(models.Transformation.date >= since).order_by(models.Transformation.date.desc()).limit(10).all()
    ventes = db.query(models.Vente).filter(models.Vente.date >= since).order_by(models.Vente.date.desc()).limit(10).all()

    notifications = []

    for a in achats:
        producteur = db.query(models.Producteur).filter(models.Producteur.id == a.producteur_id).first()
        notifications.append({
            "id": str(a.id),
            "type": "achat",
            "message": f"Nouvel achat de {a.quantite_kg} kg de {producteur.nom if producteur else 'inconnu'}",
            "date": a.date_achat.isoformat(),
            "est_lue": False
        })

    for t in transformations:
        notifications.append({
            "id": str(t.id),
            "type": "transformation",
            "message": f"Transformation de {t.qte_coton_graine_kg} kg de coton graine",
            "date": t.date.isoformat(),
            "est_lue": False
        })

    for v in ventes:
        notifications.append({
            "id": str(v.id),
            "type": "vente",
            "message": f"Nouvelle vente de {v.quantite_kg} kg de {v.type_vente}",
            "date": v.date.isoformat(),
            "est_lue": False
        })

    # Trier par date décroissante
    notifications.sort(key=lambda x: x["date"], reverse=True)
    return {"notifications": notifications[:20]}  # Limiter à 20 notifications