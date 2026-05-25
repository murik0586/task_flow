import sys
import os
import pytest
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import HTTPException

from app.utils.pagination import apply_pagination

sys.path.insert(0,
                os.path.abspath(os.path.
                                join(os.path.
                                     dirname(__file__),
                                     "../..")))

# Фикстуры

Base = declarative_base()


class FakeModel(Base):
    """Временная модель для тестирования пагинации."""
    __tablename__ = "test_items"
    id = Column(Integer, primary_key=True)
    name = Column(String)


@pytest.fixture
def db_session():
    """Создаёт in-memory SQLite и возвращает сессию."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def populated_db(db_session):
    """Заполняет БД 25 записями."""
    for i in range(1, 26):
        db_session.add(FakeModel(name=f"Item {i}"))
    db_session.commit()
    return db_session


# Тесты

class TestApplyPagination:

    def test_first_page(self, populated_db):
        """Первая страница — 10 записей из 25."""
        query = populated_db.query(FakeModel)
        total, items = apply_pagination(query, skip=0, limit=10)
        assert total == 25
        assert len(items) == 10
        assert items[0].name == "Item 1"
        assert items[-1].name == "Item 10"

    def test_second_page(self, populated_db):
        """Вторая страница — следующие 10 записей."""
        query = populated_db.query(FakeModel)
        total, items = apply_pagination(query, skip=10, limit=10)
        assert total == 25
        assert len(items) == 10
        assert items[0].name == "Item 11"
        assert items[-1].name == "Item 20"

    def test_last_partial_page(self, populated_db):
        """Последняя страница — оставшиеся 5 записей."""
        query = populated_db.query(FakeModel)
        total, items = apply_pagination(query, skip=20, limit=10)
        assert total == 25
        assert len(items) == 5
        assert items[0].name == "Item 21"
        assert items[-1].name == "Item 25"

    def test_empty_result(self, populated_db):
        """Смещение больше количества записей — пустой список."""
        query = populated_db.query(FakeModel)
        total, items = apply_pagination(query, skip=100, limit=10)
        assert total == 25
        assert len(items) == 0
        assert items == []

    def test_zero_limit(self, populated_db):
        """Лимит 0 — возвращает пустой список."""
        query = populated_db.query(FakeModel)
        total, items = apply_pagination(query, skip=0, limit=0)
        assert total == 25
        assert len(items) == 0

    def test_limit_exceeds_max(self, populated_db):
        """Лимит больше max_limit — 400 ошибка."""
        query = populated_db.query(FakeModel)
        with pytest.raises(HTTPException) as exc_info:
            apply_pagination(query, skip=0, limit=101, max_limit=100)
        assert exc_info.value.status_code == 400
        assert "Лимит записей" in exc_info.value.detail

    def test_custom_max_limit(self, populated_db):
        """Можно задать свой max_limit."""
        query = populated_db.query(FakeModel)
        total, items = apply_pagination(query, skip=0, limit=50, max_limit=50)
        assert total == 25
        assert len(items) == 25

    def test_empty_table(self, db_session):
        """Пустая таблица — total 0, items пуст."""
        query = db_session.query(FakeModel)
        total, items = apply_pagination(query, skip=0, limit=10)
        assert total == 0
        assert items == []

    def test_skip_zero(self, populated_db):
        """skip=0 — поведение по умолчанию."""
        query = populated_db.query(FakeModel)
        total, items = apply_pagination(query, skip=0, limit=10)
        assert len(items) == 10
        assert items[0].name == "Item 1"

    def test_default_limit(self, populated_db):
        """Без указания limit — используется 10 по умолчанию."""
        query = populated_db.query(FakeModel)
        total, items = apply_pagination(query, skip=0)  # limit не передан
        assert len(items) == 10

    def test_total_unchanged_by_pagination(self, populated_db):
        """total всегда общее количество, не зависит от skip/limit."""
        query = populated_db.query(FakeModel)
        total1, _ = apply_pagination(query, skip=0, limit=5)
        total2, _ = apply_pagination(query, skip=20, limit=5)
        assert total1 == total2 == 25

    def test_negative_skip(self, populated_db):
        """Отрицательный skip —
        SQLAlchemy проигнорирует offset, items не пуст."""
        query = populated_db.query(FakeModel)
        total, items = apply_pagination(query, skip=-5, limit=10)
        assert total == 25
        assert len(items) == 10  # offset игнорируется, возвращает первые 10
