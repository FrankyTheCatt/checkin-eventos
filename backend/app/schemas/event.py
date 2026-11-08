from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class Coordinates(BaseModel):
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @model_validator(mode="after")
    def paired_coordinates(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Indica latitud y longitud juntas")
        return self


class EventCreate(Coordinates):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    title: str = Field(min_length=1, max_length=150)
    description: str = Field(default="", max_length=2000)
    location_name: str = Field(default="", max_length=200)
    radius_m: int = Field(default=100, ge=1, le=100000)
    starts_at: datetime
    ends_at: datetime

    @field_validator("starts_at", "ends_at")
    @classmethod
    def utc_dates(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("La fecha debe incluir zona horaria")
        return value.astimezone(timezone.utc)

    @model_validator(mode="after")
    def ordered_dates(self):
        if self.ends_at <= self.starts_at:
            raise ValueError("La fecha de término debe ser posterior al inicio")
        return self


class EventUpdate(EventCreate):
    pass


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    location_name: str
    latitude: float | None
    longitude: float | None
    radius_m: int
    starts_at: datetime
    ends_at: datetime
    owner_id: int
    attendance_count: int = 0


class EventQrRead(BaseModel):
    qr_code: str


class AttendanceCreate(Coordinates):
    model_config = ConfigDict(extra="forbid")


class AttendanceRead(Coordinates):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    user_id: int
    checked_in_at: datetime
