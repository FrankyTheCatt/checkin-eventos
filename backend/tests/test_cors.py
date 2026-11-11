import pytest


@pytest.mark.parametrize("origen", ["https://localhost", "capacitor://localhost"])
def test_origen_movil_recibe_cabecera_cors(client, origen):
    r = client.options(
        "/api/health",
        headers={
            "Origin": origen,
            "Access-Control-Request-Method": "GET",
        },
    )
    assert r.headers["access-control-allow-origin"] == origen


def test_origen_no_permitido_no_recibe_cabecera_cors(client):
    r = client.options(
        "/api/health",
        headers={
            "Origin": "https://malicioso.example",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert "access-control-allow-origin" not in r.headers
