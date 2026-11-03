# Contrato de la API

Todas las rutas cuelgan de `/api`. Los datos se envían y reciben en JSON.
Las rutas protegidas necesitan la cabecera `Authorization: Bearer <token>`.

Errores: siempre `{"detail": "mensaje"}` con el código HTTP correspondiente
(400 datos inválidos, 401 sin sesión, 403 sin permiso, 404 no existe, 409 conflicto, 422 validación).

## Autenticación (paquete 1, listo)

| Método | Ruta | Protegida | Cuerpo | Respuesta |
|---|---|---|---|---|
| POST | `/api/auth/register` | No | `{ email, full_name, password }` | 201 `User` |
| POST | `/api/auth/login` | No | `{ email, password }` | 200 `{ access_token, token_type }` |
| GET | `/api/auth/me` | Sí | - | 200 `User` |

Reglas: `password` entre 8 y 72 caracteres; el correo es único (409 si ya existe);
credenciales incorrectas devuelven 401 con el mismo mensaje para correo o clave.

## Eventos (paquete 2)

Entidad principal del CRUD. Un usuario solo puede modificar o eliminar los eventos que creó (403 si no).

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| GET | `/api/events` | Sí | Lista. Parámetros opcionales: `search` (texto en título/lugar), `skip`, `limit` |
| POST | `/api/events` | Sí | Crea un evento (el dueño es el usuario del token) |
| GET | `/api/events/{id}` | Sí | Detalle |
| PUT | `/api/events/{id}` | Sí | Modifica (solo el dueño) |
| DELETE | `/api/events/{id}` | Sí | Elimina (solo el dueño) y sus asistencias. 204 |

## Asistencias (paquete 2)

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| POST | `/api/events/{id}/attendances` | Sí | Registra la asistencia del usuario. Cuerpo opcional `{ latitude, longitude }`. 409 si ya estaba registrado |
| GET | `/api/events/{id}/attendances` | Sí | Asistentes del evento (solo el dueño) |
| GET | `/api/attendances/me` | Sí | Eventos a los que asistió el usuario del token |

## Modelos

`User`
```json
{ "id": 1, "email": "ana@correo.cl", "full_name": "Ana Pérez", "is_active": true, "created_at": "2026-11-03T20:00:00Z" }
```

`Event`
```json
{
  "id": 1, "title": "Charla de ciberseguridad", "description": "…",
  "location_name": "Auditorio G6", "latitude": -29.9, "longitude": -71.25, "radius_m": 100,
  "starts_at": "2026-11-20T15:00:00Z", "ends_at": "2026-11-20T17:00:00Z",
  "qr_code": "token-unico", "owner_id": 1, "attendance_count": 0
}
```

`Attendance`
```json
{ "id": 1, "event_id": 1, "user_id": 2, "checked_in_at": "2026-11-20T15:05:00Z", "latitude": -29.9, "longitude": -71.25 }
```

Las tablas están definidas en `backend/app/models.py` (paquete 1). Si alguien necesita cambiar una columna,
lo avisa al grupo antes, porque afecta a los demás.
