from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.utils.security import get_current_user
from sqlalchemy import func
from uuid import UUID
from datetime import datetime, timedelta, date

router = APIRouter()

def apply_date_filter(query, date_filter: str, date_column):
    """Applique un filtre de date sur une colonne donnée."""
    if not date_filter:
        return query
    today = date.today()
    if date_filter == "today":
        start_date = today
    elif date_filter == "yesterday":
        start_date = today - timedelta(days=1)
    elif date_filter == "3months":
        start_date = today - timedelta(days=90)
    elif date_filter == "1year":
        start_date = today - timedelta(days=365)
    else:
        try:
            start_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
        except ValueError:
            return query
    return query.filter(date_column >= start_date)


@router.get("/kpis")
def get_kpis(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    total_volume = db.query(func.sum(models.Achat.quantite_kg)).filter(models.Achat.statut == 'valide').scalar() or 0
    total_montant = db.query(func.sum(models.Achat.montant_total)).filter(models.Achat.statut == 'valide').scalar() or 0
    cout_moyen = (total_montant / total_volume) if total_volume else 0
    return {
        "coutMoyen": round(float(cout_moyen), 2),
        "volume": round(float(total_volume) / 1000, 2),
        "montant_total": round(float(total_montant) / 1_000_000, 2),
        "nb_achats": db.query(models.Achat).filter(models.Achat.statut == 'valide').count()
    }


@router.get("/suivi_campagne")
def suivi_campagne(
    campagne_id: UUID = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if campagne_id:
        campagne = db.query(models.Campagne).filter(models.Campagne.id == campagne_id).first()
    else:
        campagne = db.query(models.Campagne).filter(models.Campagne.est_active == True).first()
    if not campagne:
        return {"prevu": 0, "collecte": 0, "reste": 0, "taux": 0}

    # Utiliser la prévision agricole pour le volume prévu
    prevision_agri = db.query(models.PrevisionAgriculture).filter_by(campagne_id=campagne.id).first()
    prevu = float(prevision_agri.volume_prevu_tonnes) if prevision_agri else float(campagne.objectif_tonnes or 0)

    # Collecte réelle (achats validés et payés)
    collecte = db.query(func.sum(models.Achat.quantite_kg))\
                 .filter(models.Achat.campagne_id == campagne.id,
                         models.Achat.statut == 'valide',
                         models.Achat.paye == True)\
                 .scalar() or 0
    collecte = float(collecte)
    reste = prevu - collecte
    taux = (collecte / prevu * 100) if prevu else 0

    return {
        "prevu": prevu,
        "collecte": collecte,
        "reste": reste,
        "taux": round(taux, 2)
    }


@router.get("/tendances")
def get_tendances(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
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


@router.get("/comparaison_zones")
def comparaison_zones(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    results = db.query(
        models.Zone.nom,
        func.sum(models.Achat.quantite_kg).label('volume'),
        func.avg(models.Achat.prix_kg).label('cout_moyen'),
        func.sum(models.Achat.montant_total).label('marge')
    ).join(models.Achat, models.Achat.zone_id == models.Zone.id)\
     .filter(models.Achat.statut == 'valide')\
     .group_by(models.Zone.nom).all()

    return [
        {
            "zone": r.nom,
            "volume": float(r.volume or 0),
            "cout_moyen": float(r.cout_moyen or 0),
            "marge": float(r.marge or 0),
            "realisation": 0
        }
        for r in results
    ]


# ================== AGRICULTURE ==================
@router.get("/agriculture")
def get_agriculture(
    date_filter: str = Query(None, description="today, yesterday, 3months, 1year, ou YYYY-MM-DD"),
    campagne_id: UUID = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Déterminer la campagne cible
    if campagne_id:
        campagne = db.query(models.Campagne).filter(models.Campagne.id == campagne_id).first()
    else:
        campagne = db.query(models.Campagne).filter(models.Campagne.est_active == True).first()
    if not campagne:
        return {
            "total_volume": 0,
            "cout_moyen": 0,
            "nb_producteurs": 0,
            "paye": 0,
            "reste": 0,
            "taux_collecte": 0,
            "previsions": {
                "volume_prevu": 0,
                "prix_plancher": 0,
                "seuil_alerte": 0,
                "delai_paiement_jours": 0
            }
        }

    # Construire la requête sur les achats de la campagne sélectionnée
    query = db.query(models.Achat).filter(
        models.Achat.statut == 'valide',
        models.Achat.campagne_id == campagne.id
    )
    query = apply_date_filter(query, date_filter, models.Achat.date_achat)

    total_volume = query.with_entities(func.sum(models.Achat.quantite_kg)).scalar() or 0
    total_montant = query.with_entities(func.sum(models.Achat.montant_total)).scalar() or 0
    cout_moyen = (total_montant / total_volume) if total_volume else 0
    nb_producteurs = query.with_entities(models.Achat.producteur_id).distinct().count()
    paye = query.filter(models.Achat.paye == True).with_entities(func.sum(models.Achat.montant_total)).scalar() or 0
    reste = total_montant - paye
    taux_collecte = (paye / total_montant * 100) if total_montant else 0

    # Récupération des prévisions pour la campagne
    prevision_agri = db.query(models.PrevisionAgriculture).filter_by(campagne_id=campagne.id).first()

    return {
        "total_volume": float(total_volume),
        "cout_moyen": float(cout_moyen),
        "nb_producteurs": nb_producteurs,
        "paye": float(paye),
        "reste": float(reste),
        "taux_collecte": round(taux_collecte, 2),
        "previsions": {
            "volume_prevu": float(prevision_agri.volume_prevu_tonnes) if prevision_agri else 0,
            "prix_plancher": float(prevision_agri.prix_plancher) if prevision_agri else 0,
            "seuil_alerte": float(prevision_agri.seuil_alerte) if prevision_agri else 0,
            "delai_paiement_jours": prevision_agri.delai_paiement_jours if prevision_agri else 0
        }
    }


# ================== ÉGRENAGE ==================
@router.get("/egrenage")
def get_egrenage(
    date_filter: str = Query(None, description="today, yesterday, 3months, 1year, ou YYYY-MM-DD"),
    campagne_id: UUID = Query(None, description="ID de la campagne pour filtrer"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Indicateurs pour la section Égrenage (Transformations) avec filtre campagne."""
    query = db.query(models.Transformation)
    
    # Filtre par campagne
    if campagne_id:
        query = query.filter(models.Transformation.campagne_id == campagne_id)
    
    # Filtre par date
    if date_filter:
        today = date.today()
        if date_filter == "today":
            start_date = today
        elif date_filter == "yesterday":
            start_date = today - timedelta(days=1)
        elif date_filter == "3months":
            start_date = today - timedelta(days=90)
        elif date_filter == "1year":
            start_date = today - timedelta(days=365)
        else:
            try:
                start_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
            except ValueError:
                start_date = None
        if start_date:
            query = query.filter(models.Transformation.date >= start_date)
    
    total_coton_graine = query.with_entities(func.sum(models.Transformation.qte_coton_graine_kg)).scalar() or 0
    total_fibre = query.with_entities(func.sum(models.Transformation.qte_fibre_kg)).scalar() or 0
    total_graines = query.with_entities(func.sum(models.Transformation.qte_graine_kg)).scalar() or 0
    cout_transfo = query.with_entities(func.sum(models.Transformation.cout_transformation)).scalar() or 0
    rendement = (total_fibre / total_coton_graine * 100) if total_coton_graine else 0
    
    return {
        "total_coton_graine": float(total_coton_graine),
        "total_fibre": float(total_fibre),
        "total_graines": float(total_graines),
        "cout_transformation": float(cout_transfo),
        "rendement": round(rendement, 2)
    }


# ================== VENTES ==================
@router.get("/ventes")
def get_ventes(
    date_filter: str = Query(None, description="today, yesterday, 3months, 1year, ou YYYY-MM-DD"),
    campagne_id: UUID = Query(None, description="ID de la campagne pour filtrer"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Indicateurs pour la section Ventes avec filtre campagne."""
    query = db.query(models.Vente)
    
    # Filtre par campagne
    if campagne_id:
        query = query.filter(models.Vente.campagne_id == campagne_id)
    
    # Filtre par date
    if date_filter:
        today = date.today()
        if date_filter == "today":
            start_date = today
        elif date_filter == "yesterday":
            start_date = today - timedelta(days=1)
        elif date_filter == "3months":
            start_date = today - timedelta(days=90)
        elif date_filter == "1year":
            start_date = today - timedelta(days=365)
        else:
            try:
                start_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
            except ValueError:
                start_date = None
        if start_date:
            query = query.filter(models.Vente.date >= start_date)
    
    total_volume = query.with_entities(func.sum(models.Vente.quantite_kg)).scalar() or 0
    total_revenu = query.with_entities(func.sum(models.Vente.montant_total)).scalar() or 0
    total_logistique = query.with_entities(func.sum(models.Vente.couts_logistiques)).scalar() or 0

    # Récupération des prévisions (ventes) pour la campagne spécifiée
    previsions_ventes = []
    if campagne_id:
        previsions_ventes = db.query(models.PrevisionVente).filter_by(campagne_id=campagne_id).all()
    else:
        # Sinon, on prend la campagne active
        campagne_active = db.query(models.Campagne).filter(models.Campagne.est_active == True).first()
        if campagne_active:
            previsions_ventes = db.query(models.PrevisionVente).filter_by(campagne_id=campagne_active.id).all()
    
    previsions_list = []
    for pv in previsions_ventes:
        previsions_list.append({
            "produit": pv.produit,
            "volume_prevu_tonnes": float(pv.volume_prevu_tonnes),
            "prix_vente_prevu": float(pv.prix_vente_prevu),
            "cout_logistique_estime": float(pv.cout_logistique_estime)
        })

    return {
        "total_volume": float(total_volume),
        "total_revenu": float(total_revenu),
        "total_logistique": float(total_logistique),
        "previsions": previsions_list
    }

@router.get("/export_local")
def get_export_local(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Proportions de ventes Export vs Local (par devise)."""
    ventes = db.query(models.Vente).all()
    total_volume = sum(v.quantite_kg for v in ventes) or 1
    export_volume = sum(v.quantite_kg for v in ventes if v.devise in ['USD', 'EUR'])
    local_volume = total_volume - export_volume
    return {
        "export": round((export_volume / total_volume) * 100, 1),
        "local": round((local_volume / total_volume) * 100, 1)
    }