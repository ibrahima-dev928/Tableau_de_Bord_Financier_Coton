from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app import models, schemas
from app.utils.security import get_current_user, require_role
from decimal import Decimal

router = APIRouter()

@router.post("/", response_model=schemas.AchatResponse, status_code=status.HTTP_201_CREATED)
def create_achat(
    achat: schemas.AchatCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Responsable_terrain"))
):
    # Vérification zone
    if current_user.zone_id and current_user.zone_id != achat.zone_id:
        raise HTTPException(403, "Vous ne pouvez saisir que dans votre zone")
    
    # Récupérer la campagne active
    campagne_active = db.query(models.Campagne).filter(models.Campagne.est_active == True).first()
    campagne_id = campagne_active.id if campagne_active else None
    
    montant_total = achat.quantite_kg * achat.prix_kg
    db_achat = models.Achat(
        **achat.dict(),
        montant_total=montant_total,
        saisi_par_id=current_user.id,
        statut="en_attente",
        campagne_id=campagne_id
    )
    db.add(db_achat)
    db.commit()
    db.refresh(db_achat)
    return db_achat

@router.get("/", response_model=List[schemas.AchatResponse])
def get_achats(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(models.Achat)
    if current_user.role == "Responsable_terrain":
        query = query.filter(models.Achat.zone_id == current_user.zone_id)
    achats = query.offset(skip).limit(limit).all()
    
    result = []
    for a in achats:
        # Récupérer les noms
        producteur = db.query(models.Producteur).filter(models.Producteur.id == a.producteur_id).first()
        zone = db.query(models.Zone).filter(models.Zone.id == a.zone_id).first()
        saisi_par = db.query(models.User).filter(models.User.id == a.saisi_par_id).first()
        
        result.append({
            "id": a.id,
            "date_achat": a.date_achat,
            "producteur_id": a.producteur_id,
            "zone_id": a.zone_id,
            "quantite_kg": a.quantite_kg,
            "prix_kg": a.prix_kg,
            "montant_total": a.montant_total,
            "saisi_par_id": a.saisi_par_id,
            "statut": a.statut,
            "producteur_nom": f"{producteur.nom} {producteur.prenom}" if producteur else None,
            "zone_nom": zone.nom if zone else None,
            "saisi_par_nom": saisi_par.nom if saisi_par else None,
        })
    return result

@router.get("/{achat_id}", response_model=schemas.AchatResponse)
def get_achat(
    achat_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    achat = db.query(models.Achat).filter(models.Achat.id == achat_id).first()
    if not achat:
        raise HTTPException(404, "Achat non trouvé")
    if current_user.role == "Responsable_terrain" and achat.zone_id != current_user.zone_id:
        raise HTTPException(403, "Accès non autorisé")
    return achat

@router.put("/{achat_id}/valider", response_model=schemas.AchatResponse)
def valider_achat(
    achat_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Comptabilite"))
):
    achat = db.query(models.Achat).filter(models.Achat.id == achat_id).first()
    if not achat:
        raise HTTPException(404, "Achat non trouvé")
    achat.statut = "valide"
    achat.paye = True  # Optionnel : marquer automatiquement comme payé lors de la validation
    db.commit()
    db.refresh(achat)
    return achat

@router.put("/{achat_id}/rejeter", response_model=schemas.AchatResponse)
def rejeter_achat(
    achat_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_role("Comptabilite"))
):
    achat = db.query(models.Achat).filter(models.Achat.id == achat_id).first()
    if not achat:
        raise HTTPException(404, "Achat non trouvé")
    achat.statut = "rejete"
    db.commit()
    db.refresh(achat)
    return achat