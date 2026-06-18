import psycopg2
import time

DATABASE_URL = "postgresql://sodecoton_user:3C876OSICJgc5Lp4fMmx1RL5QXCN282k@dpg-d8pc67jeo5us73ad20j0-a.oregon-postgres.render.com/sodecoton_db?sslmode=require"

print("Tentative de réveil de la base de données...")
time.sleep(2)

try:
    # Connexion avec un timeout de 30 secondes
    conn = psycopg2.connect(DATABASE_URL, connect_timeout=30)
    cursor = conn.cursor()
    cursor.execute("SELECT 1;")
    print("✅ Base de données réveillée avec succès !")
    conn.close()
except Exception as e:
    print(f"❌ Échec du réveil : {e}")
    print("\n👉 Essayez plutôt d'utiliser un VPN ou de partager la connexion 4G.")