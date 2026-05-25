from sqlalchemy.orm import Session
from app.models.task import Task
from app.ml.model import predictor


class PredictionService:
    @staticmethod
    def get_prediction(task_id: int, user_id: int, db: Session) -> float:
        task = (db.query(Task)
                .filter(Task.id == task_id, Task.user_id == user_id)
                .first())
        if not task:
            raise ValueError("Task not found")
        return predictor.predict(task, user_id, db)

    @staticmethod
    def retrain_for_user(user_id: int, db: Session):
        """Переобучить персональные модели пользователя."""
        predictor.partial_train_user(user_id, db)

    @staticmethod
    def retrain_global(db: Session):
        """Глобальное переобучение (раз в сутки)."""
        predictor.partial_train_global(db)
