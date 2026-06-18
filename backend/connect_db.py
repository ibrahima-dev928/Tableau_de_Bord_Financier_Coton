import psycopg2
import time

DATABASE_URL = "postgresql://sodecoton_user:3C876OSICJgc5Lp4fMmx1RL5QXCN282k@dpg-d8pc67jeo5us73ad20j0-a.oregon-postgres.render.com/sodecoton_db?sslmode=require"

print("🔌 Tentative de connexion (timeout 60s)...")
time.sleep(2)
try:
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=60)
    print("✅ Connexion réussie !")
    conn.close()
except Exception as e:
    print(f"❌ Échec : {e}")