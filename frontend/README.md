# Frontend de CheckIn Eventos

Angular 22 con componentes standalone, Angular Material y SCSS.

```powershell
npm ci
npm start -- --host 127.0.0.1 --port 4200
```

Abre http://127.0.0.1:4200. FastAPI debe estar iniciado en el puerto 8000. Consulta el [README principal](../README.md) para preparar PostgreSQL y el backend.

```powershell
npm run build
npm test -- --watch=false
```

La URL de la API está en `src/environments/environment.ts`. La sesión usa Signals, guard e interceptor. El listado de eventos usa `httpResource()` con búsqueda y paginación reactivas. Crear y editar comparten un formulario reactivo; eliminar requiere confirmación. Las páginas incluyen carga, error, reintento y estado sin resultados.

La aplicación incluye registro, login, listado, detalle y perfil. La barra de navegación, las tarjetas de eventos, el estado vacío y la confirmación son componentes reutilizables. El diseño adapta las tarjetas y formularios a una sola columna en móviles.
