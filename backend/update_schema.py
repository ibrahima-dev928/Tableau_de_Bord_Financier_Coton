import psycopg2
conn = psycopg2.connect(
    host="dpg-d8pc67jeo5us73ad20j0-a.oregon-postgres.render.com",
    port="5432",
    user="sodecoton_user",
    password="3C876OSICJgc5Lp4fMmx1RL5QXCN282k",
    database="sodecoton_db",
    sslmode="require"
)
cursor = conn.cursor()
cursor.execute("""
    CREATE TABLE IF NOT EXISTS campagnes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        libelle VARCHAR(100) NOT NULL,
        date_debut DATE NOT NULL,
        date_fin DATE NOT NULL,
        objectif_tonnes DECIMAL(12,2) NOT NULL,
        est_active BOOLEAN DEFAULT TRUE
    );
    ALTER TABLE achats ADD COLUMN IF NOT EXISTS campagne_id UUID REFERENCES campagnes(id);
    ALTER TABLE achats ADD COLUMN IF NOT EXISTS paye BOOLEAN DEFAULT FALSE;
    ALTER TABLE achats ADD COLUMN IF NOT EXISTS montant_paye DECIMAL(15,2) DEFAULT 0;
    INSERT INTO campagnes (libelle, date_debut, date_fin, objectif_tonnes, est_active)
    SELECT 'Campagne 2025-2026', '2025-06-01', '2026-05-31', 15000, true
    WHERE NOT EXISTS (SELECT 1 FROM campagnes);
    UPDATE achats SET campagne_id = (SELECT id FROM campagnes WHERE est_active = true LIMIT 1) WHERE campagne_id IS NULL;
    UPDATE achats SET paye = true, montant_paye = montant_total WHERE statut = 'valide';
""")
conn.commit()
conn.close()
print("✅ Schéma mis à jour.")