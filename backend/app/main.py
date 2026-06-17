from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.base import Base
import app.models
from app.routers import stats_router
from app.routers import exportations_router
from app.routers import (
    auth_router,
    achats_router,
    ventes_router,
    transformations_router,
    rapports_router,
    zones_router,
    producteurs_router,
    utilisateurs_router,
    usines_router,
    exportations_router,
    parametres_router
)

app = FastAPI(title="SODECOTON Financial Dashboard API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Inclusion des routeurs
app.include_router(auth_router, prefix="/api/auth", tags=["Authentification"])
app.include_router(achats_router, prefix="/api/achats", tags=["Achats"])
app.include_router(ventes_router, prefix="/api/ventes", tags=["Ventes"])
app.include_router(transformations_router, prefix="/api/transformations", tags=["Transformations"])
app.include_router(rapports_router, prefix="/api/rapports", tags=["Rapports"])
app.include_router(zones_router, prefix="/api/zones", tags=["Zones"])
app.include_router(producteurs_router, prefix="/api/producteurs", tags=["Producteurs"])
app.include_router(utilisateurs_router, prefix="/api/utilisateurs", tags=["Utilisateurs"])
app.include_router(usines_router, prefix="/api/usines", tags=["Usines"])
app.include_router(exportations_router, prefix="/api/exportations", tags=["Exportations"])
app.include_router(parametres_router, prefix="/api/parametres", tags=["Paramètres"])
app.include_router(stats_router, prefix="/api/stats", tags=["Statistiques"])

@app.get("/")
def root():
    return {"message": "Bienvenue sur l'API SODECOTON"}