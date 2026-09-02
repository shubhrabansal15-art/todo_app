from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field


VALID_REMINDER_STATUSES = ("pending", "completed", "dismissed")


class ReminderCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    reminder_date: date
    reminder_time: time | None = None
    task_id: int | None = None
    project_id: int | None = None


class ReminderUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    reminder_date: date | None = None
    reminder_time: time | None = None
    task_id: int | None = None
    project_id: int | None = None
    status: str | None = Field(default=None, pattern=r"^(pending|completed|dismissed)$")


class ReminderResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None
    reminder_date: date
    reminder_time: time | None
    task_id: int | None
    project_id: int | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
