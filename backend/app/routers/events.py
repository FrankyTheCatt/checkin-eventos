import secrets
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlmodel import func, select

from app.deps import CurrentUser, SessionDep
from app.models import Attendance, Event
from app.schemas.event import EventCreate, EventQrRead, EventRead, EventUpdate

router = APIRouter(prefix="/events", tags=["events"])


def find_event(event_id: int, session) -> Event:
    event = session.get(Event, event_id)
    if event is None:
        raise HTTPException(404, "Evento no encontrado")
    return event


def require_owner(event: Event, user) -> None:
    if event.owner_id != user.id:
        raise HTTPException(403, "Solo el dueño puede realizar esta acción")


def read_event(event: Event, session) -> EventRead:
    count = session.exec(select(func.count()).select_from(Attendance).where(Attendance.event_id == event.id)).one()
    return EventRead.model_validate(event).model_copy(update={"attendance_count": count})


@router.get("", response_model=list[EventRead])
def list_events(
    user: CurrentUser,
    session: SessionDep,
    search: Annotated[str, Query(max_length=200)] = "",
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
):
    query = select(Event)
    if search.strip():
        term = search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        query = query.where(Event.title.ilike(f"%{term}%", escape="\\") | Event.location_name.ilike(f"%{term}%", escape="\\"))
    events = session.exec(query.order_by(Event.starts_at, Event.id).offset(skip).limit(limit)).all()
    if not events:
        return []
    counts = dict(session.exec(select(Attendance.event_id, func.count()).where(Attendance.event_id.in_([event.id for event in events])).group_by(Attendance.event_id)).all())
    return [EventRead.model_validate(event).model_copy(update={"attendance_count": counts.get(event.id, 0)}) for event in events]


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(data: EventCreate, user: CurrentUser, session: SessionDep):
    event = Event(**data.model_dump(), owner_id=user.id, qr_code=secrets.token_urlsafe(16))
    session.add(event)
    session.commit()
    session.refresh(event)
    return read_event(event, session)


@router.get("/{event_id}", response_model=EventRead)
def get_event(event_id: int, user: CurrentUser, session: SessionDep):
    return read_event(find_event(event_id, session), session)


@router.get("/{event_id}/qr", response_model=EventQrRead)
def get_event_qr(event_id: int, user: CurrentUser, session: SessionDep):
    event = find_event(event_id, session)
    require_owner(event, user)
    return EventQrRead(qr_code=event.qr_code)


@router.put("/{event_id}", response_model=EventRead)
def update_event(event_id: int, data: EventUpdate, user: CurrentUser, session: SessionDep):
    event = find_event(event_id, session)
    require_owner(event, user)
    event.sqlmodel_update(data.model_dump())
    session.add(event)
    session.commit()
    session.refresh(event)
    return read_event(event, session)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, user: CurrentUser, session: SessionDep):
    event = find_event(event_id, session)
    require_owner(event, user)
    session.delete(event)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
