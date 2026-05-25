import pytest
from unittest.mock import patch
from app.services.prediction_service import PredictionService
from app.models.task import Task, TaskStatus


class TestPredictionService:

    def test_get_prediction_success(self, db_session,
                                    sample_users,
                                    sample_categories):
        """Успешное получение прогноза (интеграция с моделью)."""
        # Создаём достаточное количество закрытых задач
        # для пользователя 1 в категории 1
        for i in range(7):
            task = Task(
                user_id=1, category_id=1,
                name=f"task{i}", status=TaskStatus.CLOSE,
                final_assessment_seconds=100 + i*10,
            )
            db_session.add(task)
        db_session.commit()
        # Обучаем модель (вызов retrain_for_user или
        # глобально, чтобы predictor обучился)
        PredictionService.retrain_for_user(1, db_session)
        # Создаём новую задачу, для которой будем предсказывать
        new_task = Task(user_id=1, category_id=1,
                        name="predict me", status=TaskStatus.OPEN)
        db_session.add(new_task)
        db_session.commit()
        pred = PredictionService.get_prediction(new_task.id, 1, db_session)
        assert isinstance(pred, float)
        assert pred > 0

    def test_get_prediction_task_not_found(self, db_session):
        """Если задача не найдена, сервис выбрасывает ValueError."""
        with pytest.raises(ValueError, match="Task not found"):
            PredictionService.get_prediction(9999, 1, db_session)

    def test_get_prediction_wrong_user(self, db_session,
                                       sample_users,
                                       sample_categories):
        """Если задача не принадлежит пользователю, должна быть ошибка."""
        # Создадим задачу пользователя 2
        task = Task(user_id=2, category_id=1, name="user2_task")
        db_session.add(task)
        db_session.commit()
        with pytest.raises(ValueError, match="Task not found"):
            PredictionService.get_prediction(task.id, 1, db_session)

    @patch('app.services.prediction_service.predictor')
    def test_retrain_for_user_calls_partial_train(self, mock_predictor,
                                                  db_session):
        """retrain_for_user делегирует вызов predictor.partial_train_user."""
        PredictionService.retrain_for_user(42, db_session)
        (mock_predictor.
         partial_train_user.assert_called_once_with(42, db_session))

    @patch('app.services.prediction_service.predictor')
    def test_retrain_global_calls_partial_train_global(self, mock_predictor,
                                                       db_session):
        """retrain_global делегирует вызов predictor.partial_train_global."""
        PredictionService.retrain_global(db_session)
        mock_predictor.partial_train_global.assert_called_once_with(db_session)
