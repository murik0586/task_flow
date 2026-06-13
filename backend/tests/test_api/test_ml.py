from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.v1.endpoints.ml import PredictionService
from app.models.user import User
from app.schemas.ml import PredictionResult


def test_predict_completion_time_success(
    client: TestClient,
    db_session: Session,
    test_user: User,
    override_auth,
    monkeypatch,
):
    calls = {}

    def fake_get_prediction(task_id: int, user_id: int, db: Session) -> PredictionResult:
        calls["args"] = (task_id, user_id, db)
        return PredictionResult(123.456, "personal")

    monkeypatch.setattr(PredictionService,
                        "get_prediction", fake_get_prediction)

    response = client.get("/api/v1/tasks/42/predict")

    assert response.status_code == 200
    assert response.json() == {
        "task_id": 42,
        "predicted_seconds": 123.46,
        "model_source": "personal",
        "model_source_label": "Персональная модель по вам",
        "message": (
            "Прогноз рассчитан по вашей персональной модели в этой категории"
        ),
    }
    assert calls["args"] == (42, test_user.id, db_session)


def test_predict_completion_time_insufficient_data(
    client: TestClient,
    test_user: User,
    override_auth,
    monkeypatch,
):
    def fake_get_prediction(task_id: int, user_id: int, db: Session) -> PredictionResult:
        from app.services.prediction_service import InsufficientTrainingDataError
        raise InsufficientTrainingDataError(2)

    monkeypatch.setattr(PredictionService,
                        "get_prediction", fake_get_prediction)

    response = client.get("/api/v1/tasks/42/predict")

    assert response.status_code == 422
    assert "5" in response.json()["detail"]
    assert "2" in response.json()["detail"]


def test_predict_completion_time_not_found(
    client: TestClient,
    test_user: User,
    override_auth,
    monkeypatch,
):
    def fake_get_prediction(task_id: int, user_id: int, db: Session) -> PredictionResult:
        raise ValueError("Task not found")

    monkeypatch.setattr(PredictionService,
                        "get_prediction", fake_get_prediction)

    response = client.get("/api/v1/tasks/9999/predict")

    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


def test_predict_completion_time_unauthorized(client: TestClient):
    response = client.get("/api/v1/tasks/42/predict")

    assert response.status_code == 401
