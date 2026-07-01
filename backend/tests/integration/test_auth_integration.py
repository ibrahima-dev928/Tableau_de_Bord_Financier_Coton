def test_create_achat(client, admin_token, test_data):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "producteur_id": test_data["producteur_id"],
        "zone_id": test_data["zone_id"],
        "quantite_kg": 500,
        "prix_kg": 250,
        "date_achat": "2026-06-26T10:00:00Z"
    }
    response = client.post("/api/achats/", json=payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["statut"] == "en_attente"

def test_generate_excel_report(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "type": "KPIMensuel",
        "periode_debut": "2026-06-01",
        "periode_fin": "2026-06-30",
        "format": "Excel"
    }
    response = client.post("/api/rapports/", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Rapport généré avec succès"