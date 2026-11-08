# Verificación del taller

Implementación basada en la rama `frontend`, con los paquetes 2, 3 y 4 integrados.

## Issues de referencia

- #1, paquete 2: schemas, CRUD protegido, búsqueda y paginación, asistencias y pruebas.
- #2, paquete 3: sesión, navegación responsive con MatToolbar, guards, interceptor, formularios y perfil.
- #3, paquete 4: recursos reactivos, listado, detalle, crear, editar, eliminar con confirmación y estados de interfaz.

## Correspondencia con el taller

| Requisito | Implementación |
|---|---|
| Angular y al menos cuatro vistas | Login, registro, eventos, detalle y perfil mediante Router |
| Angular Material responsive | Toolbar, cards, diálogos, formularios, botones, snackbar y spinner |
| Componentes reutilizables | Nav, EventCard, EmptyState, ConfirmDialog y EventForm |
| Servicios | AuthService y EventsService |
| Signals | Sesión, búsqueda, página, tamaño de página y estado de guardado |
| resource / rxResource / httpResource | httpResource en los servicios de listado, detalle y asistencias |
| Reactive Forms y validaciones | Login, registro y crear/editar eventos |
| Guard e interceptor | authGuard, guestGuard y authInterceptor |
| FastAPI y JSON | Rutas /api/auth, /api/events y /api/attendances |
| ORM y PostgreSQL | SQLModel con User, Event y Attendance relacionados |
| CRUD completo | Crear, consultar, editar y eliminar eventos desde Angular |
| Autenticación | bcrypt, JWT, perfil, inicio y cierre de sesión |
| Protección de endpoints | CurrentUser y comprobación del dueño en el backend |
| Estados de interfaz | Carga, error, reintento, éxito, vacío y formulario inválido |
| Sin secretos en Git | .env ignorado, .env.example sin credenciales reales |

## Pruebas ejecutadas

- Backend: 43 pruebas automatizadas; se ejecutan en SQLite en memoria y en una base PostgreSQL separada.
- Frontend: 17 pruebas de servicios, sesión, guards, interceptor, listado, detalle y formulario de creación/edición.
- Compilación de producción de Angular: correcta, paquete inicial de 433,38 kB dentro del presupuesto de 500 kB.
- Verificación de integración con PostgreSQL: registro, login, CRUD, permisos del dueño, asistencia duplicada, contador, borrado en cascada y CORS.

## Validación manual sugerida

1. Registrar dos cuentas e iniciar sesión con la primera.
2. Crear un evento y comprobar que aparece en el listado y el detalle.
3. Editar título y fechas; intentar guardar un título vacío y un término anterior al inicio.
4. Buscar por título y lugar. Crear más de seis eventos y cambiar de página.
5. Registrar asistencia y comprobar que el botón cambia a Asistencia registrada.
6. Abrir Mi perfil y revisar la asistencia.
7. Entrar con la segunda cuenta: no debe ver editar, eliminar ni la lista privada de asistentes.
8. Registrar su asistencia y volver con la primera cuenta para comprobar el contador y la lista.
9. Cancelar la eliminación y comprobar que el evento sigue existiendo.
10. Confirmar la eliminación y comprobar que el evento y sus asistencias desaparecen.
11. Cerrar sesión e intentar abrir /eventos directamente: debe redirigir al login.
12. Repetir en una ventana de 390 px de ancho y comprobar formularios, tarjetas y navegación.
