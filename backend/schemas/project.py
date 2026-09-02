from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


VALID_PROJECT_STATUSES = ("active", "completed", "archived")


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    status: str = Field(default="active", pattern=r"^(active|completed|archived)$")
    priority: str = Field(default="medium", pattern=r"^(low|medium|high|urgent)$")
    start_date: date | None = None
    due_date: date | None = None
    color: str = Field(default="#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str = Field(default="📁", max_length=10)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: str | None = Field(default=None, pattern=r"^(active|completed|archived)$")
    priority: str | None = Field(default=None, pattern=r"^(low|medium|high|urgent)$")
    start_date: date | None = None
    due_date: date | None = None
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str | None = Field(default=None, max_length=10)


class ProjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: str | None
    status: str
    priority: str
    start_date: date | None
    due_date: date | None
    color: str
    icon: str
    task_count: int = 0
    completed_task_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
