from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, asc
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models.task import Task
from models.user import User
from schemas.task import TaskCreate, TaskUpdate, TaskResponse


router = APIRouter(
    prefix="/api/tasks",
    tags=["Tasks"],
)


def _get_user_task(task_id: int, user: User, db: Session) -> Task:
    """Fetch a task that belongs to the authenticated user, or 404."""
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == user.id)
        .first()
    )
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.post("/", response_model=TaskResponse, status_code=201)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_task = Task(
        user_id=current_user.id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        due_date=task.due_date,
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


@router.get("/", response_model=list[TaskResponse])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: str | None = Query(default=None, pattern=r"^(todo|in_progress|done)$"),
    priority: str | None = Query(default=None, pattern=r"^(low|medium|high)$"),
    completed: bool | None = Query(default=None),
    search: str | None = Query(default=None, min_length=1),
    sort_by: Literal["created_at", "due_date", "priority", "title"] = Query(default="created_at"),
    order: Literal["asc", "desc"] = Query(default="desc"),
):
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if status is not None:
        query = query.filter(Task.status == status)

    if priority is not None:
        query = query.filter(Task.priority == priority)

    if completed is not None:
        query = query.filter(Task.completed == completed)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Task.title.ilike(search_term) | Task.description.ilike(search_term)
        )

    sort_column = getattr(Task, sort_by)
    query = query.order_by(desc(sort_column) if order == "desc" else asc(sort_column))

    return query.all()


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_user_task(task_id, current_user, db)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = _get_user_task(task_id, current_user, db)

    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.completed is not None:
        task.completed = task_data.completed
    if task_data.priority is not None:
        task.priority = task_data.priority
    if task_data.status is not None:
        task.status = task_data.status
    if task_data.due_date is not None:
        task.due_date = task_data.due_date

    db.commit()
    db.refresh(task)

    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def patch_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = _get_user_task(task_id, current_user, db)

    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.completed is not None:
        task.completed = task_data.completed
    if task_data.priority is not None:
        task.priority = task_data.priority
    if task_data.status is not None:
        task.status = task_data.status
    if task_data.due_date is not None:
        task.due_date = task_data.due_date

    db.commit()
    db.refresh(task)

    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = _get_user_task(task_id, current_user, db)

    db.delete(task)
    db.commit()

    return {"message": "Task deleted"}
