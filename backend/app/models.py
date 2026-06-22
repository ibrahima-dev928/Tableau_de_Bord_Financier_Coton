import uuid
from sqlalchemy import Column, String, Numeric, DateTime, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, backref  # ← ajout de backref
from sqlalchemy.sql import func
from app.base import Base
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, String, Numeric, DateTime, Boolean, ForeignKey, CheckConstraint, Date
from sqlalchemy import Column, String, Numeric, DateTime, Boolean, ForeignKey, CheckConstraint, Date, Integer, UniqueConstraint

class User(Base):
    __tablename__ = "utilisateurs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    mot_de_passe_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=True)
    actif = Column(Boolean, default=True)

    zone = relationship("Zone", back_populates="utilisateurs")
    achats = relationship("Achat", foreign_keys="Achat.saisi_par_id", back_populates="saisi_par")
    transformations = relationship("Transformation", foreign_keys="Transformation.saisi_par_id", back_populates="saisi_par")
    ventes = relationship("Vente", foreign_keys="Vente.saisi_par_id", back_populates="saisi_par")
    rapports_generes = relationship("Rapport", foreign_keys="Rapport.genere_par_id", back_populates="genere_par")


class Zone(Base):
    __tablename__ = "zones"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(String, nullable=False)
    type = Column(String)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=True)

    # Relation avec la zone parente et les zones filles
    parent = relationship("Zone", remote_side=[id], backref=backref("enfants", uselist=True))

    # Autres relations
    utilisateurs = relationship("User", back_populates="zone")
    producteurs = relationship("Producteur", back_populates="zone")
    achats = relationship("Achat", back_populates="zone")
    usines = relationship("Usine", back_populates="zone")


class Producteur(Base):
    __tablename__ = "producteurs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(String, nullable=False)
    prenom = Column(String)
    telephone = Column(String)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=False)

    zone = relationship("Zone", back_populates="producteurs")
    achats = relationship("Achat", back_populates="producteur")


class Usine(Base):
    __tablename__ = "usines"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(String, nullable=False)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=False)
    capacite_kg_jour = Column(Numeric(12, 2))

    zone = relationship("Zone", back_populates="usines")
    transformations = relationship("Transformation", back_populates="usine")


class Achat(Base):
    __tablename__ = "achats"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date_achat = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    producteur_id = Column(UUID(as_uuid=True), ForeignKey("producteurs.id"), nullable=False)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=False)
    quantite_kg = Column(Numeric(12,2), nullable=False)
    prix_kg = Column(Numeric(10,2), nullable=False)
    montant_total = Column(Numeric(15,2), nullable=False)
    saisi_par_id = Column(UUID(as_uuid=True), ForeignKey("utilisateurs.id"), nullable=False)
    statut = Column(String, default="en_attente")
    
    # NOUVELLES COLONNES (ajoutées)
    campagne_id = Column(UUID(as_uuid=True), ForeignKey("campagnes.id"), nullable=True)
    paye = Column(Boolean, default=False)
    montant_paye = Column(Numeric(15,2), default=0)

    __table_args__ = (CheckConstraint("statut IN ('en_attente','valide','rejete')"),)

    # Relations
    producteur = relationship("Producteur", back_populates="achats")
    zone = relationship("Zone", back_populates="achats")
    saisi_par = relationship("User", foreign_keys=[saisi_par_id], back_populates="achats")
    campagne = relationship("Campagne", back_populates="achats")  # si vous créez la relation

class Transformation(Base):
    __tablename__ = "transformations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    usine_id = Column(UUID(as_uuid=True), ForeignKey("usines.id"), nullable=False)
    qte_coton_graine_kg = Column(Numeric(12, 2), nullable=False)
    qte_fibre_kg = Column(Numeric(12, 2), nullable=False)
    qte_graine_kg = Column(Numeric(12, 2), nullable=False)
    cout_transformation = Column(Numeric(15, 2), nullable=False)
    saisi_par_id = Column(UUID(as_uuid=True), ForeignKey("utilisateurs.id"), nullable=False)

    usine = relationship("Usine", back_populates="transformations")
    saisi_par = relationship("User", back_populates="transformations")


