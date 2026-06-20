import psycopg2
from datetime import datetime, timedelta
import random

# Connexion à la base Render
conn = psycopg2.connect(
    host="dpg-d8pc67jeo5us73ad20j0-a.oregon-postgres.render.com",
    port="5432",
    user="sodecoton_user",
    password="3C876OSICJgc5Lp4fMmx1RL5QXCN282k",
    database="sodecoton_db",
    sslmode="require"
)
cursor = conn.cursor()
print("✅ Connexion réussie.")

# --- 1. ZONES ---
zones = [
    ("Extrême-Nord", "Region"),
    ("Nord", "Region"),
    ("Adamawa", "Region")
]
for nom, type_zone in zones:
    cursor.execute("""
        INSERT INTO zones (id, nom, type)
        SELECT gen_random_uuid(), %s, %s
        WHERE NOT EXISTS (SELECT 1 FROM zones WHERE nom = %s);
    """, (nom, type_zone, nom))
print("✅ Zones insérées.")

# Récupérer les zones
cursor.execute("SELECT id, nom FROM zones;")
zone_ids = {row[1]: row[0] for row in cursor.fetchall()}

# --- 2. PRODUCTEURS ---
producteurs = [
    ("Diallo", "Amadou", "77000001", zone_ids["Extrême-Nord"]),
    ("Sow", "Moussa", "77000002", zone_ids["Extrême-Nord"]),
    ("Diop", "Bintou", "77000003", zone_ids["Extrême-Nord"]),
    ("Ndiaye", "Mamadou", "77000004", zone_ids["Nord"]),
    ("Faye", "Awa", "77000005", zone_ids["Nord"]),
    ("Seck", "Oumar", "77000006", zone_ids["Adamawa"]),
    ("Fall", "Fatou", "77000007", zone_ids["Adamawa"]),
    ("Gueye", "Pape", "77000008", zone_ids["Adamawa"]),
    ("Dieng", "Moustapha", "77000009", zone_ids["Extrême-Nord"]),
    ("Mbaye", "Marième", "77000010", zone_ids["Nord"])
]
for nom, prenom, tel, zone_id in producteurs:
    cursor.execute("""
        INSERT INTO producteurs (id, nom, prenom, telephone, zone_id)
        SELECT gen_random_uuid(), %s, %s, %s, %s
        WHERE NOT EXISTS (SELECT 1 FROM producteurs WHERE telephone = %s);
    """, (nom, prenom, tel, zone_id, tel))
print("✅ Producteurs insérés.")

# Récupérer les producteurs
cursor.execute("SELECT id FROM producteurs;")
producteur_ids = [row[0] for row in cursor.fetchall()]

# --- 3. USINES ---
usines = [
    ("Usine Garoua", zone_ids["Extrême-Nord"], 50000),
    ("Usine Ngaoundéré", zone_ids["Adamawa"], 40000)
]
for nom, zone_id, capacite in usines:
    cursor.execute("""
        INSERT INTO usines (id, nom, zone_id, capacite_kg_jour)
        SELECT gen_random_uuid(), %s, %s, %s
        WHERE NOT EXISTS (SELECT 1 FROM usines WHERE nom = %s);
    """, (nom, zone_id, capacite, nom))
print("✅ Usines insérées.")

# Récupérer les usines
cursor.execute("SELECT id FROM usines;")
usine_ids = [row[0] for row in cursor.fetchall()]

# --- 4. CAMPAGNE ---
cursor.execute("""
    INSERT INTO campagnes (id, libelle, date_debut, date_fin, objectif_tonnes, est_active)
    SELECT gen_random_uuid(), 'Campagne 2025-2026', '2025-06-01', '2026-05-31', 15000, true
    WHERE NOT EXISTS (SELECT 1 FROM campagnes WHERE libelle = 'Campagne 2025-2026');
""")
print("✅ Campagne insérée.")
cursor.execute("SELECT id FROM campagnes WHERE est_active = true;")
campagne_id = cursor.fetchone()[0]

