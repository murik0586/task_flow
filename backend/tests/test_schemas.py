# backend/tests/test_schemas.py
import pytest
from datetime import datetime, timedelta
from pydantic import ValidationError
from app.schemas.task import TaskCreate
from app.schemas.auth import UserCreate


def test_task_create_valid():
    """Проверка создания валидной задачи"""
    future_date = datetime.now() + timedelta(days=1)
    task = TaskCreate(title="Test Task", due_date=future_date)
    assert task.title == "Test Task"
    assert task.priority == "medium"  # значение по умолчанию


def test_task_create_past_date():
    """Проверка валидации: дата в прошлом должна вызывать ошибку"""
    past_date = datetime.now() - timedelta(days=1)
    with pytest.raises(ValueError, match="Дата не может быть в прошлом"):
        TaskCreate(title="Past Task", due_date=past_date)


def test_user_create_short_password():
    """Проверка валидации: короткий пароль"""
    with pytest.raises(ValidationError):
        UserCreate(
            email="test@example.com",
            password="123",
            first_name="Ivan",
            last_name="Ivanov"
        )