class Vente(Base):
    __tablename__ = "ventes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    type_vente = Column(String, nullable=False)
    quantite_kg = Column(Numeric(12, 2), nullable=False)
    prix_unitaire = Column(Numeric(12, 2), nullable=False)
    devise = Column(String, default="FCFA")
    montant_total = Column(Numeric(15, 2), nullable=False)
    couts_logistiques = Column(Numeric(15, 2), default=0)
    saisi_par_id = Column(UUID(as_uuid=True), ForeignKey("utilisateurs.id"), nullable=False)

    saisi_par = relationship("User", back_populates="ventes")

class LogAudit(Base):
    __tablename__ = "logs_audit"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    utilisateur_id = Column(UUID(as_uuid=True), ForeignKey("utilisateurs.id"))
    action = Column(String, nullable=False)
    table_concernee = Column(String)
    ancienne_valeur = Column(JSONB, nullable=True)
    nouvelle_valeur = Column(JSONB, nullable=True)
    date_action = Column(DateTime(timezone=True), server_default=func.now())
    ip_adresse = Column(String)

class Campagne(Base):
    __tablename__ = "campagnes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(String, nullable=False) 
    libelle = Column(String(100))
    date_debut = Column(Date)
    date_fin = Column(Date)
    objectif_tonnes = Column(Numeric(12,2))
    achats = relationship("Achat", back_populates="campagne")
    est_active = Column(Boolean, default=True)
    prevision_agriculture = relationship("PrevisionAgriculture", back_populates="campagne", uselist=False, cascade="all, delete-orphan")
    prevision_egrenage = relationship("PrevisionEgrenage", back_populates="campagne", uselist=False, cascade="all, delete-orphan")
    previsions_ventes = relationship("PrevisionVente", back_populates="campagne", cascade="all, delete-orphan")

class Rapport(Base):
    __tablename__ = "rapports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String, nullable=False)
    periode_debut = Column(DateTime, nullable=False)
    periode_fin = Column(DateTime, nullable=False)
    format = Column(String, default="PDF")
    fichier_path = Column(String)
    genere_par_id = Column(UUID(as_uuid=True), ForeignKey("utilisateurs.id"), nullable=False)
    genere_le = Column(DateTime(timezone=True), server_default=func.now())

    genere_par = relationship("User", back_populates="rapports_generes")


class PrevisionAgriculture(Base):
    __tablename__ = "previsions_agriculture"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campagne_id = Column(UUID(as_uuid=True), ForeignKey("campagnes.id"), nullable=False)
    volume_prevu_tonnes = Column(Numeric(12,2), nullable=False)
    prix_plancher = Column(Numeric(10,2), nullable=False)
    seuil_alerte = Column(Numeric(10,2), nullable=False)
    delai_paiement_jours = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    campagne = relationship("Campagne", back_populates="prevision_agriculture")

class PrevisionEgrenage(Base):
    __tablename__ = "previsions_egrenage"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campagne_id = Column(UUID(as_uuid=True), ForeignKey("campagnes.id"), nullable=False)
    coton_graine_prevu_tonnes = Column(Numeric(12,2), nullable=False)
    rendement_attendu_pourcent = Column(Numeric(5,2), nullable=False)
    cout_transformation_estime = Column(Numeric(15,2), nullable=False)  # total en FCFA
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    campagne = relationship("Campagne", back_populates="prevision_egrenage")

# app/models.py (extrait)

class PrevisionVente(Base):
    __tablename__ = "previsions_ventes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campagne_id = Column(UUID(as_uuid=True), ForeignKey("campagnes.id"), nullable=False)
    produit = Column(String, nullable=False)          # 'fibre', 'graines', 'huile', 'tourteau'
    #conditionnement = Column(String, nullable=True)   # 'carton', 'sac', 'vrac'
    volume_prevu_tonnes = Column(Numeric(12, 2), default=0)
    prix_vente_prevu = Column(Numeric(12, 2), default=0)
    cout_logistique_estime = Column(Numeric(15, 2), default=0)

    campagne = relationship("Campagne", back_populates="previsions_ventes")