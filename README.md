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
├── backend/            API FastAPI
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
├── frontend/           Angular 22 + Angular Material
├── docs/
├── docker-compose.yml  PostgreSQL para desarrollo
└── .env.example
```

## Cómo ejecutar

### 1. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y cambia la clave de PostgreSQL y el `JWT_SECRET`
(`python -c "import secrets; print(secrets.token_urlsafe(48))"`). El `.env` no se sube al repositorio.

### 2. Base de datos

```bash
docker compose up -d db
```

Levanta PostgreSQL 16 en el puerto 5432 con los datos del `.env`. Las tablas se crean
automáticamente cuando arranca el backend.

### 3. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    |    Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Documentación interactiva (Swagger): http://localhost:8000/docs

El backend lee el `.env` de la raíz del repositorio.

### 4. Frontend

Requiere Node.js 22.22.3 o superior (24.15+ recomendado). Con el backend y la base de datos ya iniciados:

```bash
cd frontend
npm ci
npm start -- --host 127.0.0.1 --port 4200
```

Abre http://127.0.0.1:4200. La URL de la API está en `frontend/src/environments/environment.ts`
(`http://127.0.0.1:8000/api`). Más detalles en [`frontend/README.md`](frontend/README.md).

## Pruebas del backend

```bash
cd backend
pytest
```

Por defecto las pruebas usan una base SQLite en memoria. Para correrlas contra PostgreSQL:

```bash
TEST_DATABASE_URL=postgresql+psycopg://usuario:clave@localhost:5432/checkin_test pytest
```
