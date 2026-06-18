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
    print("✅ Connexion réussie. Ajout des utilisateurs...")
    
    cursor.execute("""
        INSERT INTO utilisateurs (id, nom, email, mot_de_passe_hash, role, actif)
        VALUES (
            gen_random_uuid(),
            'Comptable SODECOTON',
            'compta@sodecoton.com',
            '$2b$12$87369HOssenh1lzmh8evcehlp3/ry8o8rSyyvi28afrb9mnOeVKpa',
            'Comptabilite',
            true
        ) ON CONFLICT (email) DO NOTHING;
    """)
    
    cursor.execute("""
        INSERT INTO utilisateurs (id, nom, email, mot_de_passe_hash, role, actif)
        VALUES (
            gen_random_uuid(),
            'Responsable Terrain',
            'terrain@sodecoton.com',
            '$2b$12$87369HOssenh1lzmh8evcehlp3/ry8o8rSyyvi28afrb9mnOeVKpa',
            'Responsable_terrain',
            true
        ) ON CONFLICT (email) DO NOTHING;
    """)
    
    conn.commit()
    print("✅ Utilisateurs ajoutés avec succès !")
except Exception as e:
    print(f"❌ Erreur : {e}")
finally:
    if 'conn' in locals(): conn.close()