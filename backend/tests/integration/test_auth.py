def test_login_success(client, admin_token):
    # Le token est déjà créé par la fixture, le test vérifie que le login fonctionne
    response = client.post("/api/auth/login", data={
        "username": "admin@sodecoton.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["access_token"] == admin_token  # facultatif

def test_login_failure(client):
    response = client.post("/api/auth/login", data={
        "username": "wrong@email.com",
        "password": "wrongpass"
    })
    assert response.status_code == 401