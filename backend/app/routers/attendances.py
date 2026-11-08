from fastapi import APIRouter, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.deps import CurrentUser, SessionDep
from app.models import Attendance
from app.routers.events import find_event, require_owner
from app.schemas.event import AttendanceCreate, AttendanceRead

router = APIRouter(tags=["attendances"])


@router.post("/events/{event_id}/attendances", response_model=AttendanceRead, status_code=status.HTTP_201_CREATED)
def check_in(event_id: int, user: CurrentUser, session: SessionDep, data: AttendanceCreate | None = None):
    find_event(event_id, session)
    existing = session.exec(select(Attendance).where(Attendance.event_id == event_id, Attendance.user_id == user.id)).first()
    if existing is not None:
        raise HTTPException(409, "Ya registraste tu asistencia a este evento")
    attendance = Attendance(event_id=event_id, user_id=user.id, **(data or AttendanceCreate()).model_dump())
    session.add(attendance)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, "No se pudo registrar la asistencia; puede que ya esté registrada")
    session.refresh(attendance)
    return attendance


@router.get("/events/{event_id}/attendances", response_model=list[AttendanceRead])
def event_attendees(event_id: int, user: CurrentUser, session: SessionDep):
    event = find_event(event_id, session)
    require_owner(event, user)
    return session.exec(select(Attendance).where(Attendance.event_id == event_id).order_by(Attendance.checked_in_at, Attendance.id)).all()


@router.get("/attendances/me", response_model=list[AttendanceRead])
def my_attendances(user: CurrentUser, session: SessionDep):
    return session.exec(select(Attendance).where(Attendance.user_id == user.id).order_by(Attendance.checked_in_at.desc(), Attendance.id.desc())).all()
