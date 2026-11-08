import pytest
from sqlmodel import select

from app.models import Attendance

EVENT = {
    "title": "Taller Angular",
    "description": "Encuentro de desarrollo web",
    "location_name": "Auditorio G6",
    "starts_at": "2026-11-20T15:00:00Z",
    "ends_at": "2026-11-20T17:00:00Z",
    "latitude": -29.9,
    "longitude": -71.25,
    "radius_m": 100,
}


@pytest.fixture
def owner(crear_usuario):
    return crear_usuario()[1]


@pytest.fixture
def visitor(crear_usuario):
    return crear_usuario(email="visitante@correo.cl")[1]


@pytest.fixture
def event(client, owner):
    response = client.post("/api/events", headers=owner, json=EVENT)
    assert response.status_code == 201, response.text
    return response.json()


def test_crud(client, owner, event):
    event_id = event["id"]
    assert event["attendance_count"] == 0
    assert event["owner_id"] > 0
    assert len(event["qr_code"]) >= 20
    assert client.get(f"/api/events/{event_id}", headers=owner).json() == event
    changed = {**EVENT, "title": "Título actualizado"}
    response = client.put(f"/api/events/{event_id}", headers=owner, json=changed)
    assert response.status_code == 200
    assert response.json()["title"] == changed["title"]
    assert response.json()["qr_code"] == event["qr_code"]
    assert client.delete(f"/api/events/{event_id}", headers=owner).status_code == 204
    assert client.get(f"/api/events/{event_id}", headers=owner).status_code == 404


@pytest.mark.parametrize("changes", [
    {"title": "  "}, {"title": "a" * 151}, {"description": "a" * 2001},
    {"latitude": 91}, {"longitude": -181}, {"latitude": None},
    {"radius_m": 0}, {"radius_m": 1.5},
    {"ends_at": EVENT["starts_at"]}, {"ends_at": "2026-11-19T17:00:00Z"},
    {"starts_at": "fecha-invalida"}, {"starts_at": "2026-11-20T15:00:00"},
    {"owner_id": 999}, {"qr_code": "elegido-por-el-cliente"},
])
def test_invalid_event_returns_422(client, owner, changes):
    assert client.post("/api/events", headers=owner, json={**EVENT, **changes}).status_code == 422


def test_only_owner_can_modify_delete_and_list_attendees(client, event, visitor):
    path = f"/api/events/{event['id']}"
    assert client.get(path, headers=visitor).status_code == 200
    assert client.put(path, headers=visitor, json=EVENT).status_code == 403
    assert client.delete(path, headers=visitor).status_code == 403
    assert client.get(path + "/attendances", headers=visitor).status_code == 403


@pytest.mark.parametrize("method,path,body", [
    ("get", "/api/events", None),
    ("post", "/api/events", EVENT),
    ("get", "/api/events/1", None),
    ("put", "/api/events/1", EVENT),
    ("delete", "/api/events/1", None),
    ("post", "/api/events/1/attendances", {}),
    ("get", "/api/events/1/attendances", None),
    ("get", "/api/attendances/me", None),
])
def test_event_routes_require_authentication(client, method, path, body):
    assert client.request(method, path, json=body).status_code == 401


def test_search_and_pagination(client, owner, event):
    for title in ["Charla Python", "Encuentro Diseño"]:
        assert client.post("/api/events", headers=owner, json={**EVENT, "title": title}).status_code == 201
    assert len(client.get("/api/events?search=angular", headers=owner).json()) == 1
    assert len(client.get("/api/events?search=auditorio", headers=owner).json()) == 3
    assert client.get("/api/events?search=inexistente", headers=owner).json() == []
    assert client.get("/api/events?search=%25", headers=owner).json() == []
    first = client.get("/api/events?limit=1", headers=owner).json()
    second = client.get("/api/events?limit=1&skip=1", headers=owner).json()
    assert len(first) == len(second) == 1
    assert first[0]["id"] != second[0]["id"]
    for query in ["skip=-1", "limit=0", "limit=101"]:
        assert client.get("/api/events?" + query, headers=owner).status_code == 422


def test_attendance_duplicate_count_and_privacy(client, owner, visitor, event, session):
    path = f"/api/events/{event['id']}"
    assert client.get("/api/attendances/me", headers=visitor).json() == []
    response = client.post(path + "/attendances", headers=visitor, json={"latitude": -29.9, "longitude": -71.25})
    assert response.status_code == 201
    attendance = response.json()
    assert attendance["event_id"] == event["id"]
    assert client.post(path + "/attendances", headers=visitor).status_code == 409
    assert client.get(path, headers=owner).json()["attendance_count"] == 1
    assert client.get("/api/events", headers=owner).json()[0]["attendance_count"] == 1
    assert client.get("/api/attendances/me", headers=visitor).json() == [attendance]
    assert client.get("/api/attendances/me", headers=owner).json() == []
    assert client.get(path + "/attendances", headers=owner).json() == [attendance]
    assert client.delete(path, headers=owner).status_code == 204
    assert session.exec(select(Attendance)).all() == []


def test_missing_events_and_invalid_attendance(client, owner, event):
    for method, suffix in [("get", ""), ("put", ""), ("delete", ""), ("post", "/attendances"), ("get", "/attendances")]:
        kwargs = {"json": EVENT} if method == "put" else {}
        assert client.request(method, "/api/events/9999" + suffix, headers=owner, **kwargs).status_code == 404
    path = f"/api/events/{event['id']}/attendances"
    assert client.post(path, headers=owner, json={"latitude": -91, "longitude": 0}).status_code == 422
    assert client.post(path, headers=owner, json={"latitude": 0}).status_code == 422
    assert client.post(path, headers=owner).status_code == 201
