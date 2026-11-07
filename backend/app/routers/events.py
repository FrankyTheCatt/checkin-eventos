from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

# Importamos la base de datos y los modelos (verifica que se llamen así en tus archivos)
from app.database import get_session
from app.models import Event
from app.deps import get_current_user

import uuid

router = APIRouter(prefix="/events", tags=["events"])

@router.get("")
def listar_eventos(search: str = "", skip: int = 0, limit: int = 50, db: Session = Depends(get_session)):
    query = select(Event)
    if search:
        # Filtra si escriben algo en la barra de búsqueda de Angular
        query = query.where(Event.title.contains(search) | Event.location_name.contains(search))
    
    eventos = db.exec(query.offset(skip).limit(limit)).all()
    return eventos

@router.post("")
def crear_evento(evento: Event, db: Session = Depends(get_session), usuario_actual = Depends(get_current_user)):
    # Le asignamos el ID del usuario que inició sesión como dueño del evento
    evento.owner_id = usuario_actual.id

    # Generamos un código QR único si no viene uno
    if not evento.qr_code:
        evento.qr_code = str(uuid.uuid4())

    db.add(evento)
    db.commit()
    db.refresh(evento)
    return evento

@router.get("/{event_id}")
def obtener_evento(event_id: int, db: Session = Depends(get_session)):
    evento = db.get(Event, event_id)
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    return evento