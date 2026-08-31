from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


VALID_PRIORITIES = ("low", "medium", "high")
VALID_STATUSES = ("todo", "in_progress", "done")


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    priority: str = Field(default="medium", pattern=r"^(low|medium|high)$")
    status: str = Field(default="todo", pattern=r"^(todo|in_progress|done)$")
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    completed: bool | None = None
    priority: str | None = Field(default=None, pattern=r"^(low|medium|high)$")
    status: str | None = Field(default=None, pattern=r"^(todo|in_progress|done)$")
    due_date: date | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    completed: bool
    priority: str
    status: str
    due_date: date | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)