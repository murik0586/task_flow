from app.core.security import create_access_token


def test_register_success(client):
    resp = client.post("/api/v1/auth/register", json={
        "email": "test@mymailample.com",
        "password": "secret123",
        "first_name": "Test",
        "last_name": "User",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test@mymailample.com"
    assert data["first_name"] == "Test"
    assert data["last_name"] == "User"
    assert "id" in data


def test_register_duplicate_email(client):
    client.post("/api/v1/auth/register",
                json={"email": "dup@mymail.com",
                      "password": "pass"})
    resp = client.post("/api/v1/auth/register",
                       json={"email": "dup@mymail.com",
                             "password": "pass"})
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Email already registered"


def test_login_success(client):
    client.post("/api/v1/auth/register",
                json={"email": "login@mymail.com",
                      "password": "pass"})
    resp = client.post("/api/v1/auth/login",
                       json={"email": "login@mymail.com",
                             "password": "pass"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_oauth_success(client):
    client.post("/api/v1/auth/register",
                json={"email": "oauth@mymail.com",
                      "password": "pass"})
    resp = client.post(
        "/api/v1/auth/login/oauth",
        data={"username": "oauth@mymail.com", "password": "pass"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_invalid_password(client):
    client.post("/api/v1/auth/register",
                json={"email": "bad@mymail.com",
                      "password": "correct"})
    resp = client.post("/api/v1/auth/login",
                       json={"email": "bad@mymail.com",
                             "password": "wrong"})
    assert resp.status_code == 401


def test_refresh_token_success(client):
    client.post("/api/v1/auth/register",
                json={"email": "refresh@mymail.com",
                      "password": "pass"})
    login = client.post("/api/v1/auth/login",
                        json={"email": "refresh@mymail.com",
                              "password": "pass"})
    refresh = login.json()["refresh_token"]
    resp = client.post("/api/v1/auth/refresh",
                       json={"refresh_token": refresh})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_refresh_invalid_token(client):
    resp = client.post("/api/v1/auth/refresh",
                       json={"refresh_token": "bad.token"})
    assert resp.status_code == 401


def test_change_password_success(client):
    client.post("/api/v1/auth/register",
                json={"email": "changeme@mymail.com",
                      "password": "old"})
    login = client.post("/api/v1/auth/login",
                        json={"email": "changeme@mymail.com",
                              "password": "old"})
    token = login.json()["access_token"]
    resp = client.post("/api/v1/auth/change-password",
                       json={"old_password": "old",
                             "new_password": "new123"},
                       headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    # старый пароль не должен работать
    assert client.post("/api/v1/auth/login",
                       json={"email": "changeme@mymail.com",
                             "password": "old"}).status_code == 401
    # новый должен
    assert client.post("/api/v1/auth/login",
                       json={"email": "changeme@mymail.com",
                             "password": "new123"}).status_code == 200


def test_change_password_wrong_old(client):
    client.post("/api/v1/auth/register",
                json={"email": "wrongold@mymail.com",
                      "password": "real"})
    login = client.post("/api/v1/auth/login",
                        json={"email": "wrongold@mymail.com",
                              "password": "real"})
    token = login.json()["access_token"]
    resp = client.post("/api/v1/auth/change-password",
                       json={"old_password": "wrong",
                             "new_password": "new"},
                       headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Incorrect old password"


def test_change_password_same_as_old(client):
    client.post("/api/v1/auth/register",
                json={"email": "samepwd@mymail.com",
                      "password": "same"})
    login = client.post("/api/v1/auth/login",
                        json={"email": "samepwd@mymail.com",
                              "password": "same"})
    token = login.json()["access_token"]
    resp = client.post("/api/v1/auth/change-password",
                       json={"old_password": "same",
                             "new_password": "same"},
                       headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 400
    assert resp.json()["detail"] == ("New password must be different " +
                                     "from old password")


def test_change_password_unauthorized(client):
    resp = client.post("/api/v1/auth/change-password",
                       json={"old_password": "x", "new_password": "y"})
    assert resp.status_code == 401


def test_mymailpired_token(client):
    mymailpired_token = create_access_token(data={"sub": "1", "iat": 0})
    resp = client.post("/api/v1/auth/change-password",
                       json={"old_password": "a", "new_password": "b"},
                       headers={
                           "Authorization": f"Bearer {mymailpired_token}"})
    assert resp.status_code == 401
