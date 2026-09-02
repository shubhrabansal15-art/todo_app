from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, asc
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models.project import Project
from models.task import Task
from models.user import User
from schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from schemas.task import TaskResponse


router = APIRouter(prefix="/api/projects", tags=["Projects"])


def _get_user_project(project_id: int, user: User, db: Session) -> Project:
    """Fetch a project that belongs to the authenticated user, or 404."""
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == user.id)
        .first()
    )
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


def _project_with_stats(project: Project, db: Session) -> dict:
    """Return project data enriched with task counts."""
    task_count = (
        db.query(Task)
        .filter(Task.project_id == project.id, Task.user_id == project.user_id)
        .count()
    )
    completed_task_count = (
        db.query(Task)
        .filter(
            Task.project_id == project.id,
            Task.user_id == project.user_id,
            Task.completed == True,  # noqa: E712
        )
        .count()
    )
    data = ProjectResponse.model_validate(project).model_dump()
    data["task_count"] = task_count
    data["completed_task_count"] = completed_task_count
    return data


@router.post("/", response_model=ProjectResponse, status_code=201)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        user_id=current_user.id,
        name=project_data.name,
        description=project_data.description,
        status=project_data.status,
        priority=project_data.priority,
        start_date=project_data.start_date,
        due_date=project_data.due_date,
        color=project_data.color,
        icon=project_data.icon,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _project_with_stats(project, db)


@router.get("/", response_model=list[ProjectResponse])
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: str | None = Query(
        default=None, alias="status", pattern=r"^(active|completed|archived)$"
    ),
    priority: str | None = Query(default=None, pattern=r"^(low|medium|high|urgent)$"),
    search: str | None = Query(default=None, min_length=1),
    sort_by: Literal["created_at", "due_date", "name", "priority"] = Query(
        default="created_at"
    ),
    order: Literal["asc", "desc"] = Query(default="desc"),
):
    query = db.query(Project).filter(Project.user_id == current_user.id)

    if status_filter is not None:
        query = query.filter(Project.status == status_filter)

    if priority is not None:
        query = query.filter(Project.priority == priority)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Project.name.ilike(search_term)
            | Project.description.ilike(search_term)
        )

    if sort_by == "priority":
        priority_expr = {
            "urgent": 0,
            "high": 1,
            "medium": 2,
            "low": 3,
        }
        from sqlalchemy import case

        expr = case(
            (Project.priority == "urgent", 0),
            (Project.priority == "high", 1),
            (Project.priority == "medium", 2),
            (Project.priority == "low", 3),
            else_=4,
        )
        query = query.order_by(asc(expr) if order == "asc" else desc(expr))
    else:
        sort_column = getattr(Project, sort_by)
        query = query.order_by(
            desc(sort_column) if order == "desc" else asc(sort_column)
        )

    projects = query.all()
    return [_project_with_stats(p, db) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_user_project(project_id, current_user, db)
    return _project_with_stats(project, db)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_user_project(project_id, current_user, db)

    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.status is not None:
        project.status = project_data.status
    if project_data.priority is not None:
        project.priority = project_data.priority
    if project_data.start_date is not None:
        project.start_date = project_data.start_date
    if project_data.due_date is not None:
        project.due_date = project_data.due_date
    if project_data.color is not None:
        project.color = project_data.color
    if project_data.icon is not None:
        project.icon = project_data.icon

    db.commit()
    db.refresh(project)
    return _project_with_stats(project, db)


@router.patch("/{project_id}", response_model=ProjectResponse)
def patch_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_user_project(project_id, current_user, db)

    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.status is not None:
        project.status = project_data.status
    if project_data.priority is not None:
        project.priority = project_data.priority
    if project_data.start_date is not None:
        project.start_date = project_data.start_date
    if project_data.due_date is not None:
        project.due_date = project_data.due_date
    if project_data.color is not None:
        project.color = project_data.color
    if project_data.icon is not None:
        project.icon = project_data.icon

    db.commit()
    db.refresh(project)
    return _project_with_stats(project, db)


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_user_project(project_id, current_user, db)

    # Unlink tasks from this project (SET NULL on FK handles DB, but update ORM objects too)
    db.query(Task).filter(
        Task.project_id == project.id, Task.user_id == current_user.id
    ).update({"project_id": None})

    db.delete(project)
    db.commit()

    return {"message": "Project deleted"}


@router.get("/{project_id}/tasks", response_model=list[TaskResponse])
def get_project_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return tasks belonging to a specific project."""
    _get_user_project(project_id, current_user, db)

    tasks = (
        db.query(Task)
        .filter(Task.project_id == project_id, Task.user_id == current_user.id)
        .all()
    )
    return tasks
