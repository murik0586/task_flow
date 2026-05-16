from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.v1.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.ml import PredictionResponse
from app.services.prediction_service import PredictionService

router = APIRouter(tags=["ml"])

@router.get("/tasks/{task_id}/predict", response_model=PredictionResponse)
def predict_completion_time(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        seconds = PredictionService.get_prediction(task_id, current_user.id, db)
        return PredictionResponse(task_id=task_id, predicted_seconds=round(seconds, 2))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))