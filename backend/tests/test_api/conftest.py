import pytest
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.category import Category
from app.api.v1.dependencies import get_current_user
from main import app


@pytest.fixture
def test_user(db_session: Session) -> User:
    """Создаёт тестового пользователя."""
    user = User(
        first_name="Test",
        second_name="User",
        login="testuser",
        password_hash="hashed_password",
        email="test@example.com",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_category(db_session: Session) -> Category:
    """Создаёт тестовую категорию."""
    category = Category(name="Test Category")
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category


@pytest.fixture
def override_auth(test_user: User):
    """Подменяет get_current_user, чтобы не требовался реальный JWT."""
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield
    app.dependency_overrides.pop(get_current_user, None)
