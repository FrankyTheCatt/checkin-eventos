"""Modelo de datos.

Tres tablas:
- users: personas registradas.
- events: entidad principal del sistema (la gestiona el CRUD). Cada evento pertenece a un usuario.
- attendances: relación entre un usuario y un evento al que asistió (un registro por usuario y evento).
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


def ahora() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, max_length=255)
    full_name: str = Field(max_length=120)
    hashed_password: str = Field(max_length=255)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=ahora, sa_type=DateTime(timezone=True))

    events: list["Event"] = Relationship(back_populates="owner")
    attendances: list["Attendance"] = Relationship(back_populates="user")


class Event(SQLModel, table=True):
    __tablename__ = "events"

    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=150, index=True)
    description: str = Field(default="", max_length=2000)
    location_name: str = Field(default="", max_length=200)
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    radius_m: int = Field(default=100)
    starts_at: datetime = Field(sa_type=DateTime(timezone=True))
    ends_at: datetime = Field(sa_type=DateTime(timezone=True))
    qr_code: str = Field(unique=True, index=True, max_length=64)
    owner_id: int = Field(foreign_key="users.id", index=True, ondelete="CASCADE")

    owner: User | None = Relationship(back_populates="events")
    attendances: list["Attendance"] = Relationship(back_populates="event", cascade_delete=True)


class Attendance(SQLModel, table=True):
    __tablename__ = "attendances"
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="uq_attendance_event_user"),)

    id: int | None = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="events.id", index=True, ondelete="CASCADE")
    user_id: int = Field(foreign_key="users.id", index=True, ondelete="CASCADE")
    checked_in_at: datetime = Field(default_factory=ahora, sa_type=DateTime(timezone=True))
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)

    event: Event | None = Relationship(back_populates="attendances")
    user: User | None = Relationship(back_populates="attendances")
