"""Rutas de asistencias (PAQUETE 2).

Contrato en docs/API.md y tareas en docs/DIVISION.md. El router ya está registrado en app/main.py.
Incluye las rutas /events/{id}/attendances y /attendances/me, por eso no lleva prefijo propio.
"""

from fastapi import APIRouter

router = APIRouter(tags=["attendances"])
