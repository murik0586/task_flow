import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from main import app
from fastapi.testclient import TestClient
from app.models.user import User
from app.models.category import Category
from app.models.task import Task, TaskStatus
from app.core.config import settings

TEST_ML_MODEL_PATH = "./test_ml_model.pkl"


@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """Переопределяем настройки на тестовые."""
    settings.DATABASE_URL = (
        os.getenv("TEST_DATABASE_URL",
                  "postgresql://test_user:test_pass@localhost:5433/test_db"))
    settings.ML_MODEL_PATH = TEST_ML_MODEL_PATH
    # Обновляем env для случаев, если что-то читает os.environ
    os.environ["DATABASE_URL"] = settings.DATABASE_URL
    os.environ["ML_MODEL_PATH"] = settings.ML_MODEL_PATH


@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    # чистим тестовую модель
    if os.path.exists(TEST_ML_MODEL_PATH):
        os.remove(TEST_ML_MODEL_PATH)


@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()
    try:
        yield session
    finally:
        session.close()
        if transaction.is_active:
            transaction.rollback()
        connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="function", autouse=True)
def clean_ml_model_file():
    """Удаляет файл модели перед каждым тестом и после,
    чтобы избежать зависимости от состояния."""
    if os.path.exists(TEST_ML_MODEL_PATH):
        os.remove(TEST_ML_MODEL_PATH)
    yield
    if os.path.exists(TEST_ML_MODEL_PATH):
        os.remove(TEST_ML_MODEL_PATH)


@pytest.fixture
def sample_users(db_session):
    users = [
        User(id=1, first_name="Alice", second_name="Smith",
             login="alice", password_hash="hash1"),
        User(id=2, first_name="Bob", second_name="Brown",
             login="bob", password_hash="hash2"),
        User(id=3, first_name="Charlie", second_name="Chaplin",
             login="charlie", password_hash="hash3"),
    ]
    db_session.add_all(users)
    db_session.commit()
    return users


@pytest.fixture
def sample_categories(db_session):
    cats = [
        Category(id=1, name="Work"),
        Category(id=2, name="Personal"),
        Category(id=3, name="Study"),
    ]
    db_session.add_all(cats)
    db_session.commit()
    return cats


def create_closed_task(db_session, user_id, category_id,
                       final_seconds, initial_seconds=None):
    task = Task(
        user_id=user_id,
        category_id=category_id,
        name=f"Task {final_seconds}",
        status=TaskStatus.CLOSE,
        final_assessment_seconds=final_seconds,
        initial_assessment_seconds=initial_seconds,
    )
    db_session.add(task)
    db_session.commit()
    return task
