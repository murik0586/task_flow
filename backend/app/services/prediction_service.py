from sqlalchemy.orm import Session

from app.ml.model import MIN_USER_SAMPLES, predictor
from app.models.task import Task, TaskStatus
from app.schemas.ml import PredictionResult


class InsufficientTrainingDataError(ValueError):
    def __init__(self, completed_count: int,
                 min_required: int = MIN_USER_SAMPLES):
        self.completed_count = completed_count
        self.min_required = min_required
        super().__init__(
            f"Недостаточно завершённых задач для прогноза: "
            f"{completed_count} из {min_required}. "
            f"Модель предсказывает время только при "
            f"{min_required}+ завершённых задачах "
            f"с указанным фактическим временем."
        )


class PredictionService:
    @staticmethod
    def count_completed_tasks(user_id: int, db: Session) -> int:
        return (
            db.query(Task)
            .filter(
                Task.user_id == user_id,
                Task.status == TaskStatus.CLOSE,
                Task.final_assessment_seconds.isnot(None),
            )
            .count()
        )

    @staticmethod
    def get_prediction(task_id: int, user_id: int, db: Session) -> PredictionResult:
        task = (
            db.query(Task)
            .filter(Task.id == task_id, Task.user_id == user_id)
            .first()
        )
        if not task:
            raise ValueError("Task not found")

        completed_count = PredictionService.count_completed_tasks(user_id, db)
        if completed_count < MIN_USER_SAMPLES:
            raise InsufficientTrainingDataError(completed_count)

        predictor.partial_train_user(user_id, db)
        return predictor.predict_with_source(task, user_id, db)

    @staticmethod
    def retrain_for_user(user_id: int, db: Session):
        """Переобучить персональные модели пользователя."""
        predictor.partial_train_user(user_id, db)

    @staticmethod
    def retrain_global(db: Session):
        """Глобальное переобучение (раз в сутки)."""
        predictor.partial_train_global(db)

    @staticmethod
    def retrain_if_closed(task: Task, db: Session) -> None:
        """Переобучить модель, если задача завершена с фактическим временем."""
        if (
            task.status == TaskStatus.CLOSE
            and task.final_assessment_seconds is not None
        ):
            PredictionService.retrain_for_user(task.user_id, db)
