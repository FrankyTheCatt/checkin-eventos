# CheckIn Eventos

Aplicación web full stack para gestionar eventos y registrar la asistencia de los usuarios.
Proyecto del **Taller 2** de Introducción al Desarrollo Web/Móvil (UCN).

- **Frontend:** Angular + Angular Material
- **Backend:** FastAPI (API REST con JSON)
- **Base de datos:** PostgreSQL con SQLModel/SQLAlchemy como ORM
- **Autenticación:** JWT (contraseñas con bcrypt)

La división del trabajo entre los cuatro integrantes está en [`docs/DIVISION.md`](docs/DIVISION.md)
y el contrato de la API en [`docs/API.md`](docs/API.md).

## Estructura

```
checkin-eventos/
├── backend/            API FastAPI y pruebas
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── security.py
│   │   ├── deps.py
│   │   ├── routers/
│   │   └── schemas/
│   └── tests/
├── frontend/           Aplicación Angular
├── docs/
├── docker-compose.yml  PostgreSQL para desarrollo local
└── .env.example
```

## Cómo ejecutar

### Requisitos

- Docker Desktop (o Docker Engine) con Docker Compose
- Python 3.11 o superior
- Node.js y npm

### 1. Configurar variables de entorno

Desde la raíz del repositorio, crea el archivo `.env` a partir de la plantilla:

```powershell
Copy-Item .env.example .env
```

En Linux o macOS, usa `cp .env.example .env`.

Abre `.env` y cambia `POSTGRES_PASSWORD` y `JWT_SECRET`. Puedes generar un secreto JWT con:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Usa el mismo valor de contraseña en `POSTGRES_PASSWORD` y en la contraseña de `DATABASE_URL`.
No compartas ni subas `.env`; el archivo está excluido de Git.

### 2. Iniciar la base de datos

```bash
docker compose up -d db
docker compose ps
```

Esto inicia PostgreSQL 16, disponible en `127.0.0.1:5433` según `POSTGRES_PORT` en `.env`.
Las tablas se crean automáticamente al iniciar el backend. Para detener la base sin borrar
sus datos, ejecuta `docker compose down` desde la raíz; evita `docker compose down -v` si
quieres conservarlos.

### 3. Iniciar el backend

En una terminal nueva:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

En Linux o macOS, activa el entorno con `source .venv/bin/activate` en lugar de
`.\.venv\Scripts\Activate.ps1`.

El backend lee las variables del `.env` de la raíz. La API queda en
<http://127.0.0.1:8000> y su documentación interactiva (Swagger) en
<http://127.0.0.1:8000/docs>.

### 4. Iniciar el frontend

En otra terminal:

```powershell
cd frontend
npm ci
npm start -- --host 127.0.0.1 --port 4200
```

Abre <http://127.0.0.1:4200>. El backend debe estar ejecutándose para que funcionen
el registro, el inicio de sesión y las funciones de eventos.

### Pruebas

Backend, desde la carpeta `backend` y con el entorno virtual activado:

```powershell
python -m pytest
```

Frontend, desde la carpeta `frontend`:

```powershell
npm test -- --watch=false
npm run build
```

Las pruebas del backend usan SQLite en memoria por defecto y no modifican la base de desarrollo.
