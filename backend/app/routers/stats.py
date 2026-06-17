from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.utils.security import get_current_user
from sqlalchemy import func, extract

router = APIRouter()

@router.get("/kpis")
def get_kpis(
    zone_id: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(models.Achat)
    if zone_id:
        query = query.filter(models.Achat.zone_id == zone_id)
    total_volume = query.with_entities(func.sum(models.Achat.quantite_kg)).scalar() or 0
    total_montant = query.with_entities(func.sum(models.Achat.montant_total)).scalar() or 0
    cout_moyen = (total_montant / total_volume) if total_volume else 0
    return {
        "coutMoyen": round(float(cout_moyen), 2),
        "volume": round(float(total_volume) / 1000, 2),
        "montant_total": round(float(total_montant) / 1_000_000, 2),
        "nb_achats": query.count()
    }

@router.get("/tendances")
def get_tendances(
    zone_id: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        query = db.query(
            extract('year', models.Achat.date_achat).label('year'),
            extract('month', models.Achat.date_achat).label('month'),
            func.sum(models.Achat.quantite_kg).label('volume'),
            func.avg(models.Achat.prix_kg).label('prix_moyen')
        ).group_by('year', 'month').order_by('year', 'month')
        if zone_id:
            query = query.filter(models.Achat.zone_id == zone_id)
        results = query.all()
        return [
            {
                "mois": f"{int(r.year)}-{int(r.month):02d}",
                "volume": float(r.volume) if r.volume is not None else 0,
                "prix_moyen": float(r.prix_moyen) if r.prix_moyen is not None else 0
            }
            for r in results
        ]
    except Exception as e:
        # En cas d'erreur, on retourne une liste vide pour ne pas casser le frontend
        print(f"Erreur dans /tendances : {e}")
        return []

@router.get("/comparaison_zones")
def comparaison_zones(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        results = db.query(
            models.Zone.nom,
            func.sum(models.Achat.quantite_kg).label('volume'),
            func.avg(models.Achat.prix_kg).label('cout_moyen')
        ).join(models.Achat, models.Zone.id == models.Achat.zone_id)\
         .group_by(models.Zone.nom).all()
        return [
            {
                "zone": r.nom,
                "volume": float(r.volume) if r.volume is not None else 0,
                "cout_moyen": float(r.cout_moyen) if r.cout_moyen is not None else 0
            }
            for r in results
        ]
    except Exception as e:
        print(f"Erreur dans /comparaison_zones : {e}")
        return []