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
| GET | `/api/events/{id}/qr` | Sí | Obtiene el código QR (solo el dueño, 403 si no) |
| PUT | `/api/events/{id}` | Sí | Modifica (solo el dueño) |
| DELETE | `/api/events/{id}` | Sí | Elimina (solo el dueño) y sus asistencias. 204 |

## Asistencias (paquete 2)

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| POST | `/api/events/{id}/attendances` | Sí | Registra la asistencia del usuario. Cuerpo opcional `{ latitude, longitude }`. 409 si ya estaba registrado |
| GET | `/api/events/{id}/attendances` | Sí | Asistentes del evento (solo el dueño) |
| GET | `/api/attendances/me` | Sí | Registros de asistencia del usuario del token |

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
  "owner_id": 1, "attendance_count": 0
}
```

El código QR no se incluye en las respuestas normales del evento. Solo el dueño puede obtenerlo mediante `GET /api/events/{id}/qr`, que responde `{ "qr_code": "token-unico" }`. Angular lo convierte localmente en una imagen para mostrarlo en el detalle. Por ahora, el QR se muestra, pero no se utiliza para validar el registro de asistencia.

`Attendance`
```json
{ "id": 1, "event_id": 1, "user_id": 2, "checked_in_at": "2026-11-20T15:05:00Z", "latitude": -29.9, "longitude": -71.25 }
```

Las tablas están definidas en `backend/app/models.py` (paquete 1). Si alguien necesita cambiar una columna,
lo avisa al grupo antes, porque afecta a los demás.

## Validaciones de eventos

El cuerpo de POST y PUT contiene `title`, `description`, `location_name`, `latitude`, `longitude`, `radius_m`, `starts_at` y `ends_at`. PUT reemplaza los campos editables; `id`, `owner_id`, `qr_code` y `attendance_count` son de solo lectura y no se envían.

El título se recorta y admite de 1 a 150 caracteres; descripción hasta 2000 y lugar hasta 200. Las fechas deben incluir zona horaria, se normalizan a UTC y el término debe ser posterior al inicio. Latitud (-90 a 90) y longitud (-180 a 180) se envían juntas o ambas como null. El radio admite enteros entre 1 y 100000.

La búsqueda admite hasta 200 caracteres. `skip` es un entero mayor o igual a cero; `limit` admite de 1 a 100, con 50 por defecto. La respuesta es una lista ordenada por inicio e ID, sin total global. `attendance_count` cuenta los registros existentes.

Crear evento y registrar asistencia responden 201. Todas las rutas de eventos y asistencias requieren JWT. Solo el dueño consulta asistentes, edita y elimina. Una segunda asistencia del mismo usuario responde 409. Eliminar un evento elimina también sus asistencias.
