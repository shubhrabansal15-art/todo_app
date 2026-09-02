from typing import Literal
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, asc
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models.reminder import Reminder
from models.user import User
from schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse


router = APIRouter(prefix="/api/reminders", tags=["Reminders"])


def _get_user_reminder(reminder_id: int, user: User, db: Session) -> Reminder:
    """Fetch a reminder that belongs to the authenticated user, or 404."""
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == user.id)
        .first()
    )
    if reminder is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found",
        )
    return reminder


@router.post("/", response_model=ReminderResponse, status_code=201)
def create_reminder(
    data: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = Reminder(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        reminder_date=data.reminder_date,
        reminder_time=data.reminder_time,
        task_id=data.task_id,
        project_id=data.project_id,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.get("/", response_model=list[ReminderResponse])
def get_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: str | None = Query(
        default=None, alias="status", pattern=r"^(pending|completed|dismissed)$"
    ),
    task_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    overdue: bool | None = Query(default=None),
    today: bool | None = Query(default=None),
    search: str | None = Query(default=None, min_length=1),
    sort_by: Literal["reminder_date", "created_at", "title"] = Query(
        default="reminder_date"
    ),
    order: Literal["asc", "desc"] = Query(default="asc"),
):
    query = db.query(Reminder).filter(Reminder.user_id == current_user.id)

    if status_filter is not None:
        query = query.filter(Reminder.status == status_filter)

    if task_id is not None:
        query = query.filter(Reminder.task_id == task_id)

    if project_id is not None:
        query = query.filter(Reminder.project_id == project_id)

    if overdue is not None:
        today_str = date.today().isoformat()
        if overdue:
            # Overdue: pending reminders with reminder_date < today
            query = query.filter(
                Reminder.status == "pending",
                Reminder.reminder_date < today_str,
            )
        else:
            # Not overdue: pending reminders with reminder_date >= today
            query = query.filter(
                Reminder.status == "pending",
                Reminder.reminder_date >= today_str,
            )

    if today is not None:
        today_str = date.today().isoformat()
        if today:
            query = query.filter(
                Reminder.reminder_date == today_str,
                Reminder.status == "pending",
            )

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Reminder.title.ilike(search_term)
            | Reminder.description.ilike(search_term)
        )

    sort_column = getattr(Reminder, sort_by)
    query = query.order_by(
        desc(sort_column) if order == "desc" else asc(sort_column)
    )

    return query.all()


@router.get("/summary")
def get_reminders_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a concise summary of reminders for the dashboard."""
    today_str = date.today().isoformat()

    overdue_count = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id,
            Reminder.status == "pending",
            Reminder.reminder_date < today_str,
        )
        .count()
    )

    today_count = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id,
            Reminder.status == "pending",
            Reminder.reminder_date == today_str,
        )
        .count()
    )

    upcoming = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id,
            Reminder.status == "pending",
            Reminder.reminder_date > today_str,
        )
        .order_by(asc(Reminder.reminder_date))
        .first()
    )

    return {
        "overdue_count": overdue_count,
        "today_count": today_count,
        "next_upcoming": ReminderResponse.model_validate(upcoming).model_dump()
        if upcoming
        else None,
    }


@router.get("/{reminder_id}", response_model=ReminderResponse)
def get_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_user_reminder(reminder_id, current_user, db)


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    data: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = _get_user_reminder(reminder_id, current_user, db)

    if data.title is not None:
        reminder.title = data.title
    if data.description is not None:
        reminder.description = data.description
    if data.reminder_date is not None:
        reminder.reminder_date = data.reminder_date
    if data.reminder_time is not None:
        reminder.reminder_time = data.reminder_time
    if data.task_id is not None:
        reminder.task_id = data.task_id
    if data.project_id is not None:
        reminder.project_id = data.project_id
    if data.status is not None:
        reminder.status = data.status

    db.commit()
    db.refresh(reminder)
    return reminder


@router.patch("/{reminder_id}", response_model=ReminderResponse)
def patch_reminder(
    reminder_id: int,
    data: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = _get_user_reminder(reminder_id, current_user, db)

    if data.title is not None:
        reminder.title = data.title
    if data.description is not None:
        reminder.description = data.description
    if data.reminder_date is not None:
        reminder.reminder_date = data.reminder_date
    if data.reminder_time is not None:
        reminder.reminder_time = data.reminder_time
    if data.task_id is not None:
        reminder.task_id = data.task_id
    if data.project_id is not None:
        reminder.project_id = data.project_id
    if data.status is not None:
        reminder.status = data.status

    db.commit()
    db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = _get_user_reminder(reminder_id, current_user, db)
    db.delete(reminder)
    db.commit()
    return {"message": "Reminder deleted"}
