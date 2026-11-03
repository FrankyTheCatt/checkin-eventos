from datetime import datetime, timedelta, timezone

import jwt
from sqlmodel import select

from app.config import get_settings
from app.models import User
from tests.conftest import USUARIO


def test_registro_exitoso_no_expone_la_clave(client):
    r = client.post("/api/auth/register", json=USUARIO)
    assert r.status_code == 201
    cuerpo = r.json()
    assert cuerpo["email"] == "ana@correo.cl"
    assert cuerpo["full_name"] == "Ana Pérez"
    assert cuerpo["is_active"] is True
    assert "password" not in cuerpo and "hashed_password" not in cuerpo


def test_la_clave_se_guarda_con_hash(client, session):
    client.post("/api/auth/register", json=USUARIO)
    user = session.exec(select(User)).one()
    assert user.hashed_password != USUARIO["password"]
    assert user.hashed_password.startswith("$2")  # formato bcrypt


def test_correo_duplicado_da_409(client):
    client.post("/api/auth/register", json=USUARIO)
    r = client.post("/api/auth/register", json={**USUARIO, "email": "ANA@correo.cl"})
    assert r.status_code == 409


def test_registro_valida_los_datos(client):
    assert client.post("/api/auth/register", json={**USUARIO, "email": "no-es-correo"}).status_code == 422
    assert client.post("/api/auth/register", json={**USUARIO, "password": "corta"}).status_code == 422
    assert client.post("/api/auth/register", json={**USUARIO, "full_name": " "}).status_code == 422
    # 40 letras con tilde ocupan más de 72 bytes aunque no lleguen a 72 caracteres
    assert client.post("/api/auth/register", json={**USUARIO, "password": "ñ" * 40}).status_code == 422
    assert client.post("/api/auth/register", json={"email": "a@b.cl"}).status_code == 422


def test_login_devuelve_token(client):
    client.post("/api/auth/register", json=USUARIO)
    r = client.post("/api/auth/login", json={"email": "ana@correo.cl", "password": USUARIO["password"]})
    assert r.status_code == 200
    assert r.json()["token_type"] == "bearer"
    assert r.json()["access_token"]


def test_login_con_correo_en_mayusculas(client):
    client.post("/api/auth/register", json=USUARIO)
    r = client.post("/api/auth/login", json={"email": "Ana@Correo.CL", "password": USUARIO["password"]})
    assert r.status_code == 200


def test_login_fallido_usa_el_mismo_mensaje(client):
    client.post("/api/auth/register", json=USUARIO)
    mala_clave = client.post("/api/auth/login", json={"email": "ana@correo.cl", "password": "otra-clave"})
    sin_cuenta = client.post("/api/auth/login", json={"email": "nadie@correo.cl", "password": "otra-clave"})
    assert mala_clave.status_code == sin_cuenta.status_code == 401
    assert mala_clave.json() == sin_cuenta.json()


def test_me_con_token(client, crear_usuario):
    _, cabeceras = crear_usuario()
    r = client.get("/api/auth/me", headers=cabeceras)
    assert r.status_code == 200
    assert r.json()["email"] == "ana@correo.cl"


def test_me_sin_token_da_401(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401
    assert r.headers["www-authenticate"] == "Bearer"


def test_me_con_token_invalido_da_401(client):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer esto-no-es-un-jwt"})
    assert r.status_code == 401


def test_token_firmado_con_otra_clave_da_401(client, crear_usuario):
    crear_usuario()
    falso = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        "otra-clave-distinta-de-32-caracteres-o-mas",
        algorithm="HS256",
    )
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {falso}"})
    assert r.status_code == 401


def test_token_expirado_da_401(client, crear_usuario):
    crear_usuario()
    settings = get_settings()
    vencido = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {vencido}"})
    assert r.status_code == 401


def test_token_de_usuario_inexistente_da_401(client):
    settings = get_settings()
    token = jwt.encode(
        {"sub": "999", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_usuario_desactivado_no_puede_entrar(client, session, crear_usuario):
    _, cabeceras = crear_usuario()
    user = session.exec(select(User)).one()
    user.is_active = False
    session.add(user)
    session.commit()
    assert client.get("/api/auth/me", headers=cabeceras).status_code == 401
    r = client.post("/api/auth/login", json={"email": "ana@correo.cl", "password": USUARIO["password"]})
    assert r.status_code == 401


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}
