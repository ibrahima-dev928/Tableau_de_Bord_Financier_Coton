# tests/conftest.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
import uuid

from app.main import app
from app.database import get_db
from app import models
from app.base import Base

# ========== BASE DE DONNÉES DE TEST (PostgreSQL) ==========
# Utilisez vos identifiants PostgreSQL locaux
DATABASE_URL_TEST = "postgresql://postgres:1234@localhost:5432/sodecoton_test"
#DATABASE_URL=postgresql://postgres:1234@localhost:5432/sodecoton_test
engine = create_engine(DATABASE_URL_TEST)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Créer les tables (vide la base avant chaque test)
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# ========== FIXTURES ==========
@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def admin_token(client):
    """Crée un administrateur et retourne un token JWT."""
    db = TestingSessionLocal()
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = pwd_context.hash("admin123")

    admin = models.User(
        id=uuid.uuid4(),
        nom="Admin Test",
        email="admin@sodecoton.com",
        mot_de_passe_hash=hashed,
        role="Direction",
        actif=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    db.close()

    response = client.post("/api/auth/login", data={
        "username": "admin@sodecoton.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    return response.json()["access_token"]

@pytest.fixture
def test_data(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    zone_resp = client.post("/api/zones/", json={"nom": "Zone Test", "type": "Region"}, headers=headers)
    assert zone_resp.status_code == 201
    zone_id = zone_resp.json()["id"]
    prod_resp = client.post("/api/producteurs/", json={
        "nom": "Producteur Test",
        "prenom": "Test",
        "telephone": "123456789",
        "zone_id": zone_id
    }, headers=headers)
    assert prod_resp.status_code == 201
    producteur_id = prod_resp.json()["id"]
    return {"zone_id": zone_id, "producteur_id": producteur_id}