# --- 5. ACHATS (100) ---
statuts = ['valide', 'en_attente', 'rejete']
weights = [0.7, 0.2, 0.1]
start_date = datetime(2026, 1, 1)
end_date = datetime(2026, 6, 18)
delta = end_date - start_date

# Récupérer un utilisateur pour saisi_par_id
cursor.execute("SELECT id FROM utilisateurs WHERE role = 'Responsable_terrain' LIMIT 1;")
row = cursor.fetchone()
if row:
    saisi_par_id = row[0]
else:
    cursor.execute("SELECT id FROM utilisateurs LIMIT 1;")
    saisi_par_id = cursor.fetchone()[0]

for _ in range(100):
    producteur_id = random.choice(producteur_ids)
    zone_id = random.choice(list(zone_ids.values()))
    quantite = random.randint(200, 2000)
    prix = random.uniform(260, 320)
    montant = quantite * prix
    statut = random.choices(statuts, weights=weights)[0]
    paye = (statut == 'valide' and random.random() < 0.85)
    date_achat = start_date + timedelta(days=random.randint(0, delta.days))
    cursor.execute("""
        INSERT INTO achats (
            id, date_achat, producteur_id, zone_id, quantite_kg, prix_kg,
            montant_total, saisi_par_id, statut, paye, campagne_id
        )
        VALUES (
            gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        );
    """, (date_achat, producteur_id, zone_id, quantite, prix, montant, saisi_par_id, statut, paye, campagne_id))
print("✅ Achats insérés (100).")

# --- 6. TRANSFORMATIONS (30) ---
cursor.execute("SELECT id FROM utilisateurs WHERE role = 'Comptabilite' LIMIT 1;")
row = cursor.fetchone()
if row:
    saisi_par_id = row[0]
else:
    cursor.execute("SELECT id FROM utilisateurs LIMIT 1;")
    saisi_par_id = cursor.fetchone()[0]

for _ in range(30):
    usine_id = random.choice(usine_ids)
    qte_coton = random.randint(5000, 15000)
    rendement_fibre = random.uniform(0.38, 0.45)
    qte_fibre = int(qte_coton * rendement_fibre)
    qte_graines = int(qte_coton * 0.55)
    cout = random.randint(50000, 200000)
    date_transfo = datetime(2026, random.randint(1, 6), random.randint(1, 28))
    cursor.execute("""
        INSERT INTO transformations (
            id, date, usine_id, qte_coton_graine_kg, qte_fibre_kg,
            qte_graine_kg, cout_transformation, saisi_par_id
        )
        VALUES (
            gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s
        );
    """, (date_transfo, usine_id, qte_coton, qte_fibre, qte_graines, cout, saisi_par_id))
print("✅ Transformations insérées (30).")

# --- 7. VENTES (20) ---
types_vente = ['Fibre', 'Graines', 'Huile', 'Tourteau']
devises = ['FCFA', 'USD', 'EUR']
for _ in range(20):
    type_vente = random.choice(types_vente)
    quantite = random.randint(500, 5000)
    prix_unitaire = random.randint(600, 1200) if type_vente == 'Fibre' else random.randint(300, 600)
    devise = random.choice(devises)
    montant = quantite * prix_unitaire
    logistique = random.randint(10000, 50000)
    date_vente = datetime(2026, random.randint(1, 6), random.randint(1, 28))
    cursor.execute("""
        INSERT INTO ventes (
            id, date, type_vente, quantite_kg, prix_unitaire,
            devise, montant_total, couts_logistiques, saisi_par_id
        )
        VALUES (
            gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s
        );
    """, (date_vente, type_vente, quantite, prix_unitaire, devise, montant, logistique, saisi_par_id))
print("✅ Ventes insérées (20).")

conn.commit()
print("🎉 Toutes les données ont été insérées avec succès !")
cursor.close()
conn.close()