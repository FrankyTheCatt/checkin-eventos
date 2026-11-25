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
│   └── android/        Proyecto Android nativo (Capacitor)
├── .github/workflows/  Workflow que genera el APK
├── docs/
├── docker-compose.yml  PostgreSQL para desarrollo local
└── .env.example
```

## Cómo ejecutar

### Requisitos

- Docker Desktop (o Docker Engine) con Docker Compose
- Python 3.11 o superior
- Node.js **24.15 o superior** (o 22.22.3 o superior en la rama 22) y npm. Angular CLI 22 no
  arranca con versiones anteriores; revisa la tuya con `node --version`.

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

## App Android (Taller 3)

La app Angular se empaqueta como aplicación Android nativa utilizando **Capacitor**, incorporando funcionalidades de hardware y sensores del dispositivo móvil integradas al flujo de check-in:

### Capacidades Móviles Implementadas

1. **Cámara y Lectura de Códigos QR (RA5 - 15%):**
   * Escaneo en tiempo real mediante cámara con visor interactivo en pantalla y detección con `jsQR`.
   * Opción alternativa mediante el plugin `@capacitor/camera` para capturar foto o seleccionar imagen de código QR desde la galería.
   * Al escanear el QR generado por el organizador de un evento, la app identifica automáticamente el evento y valida la asistencia.

2. **Ubicación GPS y Geolocalización (RA5 - 15% / RA6 - 10%):**
   * Integración con `@capacitor/geolocation` (y Web Geolocation API como fallback).
   * Al crear o editar eventos, permite pulsar *"Usar mi ubicación GPS actual"* para registrar las coordenadas del lugar.
   * Al registrar asistencia, obtiene las coordenadas reales del dispositivo y valida si el asistente se encuentra dentro del radio permitido (`radius_m`) mediante la fórmula de Haversine. Las coordenadas quedan registradas y persistidas en el backend (`attendances`).

3. **Sensor del Dispositivo: Acelerómetro (RA5 - 15%):**
   * Detección de movimiento mediante `@capacitor/motion` (y `DeviceMotionEvent`).
   * Funcionalidad **"Shake to Refresh" (Agitar para recargar)**: Al sacudir el teléfono en la lista de eventos o en el detalle de un evento, los datos y asistentes se actualizan automáticamente con aviso visual (`MatSnackBar`).
   * Incluye botón para simular agitar el dispositivo en entornos de prueba o navegadores de escritorio.

4. **Gestión de Permisos y Manejo de Errores (RA5 - 5%):**
   * Permisos declarados en `AndroidManifest.xml` (`CAMERA`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`).
   * Solicitud en tiempo de ejecución, con retroalimentación clara si el usuario rechaza permisos y métodos alternativos (código manual, carga de archivo).

### Requisitos

- Android Studio con el Android SDK
- JDK 21
- Node.js y npm según los requisitos de la sección [Cómo ejecutar](#requisitos)

### Generar el APK localmente

```powershell
cd frontend
npm ci
npm run android:sync
cd android
.\gradlew.bat assembleDebug
```

En Linux o macOS, usa `./gradlew assembleDebug`. El APK queda en
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

### Probar en un teléfono real

Activa la depuración USB en el teléfono, conéctalo al computador y, desde `frontend`, ejecuta
`npx cap run android` para instalar y abrir la app. Con `npx cap open android` se abre el
proyecto en Android Studio para ejecutarlo desde ahí.

### Descargar el APK desde GitHub Actions (CI/CD)

El repositorio cuenta con integración continua configurada en `.github/workflows/android.yml`:
1. Ante cada `push` a la rama principal (`main`) o ejecución manual (`workflow_dispatch`), GitHub Actions compila automáticamente Angular en modo móvil, sincroniza con Capacitor y compila el APK con Gradle.
2. Abre la pestaña **Actions** del repositorio en GitHub.
3. Entra a la última ejecución del workflow **APK Android**.
4. Descarga el artefacto generado: `checkin-eventos-debug-apk`.

### CORS

El backend permite los orígenes `https://localhost` y `capacitor://localhost` en
`CORS_ORIGINS` para que la app Android pueda llamar a la API. Ya vienen incluidos por defecto.
