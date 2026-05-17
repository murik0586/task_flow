from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.task import Task, TaskStatus
from app.models.category import Category
from app.schemas.task import TaskCreate, TaskUpdate

class TaskService:

    @staticmethod
    def get_task(task_id: int, user_id: int, db: Session) -> Task:
        task = db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == user_id
        ).first()
        if not task:
            raise ValueError("Task not found")
        return task

    @staticmethod
    def get_tasks(
        user_id: int,
        db: Session,
        status: TaskStatus | None = None,
        category_id: int | None = None,
        sort_by: str | None = None,
    ) -> list[Task]:
        query = db.query(Task).filter(Task.user_id == user_id)

        if status is not None:
            query = query.filter(Task.status == status)
        if category_id is not None:
            query = query.filter(Task.category_id == category_id)

        if sort_by == "priority":
            query = query.order_by(Task.priority)
        elif sort_by == "deadline":
            query = query.order_by(Task.deadline)

        return query.all()

    @staticmethod
    def create_task(user_id: int, data: TaskCreate, db: Session) -> Task:
        # Проверяем категорию если указана
        if data.category_id is not None:
            category = db.query(Category).filter(
                Category.id == data.category_id
            ).first()
            if not category:
                raise ValueError("Category not found")

        due_date = data.due_date
        if due_date is None:
            due_date = datetime.now() + timedelta(days=1)       
        

        task = Task(
            user_id=user_id,
            name=data.name,
            description=data.description,
            category_id=data.category_id,
            status=TaskStatus.OPEN,
#            initial_assessment_seconds=data.initial_assessment_seconds,
            due_date=due_date,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def update_task(task_id: int, user_id: int, data: TaskUpdate, db: Session) -> Task:
        task = TaskService.get_task(task_id, user_id, db)

        if data.name is not None:
            task.name = data.name
        if data.description is not None:
            task.description = data.description
        if data.category_id is not None:
            category = db.query(Category).filter(
                Category.id == data.category_id
            ).first()
            if not category:
                raise ValueError("Category not found")
            task.category_id = data.category_id
#        if data.initial_assessment_seconds is not None:
#            task.initial_assessment_seconds = data.initial_assessment_seconds

        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete_task(task_id: int, user_id: int, db: Session) -> None:
        task = TaskService.get_task(task_id, user_id, db)
        db.delete(task)
        db.commit()

    @staticmethod
    def change_status(task_id: int, user_id: int, new_status: TaskStatus, db: Session) -> Task:
        task = TaskService.get_task(task_id, user_id, db)
        task.status = new_status
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def close_task(task_id: int, user_id: int, final_seconds: int, db: Session) -> Task:
        task = TaskService.get_task(task_id, user_id, db)

        task.status = TaskStatus.CLOSE
        task.final_assessment_seconds = final_seconds
        db.commit()
        db.refresh(task)

        # Переобучаем персональные модели пользователя
        from app.services.prediction_service import PredictionService
        PredictionService.retrain_for_user(user_id, db)

        return task