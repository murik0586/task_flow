"""
Эндпоинты для управления задачами (To-Do App).
Все эндпоинты защищены через get_current_user.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, TaskListOut

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Создание новой задачи."""
    if task_in.category_id is not None:
        category = db.query(Category).filter(Category.id == task_in.category_id).first()
        if category is None:
            raise HTTPException(status_code=404, detail="Категория не найдена")

    task = Task(
        name=task_in.name,
        description=task_in.description,
        category_id=task_in.category_id,
        user_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/", response_model=TaskListOut)
def get_tasks(
    skip: int = Query(0, ge=0, description="Смещение (offset)"),
    limit: int = Query(10, ge=1, le=100, description="Лимит записей"),
    status_filter: Optional[str] = Query(
        None, alias="status",
        description="Фильтр: open, work, waiting, close, cancelled"
    ),
    category_id: Optional[int] = Query(None, description="Фильтр по ID категории"),
    sort_by: Optional[str] = Query(
        None, pattern="^(id|name|status)$",
        description="Сортировка: id, name, status"
    ),
    sort_order: Optional[str] = Query(
        "asc", pattern="^(asc|desc)$",
        description="Порядок: asc / desc"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Список задач с пагинацией, фильтрацией и сортировкой."""
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if status_filter:
        try:
            ts = TaskStatus(status_filter)
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail=f"Недопустимый статус. Допустимые: {[s.value for s in TaskStatus]}"
            )
        query = query.filter(Task.status == ts)

    if category_id is not None:
        query = query.filter(Task.category_id == category_id)

    sort_map = {"id": Task.id, "name": Task.name, "status": Task.status}
    if sort_by:
        col = sort_map[sort_by]
        query = query.order_by(col.desc() if sort_order == "desc" else col.asc())
    else:
        query = query.order_by(Task.id.desc())

    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Получить задачу по ID (только свою)."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return task


@router.put("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Обновление задачи."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/status", response_model=TaskOut)
def update_task_status(
    task_id: int,
    new_status: str = Query(..., description="Новый статус: open, work, waiting, close, cancelled"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Изменение статуса задачи."""
    try:
        ts = TaskStatus(new_status)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Недопустимый статус. Допустимые: {[s.value for s in TaskStatus]}"
        )

    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    task.status = ts
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Удаление задачи."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)