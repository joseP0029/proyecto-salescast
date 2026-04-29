from fastapi.testclient import TestClient
from main import app
import uuid
from database import Base, engine

client = TestClient(app)
# Crear tablas antes de tests
Base.metadata.create_all(bind=engine)


def test_login():
    response = client.post("/api/auth/login", json={
        "email": "test@test.com",
        "password": "123456"
    })
    assert response.status_code in [200, 401]

def test_register_and_login():
    email = f"{uuid.uuid4()}@test.com"

    register_response = client.post("/api/auth/register", json={
        "organization_name": "Test Org",  
        "email": email,
        "password": "123456"
    })

    assert register_response.status_code == 201  

    login_response = client.post("/api/auth/login", json={
        "email": email,
        "password": "123456"
    })

    assert login_response.status_code == 200