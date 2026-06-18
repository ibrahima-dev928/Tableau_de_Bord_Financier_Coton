import psycopg2

conn_params = {
    "host": "dpg-d8pc67jeo5us73ad20j0-a.oregon-postgres.render.com",
    "port": "5432",
    "user": "sodecoton_user",
    "password": "3C876OSICJgc5Lp4fMmx1RL5QXCN282k",
    "database": "sodecoton_db",
    "sslmode": "require"
}

try:
    conn = psycopg2.connect(**conn_params)
    cursor = conn.cursor()
    print("✅ Connexion réussie.")

    # 1. Créer la table campagnes
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS campagnes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            libelle VARCHAR(100),
            date_debut DATE,
            date_fin DATE,
            objectif_tonnes DECIMAL(12,2),
            est_active BOOLEAN DEFAULT TRUE
        );
    """)
    print("✅ Table campagnes créée (ou déjà existante).")

    # 2. Insérer une campagne si la table est vide
    cursor.execute("SELECT COUNT(*) FROM campagnes;")
    count = cursor.fetchone()[0]
    if count == 0:
        cursor.execute("""
            INSERT INTO campagnes (libelle, date_debut, date_fin, objectif_tonnes, est_active)
            VALUES ('Campagne 2025-2026', '2025-06-01', '2026-05-31', 15000, true);
        """)
        print("✅ Campagne par défaut insérée.")
    else:
        # S'assurer qu'il n'y a qu'une seule campagne active
        cursor.execute("SELECT COUNT(*) FROM campagnes WHERE est_active = true;")
        active_count = cursor.fetchone()[0]
        if active_count > 1:
            cursor.execute("""
                UPDATE campagnes SET est_active = false;
                UPDATE campagnes SET est_active = true
                WHERE id = (SELECT id FROM campagnes ORDER BY date_debut DESC LIMIT 1);
            """)
            print("✅ Plusieurs campagnes actives détectées. Une seule est maintenant active.")
        else:
            print("✅ Une seule campagne active.")

    # 3. Ajouter les colonnes nécessaires à achats (si manquantes)
    cursor.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='achats' AND column_name='campagne_id') THEN
                ALTER TABLE achats ADD COLUMN campagne_id UUID REFERENCES campagnes(id);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='achats' AND column_name='paye') THEN
                ALTER TABLE achats ADD COLUMN paye BOOLEAN DEFAULT FALSE;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='achats' AND column_name='montant_paye') THEN
                ALTER TABLE achats ADD COLUMN montant_paye DECIMAL(15,2) DEFAULT 0;
            END IF;
        END $$;
    """)
    print("✅ Colonnes de achats vérifiées/ajoutées.")

    # 4. Lier les achats existants à la campagne active
    cursor.execute("""
        UPDATE achats SET campagne_id = (SELECT id FROM campagnes WHERE est_active = true LIMIT 1)
        WHERE campagne_id IS NULL;
    """)
    print("✅ Achats liés à la campagne active.")

    # 5. Marquer les achats validés comme payés
    cursor.execute("""
        UPDATE achats SET paye = true, montant_paye = montant_total
        WHERE statut = 'valide' AND paye = false;
    """)
    print("✅ Achats validés marqués comme payés.")

    conn.commit()
    print("🎉 Initialisation terminée avec succès.")

except Exception as e:
    print(f"❌ Erreur : {e}")
    conn.rollback()

finally:
    if 'conn' in locals():
        conn.close()