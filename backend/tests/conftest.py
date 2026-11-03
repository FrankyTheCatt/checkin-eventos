"""Configuración común de las pruebas.

Por defecto usan SQLite en memoria. Con TEST_DATABASE_URL se prueba contra PostgreSQL
(usar una base distinta de la de desarrollo: las tablas se borran al terminar).
"""

import os

# Deben definirse antes de importar la aplicación, que lee la configuración al cargarse.
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET", "secreto-solo-para-pruebas-0123456789abcdef")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app import models  # noqa: F401  (registra las tablas)
from app.database import get_session
from app.main import app


def _crear_engine():
    url = os.environ.get("TEST_DATABASE_URL")
    if url:
        return create_engine(url)
    return create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )


@pytest.fixture(name="engine")
def engine_fixture():
    engine = _crear_engine()
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(name="session")
def session_fixture(engine):
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(engine):
    def _get_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = _get_session
    # Sin "with": no se ejecuta el lifespan, que crearía tablas en la base de desarrollo.
    yield TestClient(app)
    app.dependency_overrides.clear()


# Datos de ejemplo y utilidades para los demás paquetes.
USUARIO = {"email": "ana@correo.cl", "full_name": "Ana Pérez", "password": "clave-segura-1"}


@pytest.fixture
def crear_usuario(client):
    """Registra un usuario y devuelve (datos, cabeceras con el token)."""

    def _crear(**cambios):
        datos = {**USUARIO, **cambios}
        r = client.post("/api/auth/register", json=datos)
        assert r.status_code == 201, r.text
        r = client.post("/api/auth/login", json={"email": datos["email"], "password": datos["password"]})
        assert r.status_code == 200, r.text
        return datos, {"Authorization": f"Bearer {r.json()['access_token']}"}

    return _crear
