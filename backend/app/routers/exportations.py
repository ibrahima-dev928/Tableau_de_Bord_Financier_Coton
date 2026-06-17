from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.utils.security import get_current_user
from sqlalchemy import func, extract

router = APIRouter()

@router.get("")
def get_exportations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # --- 1. Statistiques globales (à partir des achats) ---
    total_achats_kg = db.query(func.sum(models.Achat.quantite_kg)).scalar() or 0
    total_montant = db.query(func.sum(models.Achat.montant_total)).scalar() or 0

    # Nombre de zones distinctes (simulé comme nombre de pays)
    nombre_zones = db.query(models.Zone).distinct().count() or 1

    # --- 2. Évolution mensuelle des achats (volume) ---
    evolution = db.query(
        extract('year', models.Achat.date_achat).label('year'),
        extract('month', models.Achat.date_achat).label('month'),
        func.sum(models.Achat.quantite_kg).label('volume')
    ).group_by('year', 'month').order_by('year', 'month').all()

    evolution_data = [
        {"mois": f"{int(r.year)}-{int(r.month):02d}", "volume": float(r.volume) if r.volume else 0}
        for r in evolution
    ]

    # --- 3. Répartition par zone (en part de volume) ---
    repartition = db.query(
        models.Zone.nom,
        func.sum(models.Achat.quantite_kg).label('total_volume')
    ).join(models.Achat, models.Achat.zone_id == models.Zone.id)\
     .group_by(models.Zone.nom).all()

    # Convertir en float pour éviter les Decimal
    total_volume = sum(float(r.total_volume) for r in repartition) or 1
    repartition_data = [
        {"name": r.nom, "value": round((float(r.total_volume) / total_volume) * 100, 1)}
        for r in repartition
    ]

    # --- 4. Détail par zone (volume et part) ---
    par_zone_data = [
        {"pays": r.nom, "volume": float(r.total_volume)}
        for r in repartition
    ]

    # --- 5. Variation (simple calcul : comparer les deux derniers mois) ---
    variation = 0
    if len(evolution_data) >= 2:
        dernier = evolution_data[-1]["volume"]
        avant_dernier = evolution_data[-2]["volume"]
        if avant_dernier:
            variation = round(((dernier - avant_dernier) / avant_dernier) * 100, 1)

    return {
        "statistiques": {
            "total_exporte": round(float(total_achats_kg) / 1000, 2),   # en tonnes
            "valeur_totale": round(float(total_montant), 0),            # en FCFA
            "nombre_pays": nombre_zones,
            "variation": variation
        },
        "evolution": evolution_data,
        "repartition": repartition_data,
        "par_pays": par_zone_data
    }