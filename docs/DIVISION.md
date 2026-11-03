# División del trabajo (4 integrantes)

La pauta del taller evalúa 60 % producto y 40 % interrogación a **cualquier** integrante.
Por eso el trabajo se reparte en cuatro paquetes del mismo tamaño y cada uno revisa el de otro
(ver "Revisión cruzada"). Los paquetes se apoyan en el contrato de [`API.md`](API.md), así que se
puede trabajar en paralelo sin esperar a los demás.

| # | Paquete | Responsable | Carpeta | Estado |
|---|---|---|---|---|
| 1 | Base del backend: modelos, base de datos y autenticación JWT | Nicolás | `backend/app/{config,database,models,security,deps}.py`, `routers/auth.py` | Listo |
| 2 | Backend de eventos y asistencias: CRUD, validaciones y pruebas | _por asignar_ | `backend/app/routers/events.py`, `routers/attendances.py`, `schemas/event.py` | Pendiente |
| 3 | Frontend base: proyecto Angular, navegación, sesión, guard e interceptor | _por asignar_ | `frontend/` (crea el proyecto) | Pendiente |
| 4 | Frontend de eventos: listado, detalle, formularios y estados de la interfaz | _por asignar_ | `frontend/src/app/events/` | Pendiente |

Pueden intercambiar paquetes, pero cada integrante debe quedar con uno y anotar su nombre en esta tabla.

---

## Paquete 1: base del backend (listo)

Incluye el modelo de datos con tres tablas (`users`, `events`, `attendances`, con claves foráneas),
la conexión a PostgreSQL con SQLModel, registro, login, JWT, contraseñas con bcrypt, la dependencia
`get_current_user` para proteger rutas y las pruebas de autenticación.

Indicadores de la pauta que cubre: ORM y PostgreSQL, registro e inicio de sesión con contraseñas seguras,
JWT con endpoints protegidos, parte de la API REST.

Cómo se usa desde otros paquetes:

```python
from app.deps import CurrentUser, SessionDep

@router.get("/algo")
def algo(user: CurrentUser, session: SessionDep):
    ...
```

## Paquete 2: backend de eventos y asistencias

Rutas `/api/events` y `/api/events/{id}/attendances` según [`API.md`](API.md).

Tareas:
1. Schemas de entrada y salida en `schemas/event.py` (crear, actualizar, leer). Validar: título no vacío,
   latitud entre -90 y 90, longitud entre -180 y 180, `ends_at` posterior a `starts_at`.
2. CRUD completo de eventos. Solo el dueño modifica o elimina (403 si no). Al crear, generar `qr_code`
   con `secrets.token_urlsafe(16)`.
3. Búsqueda por texto con `search` y paginación con `skip`/`limit`.
4. Asistencias: registrar (409 si ya existe), listar para el dueño y listar las propias.
5. Errores claros (404, 403, 409, 422) y pruebas en `backend/tests/` (usar `conftest.py`).
6. Registrar los routers en `app/main.py` (ya están importados y vacíos).

Indicadores: API REST funcional, CRUD completo, validación de datos y manejo de errores.

## Paquete 3: frontend base

Crea la carpeta `frontend/` con Angular (última versión estable) y Angular Material.

Tareas:
1. `ng new frontend --routing --style=scss` (componentes standalone) y agregar Angular Material.
2. Layout con `MatToolbar`/`MatSidenav`, responsive (menú que se colapsa en móvil).
3. Rutas con Angular Router: `/login`, `/registro`, `/eventos` (la implementa el paquete 4) y `/perfil`.
4. `AuthService` con **Signals** (`usuario`, `token`, `autenticado`) que guarda el token y llama a
   `/api/auth/*`. Debe exponer `login()`, `registrar()`, `logout()` y cargar el usuario con `/me`.
5. **Guard** `authGuard` que redirige a `/login` si no hay sesión (y uno inverso para login/registro).
6. **Interceptor** que agrega `Authorization: Bearer` y, ante un 401, cierra la sesión.
7. Páginas de login y registro con **Reactive Forms** y mensajes de validación; `MatSnackBar` para errores.
8. `environment` con la URL de la API (`http://localhost:8000/api`) y proxy o CORS ya habilitado en el backend.
9. Completar el apartado "Frontend" del `README.md`.

Indicadores: Angular + componentes + Router, formularios reactivos, Signals, Guards e Interceptors, servicios.

## Paquete 4: frontend de eventos

Carpeta `frontend/src/app/events/`. Parte cuando el paquete 3 deje el proyecto creado (mientras tanto
puede trabajar con datos de ejemplo contra la API de Swagger en `http://localhost:8000/docs`).

Tareas:
1. `EventsService` (todo el acceso HTTP va aquí, no en los componentes).
2. Página de listado con **`httpResource()`** que depende de un **Signal** de búsqueda y paginación;
   `MatTable` o `MatCard`, con `MatProgressSpinner` al cargar y mensaje cuando no hay resultados.
3. Detalle del evento con sus asistentes (si el usuario es el dueño) y botón para registrar asistencia.
4. Formulario de crear y editar con **Reactive Forms** y validaciones (en `MatDialog` o página propia).
5. Eliminar con confirmación en `MatDialog`; `MatSnackBar` para éxito y error.
6. Componentes reutilizables (por ejemplo `event-card`, `empty-state`, `confirm-dialog`).
7. Diseño responsive para computador y móvil.

Indicadores: `httpResource`/`resource`, Signals, Reactive Forms, Angular Material responsive,
estados de la interfaz (cargando, éxito, error, sin resultados, formulario inválido).

---

## Cómo trabajar sin pisarse

- Una rama por paquete: `pkg2-eventos-backend`, `pkg3-frontend-base`, `pkg4-frontend-eventos`.
- Commits pequeños y con mensaje claro. Pull Request hacia `main` y revisión de otro integrante.
- No tocar archivos de otro paquete sin avisar. Si hay que cambiar `models.py` o `API.md`, se conversa antes.
- Nunca subir `.env`, claves ni el secreto JWT.

## Revisión cruzada (para la interrogación)

Cada paquete lo revisa el siguiente: 1 revisa 2, 2 revisa 3, 3 revisa 4 y 4 revisa 1.
Antes de entregar, cada integrante debe poder explicar con sus palabras este flujo completo:

1. El usuario envía el formulario de login (Reactive Forms) en Angular.
2. `AuthService` llama a `POST /api/auth/login` y guarda el JWT en un Signal.
3. El Interceptor agrega el token a cada petición y el Guard protege las rutas.
4. FastAPI valida el token (`get_current_user`), consulta con el ORM en PostgreSQL y responde JSON.
5. `httpResource()` vuelve a pedir los datos cuando cambia un Signal y la vista se actualiza.

## Entrega

Enlace al repositorio con `README.md` que explique cómo ejecutar frontend, backend y base de datos,
sin contraseñas ni secretos dentro del repositorio. Fecha límite: domingo 8 de noviembre de 2026, 23:59.
