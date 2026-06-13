from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel

PredictionSource = Literal["personal", "global", "fallback"]

PREDICTION_SOURCE_LABELS: dict[PredictionSource, str] = {
    "personal": "Персональная модель по вам",
    "global": "Глобальная модель по всем пользователям",
    "fallback": "Среднее по вашей истории",
}

PREDICTION_SOURCE_MESSAGES: dict[PredictionSource, str] = {
    "personal": "Прогноз рассчитан по вашей персональной модели в этой категории",
    "global": "Прогноз рассчитан по глобальной модели всех пользователей",
    "fallback": (
        "Персональной или глобальной модели для этой категории нет — "
        "использовано среднее по вашей истории"
    ),
}


@dataclass
class PredictionResult:
    predicted_seconds: float
    model_source: PredictionSource


class PredictionResponse(BaseModel):
    task_id: int
    predicted_seconds: float
    model_source: PredictionSource
    model_source_label: str
    message: str
