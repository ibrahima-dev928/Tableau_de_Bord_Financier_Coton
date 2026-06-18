from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.utils.security import get_current_user
from sqlalchemy import func, extract
from datetime import datetime

router = APIRouter()

# Existing KPIs endpoint (already present)
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

# NEW: Campagne suivi endpoint
@router.get("/suivi_campagne")
def suivi_campagne(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Get active campaign
    campagne = db.query(models.Campagne).filter(models.Campagne.est_active == True).first()
    if not campagne:
        return {"prevu": 0, "collecte": 0, "reste": 0, "taux": 0}

    # Calculate collected volume (validated and paid purchases)
    collecte = db.query(func.sum(models.Achat.quantite_kg))\
                 .filter(models.Achat.campagne_id == campagne.id,
                         models.Achat.statut == 'valide',
                         models.Achat.paye == True)\
                 .scalar() or 0

    prevu = campagne.objectif_tonnes or 0
    reste = prevu - collecte
    taux = (collecte / prevu * 100) if prevu else 0

    return {
        "prevu": float(prevu),
        "collecte": float(collecte),
        "reste": float(reste),
        "taux": round(taux, 2)
    }

# NEW: Tendances endpoint (monthly volume and margin)
@router.get("/tendances")
def get_tendances(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Group by month and calculate sum of volume and avg price (marge)
    results = db.query(
        func.to_char(models.Achat.date_achat, 'YYYY-MM').label('mois'),
        func.sum(models.Achat.quantite_kg).label('volume'),
        func.avg(models.Achat.prix_kg).label('marge')
    ).filter(models.Achat.statut == 'valide')\
     .group_by('mois')\
     .order_by('mois')\
     .all()
    return [
        {"mois": r.mois, "volume": float(r.volume or 0), "marge": float(r.marge or 0)}
        for r in results
    ]

# NEW: Comparaison zones avec taux de réalisation
@router.get("/comparaison_zones")
def comparaison_zones(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Get active campaign
    campagne = db.query(models.Campagne).filter(models.Campagne.est_active == True).first()
    
    # If no campaign, return empty list
    if not campagne:
        return []
    
    # For each zone, calculate volume, avg price, total margin, and realization rate
    results = db.query(
        models.Zone.nom,
        func.sum(models.Achat.quantite_kg).label('volume'),
        func.avg(models.Achat.prix_kg).label('cout_moyen'),
        func.sum(models.Achat.montant_total).label('marge')
    ).join(models.Achat, models.Achat.zone_id == models.Zone.id)\
     .filter(models.Achat.statut == 'valide')\
     .group_by(models.Zone.nom)\
     .all()

    # For simplicity, we'll calculate realization based on campaign objective per zone (if we had per-zone objectives, we'd use them)
    # For now, we'll compute a dummy realization rate based on volume share
    total_volume = db.query(func.sum(models.Achat.quantite_kg))\
                     .filter(models.Achat.statut == 'valide')\
                     .scalar() or 0
    campaign_objective = campagne.objectif_tonnes or 0
    
    zone_data = []
    for r in results:
        volume = float(r.volume or 0)
        # Calculate realization as percentage of campaign objective per zone (approximated)
        # In a real system, you'd have per-zone objectives. For now, we assume even distribution or set manually.
        # We'll compute as: percentage of total collected volume / total campaign * 100, but limited to 100%
        if total_volume > 0 and campaign_objective > 0:
            # This gives an indication, but not accurate; you can replace with a fixed value for demo
            volume_float = float(volume)
            total_volume_float = float(total_volume) if total_volume else 1
            realisation = (volume_float / total_volume_float) * 100            # Cap at 100%
            realisation = min(realisation, 100)
        else:
            realisation = 0
        
        zone_data.append({
            "zone": r.nom,
            "volume": volume,
            "cout_moyen": float(r.cout_moyen or 0),
            "marge": float(r.marge or 0),
            "realisation": round(realisation, 2)
        })
    
    return zone_data