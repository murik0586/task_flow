import pytest
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.category import Category
from app.models.task import Task, TaskStatus


class TestUser:
    def test_create_and_retrieve(self, db_session):
        user = User(
            first_name="Иван",
            second_name="Петров",
            login="ivan",
            password_hash="hashed"
        )
        db_session.add(user)
        db_session.commit()

        saved = db_session.query(User).filter_by(login="ivan").first()
        assert saved is not None
        assert saved.first_name == "Иван"

    def test_unique_login(self, db_session):
        db_session.add(User(first_name="A", second_name="B",
                            login="same", password_hash="x"))
        db_session.commit()

        db_session.add(User(first_name="C", second_name="D",
                            login="same", password_hash="y"))
        with pytest.raises(IntegrityError):
            db_session.commit()


class TestTask:
    def test_persist_and_relationships(self, db_session):
        user = User(first_name="A", second_name="B",
                    login="taskuser", password_hash="h")
        category = Category(name="Дом")
        db_session.add_all([user, category])
        db_session.flush()

        task = Task(
            name="Помыть окна",
            description="С моющим средством",
            user_id=user.id,
            category_id=category.id,
            status=TaskStatus.WORK
        )
        db_session.add(task)
        db_session.commit()

        # Проверяем связи после загрузки из БД
        loaded = db_session.query(Task).first()
        assert loaded.owner.login == "taskuser"
        assert loaded.category.name == "Дом"
        assert loaded.status == TaskStatus.WORK

    def test_open_is_default_in_database(self, db_session):
        # Честно: создаём без указания статуса, сохраняем, проверяем
        user = User(first_name="X", second_name="Y",
                    login="xy", password_hash="z")
        db_session.add(user)
        db_session.flush()

        task = Task(name="Без статуса", user_id=user.id)
        db_session.add(task)
        db_session.commit()

        # После коммита default должен примениться
        assert task.status == TaskStatus.OPEN


class TestCategory:
    def test_unique_name(self, db_session):
        db_session.add(Category(name="Работа"))
        db_session.commit()

        db_session.add(Category(name="Работа"))
        with pytest.raises(IntegrityError):
            db_session.commit()
