from pydantic import BaseModel


class PredictionResponse(BaseModel):
    task_id: int
    predicted_seconds: float
    message: str = "Прогноз рассчитан на основе вашей истории задач"
