"""Rutas de eventos (PAQUETE 2).

Contrato en docs/API.md y tareas en docs/DIVISION.md. Esta rama arranca vacía a propósito:
el router ya está registrado en app/main.py bajo /api/events, solo faltan las rutas.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/events", tags=["events"])
