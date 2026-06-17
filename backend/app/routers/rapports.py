from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.rapport import RapportCreate
from app.utils.security import get_current_user
from app import models
from datetime import datetime
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import openpyxl
from io import BytesIO

router = APIRouter()

# Dossier de stockage des rapports
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

def generate_pdf_report(data, title="Rapport"):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    story.append(Paragraph(title, styles['Title']))
    story.append(Spacer(1, 12))
    if not data:
        data = [{"Message": "Aucune donnée disponible"}]
    headers = list(data[0].keys())
    table_data = [headers] + [[str(row.get(h, '')) for h in headers] for row in data]
    table = Table(table_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
    ]))
    story.append(table)
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def generate_excel_report(data):
    wb = openpyxl.Workbook()
    ws = wb.active
    if data:
        headers = list(data[0].keys())
        ws.append(headers)
        for row in data:
            ws.append([row.get(h, '') for h in headers])
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()

@router.post("/")
def generate_report(
    report: RapportCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        achats = db.query(models.Achat).filter(
            models.Achat.date_achat.between(report.periode_debut, report.periode_fin)
        ).all()
        data = []
        for a in achats:
            producteur = db.query(models.Producteur).filter(models.Producteur.id == a.producteur_id).first()
            zone = db.query(models.Zone).filter(models.Zone.id == a.zone_id).first()
            data.append({
                "Date": a.date_achat.strftime("%Y-%m-%d"),
                "Producteur": producteur.nom if producteur else "Inconnu",
                "Zone": zone.nom if zone else "Inconnue",
                "Volume (kg)": float(a.quantite_kg),
                "Prix (FCFA)": float(a.prix_kg),
                "Montant (FCFA)": float(a.montant_total)
            })
        if not data:
            data.append({
                "Date": datetime.now().strftime("%Y-%m-%d"),
                "Producteur": "Aucun",
                "Zone": "Aucune",
                "Volume (kg)": 0,
                "Prix (FCFA)": 0,
                "Montant (FCFA)": 0
            })
    except Exception as e:
        data = [{"Erreur": str(e)}]
    
    if report.format.upper() == "PDF":
        content = generate_pdf_report(data, title=f"Rapport {report.type}")
        extension = ".pdf"
    else:
        content = generate_excel_report(data)
        extension = ".xlsx"
    
    filename = f"rapport_{datetime.now().strftime('%Y%m%d%H%M%S')}{extension}"
    filepath = os.path.join(REPORTS_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    
    db_rapport = models.Rapport(
        type=report.type,
        periode_debut=report.periode_debut,
        periode_fin=report.periode_fin,
        format=report.format,
        fichier_path=filepath,
        genere_par_id=current_user.id
    )
    db.add(db_rapport)
    db.commit()
    db.refresh(db_rapport)
    return {"id": str(db_rapport.id), "message": "Rapport généré avec succès"}

@router.get("/")
def get_rapports(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(models.Rapport).all()

@router.get("/download/{rapport_id}")
def download_report(
    rapport_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    rapport = db.query(models.Rapport).filter(models.Rapport.id == rapport_id).first()
    if not rapport:
        raise HTTPException(404, "Rapport non trouvé")
    if not os.path.exists(rapport.fichier_path):
        raise HTTPException(404, "Fichier introuvable sur le serveur")
    media_type = "application/pdf" if rapport.format.upper() == "PDF" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return FileResponse(
        rapport.fichier_path,
        filename=os.path.basename(rapport.fichier_path),
        media_type=media_type
    )

@router.post("/schedule")
def schedule_report(
    report: RapportCreate,
    cron: str,
    current_user = Depends(get_current_user)
):
    return {"message": f"Rapport planifié avec la fréquence {cron}"}