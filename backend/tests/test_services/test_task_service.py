# tests/test_services/test_task_service.py
from datetime import datetime, timedelta

import pytest

from app.services.task_service import TaskService
from app.schemas.task import TaskCreate, TaskUpdate
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.models.category import Category


class TestTaskService:

    def test_create_task_success(self, db_session):
        # Подготовка: пользователь и категория
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivancoVv", password_hash="hash")
        category = Category(name="Work")
        db_session.add_all([user, category])
        db_session.commit()

        data = TaskCreate(
            name="Write report",
            description="Quarterly report",
            category_id=category.id,
        )
        task = TaskService.create_task(user.id, data, db_session)

        assert task.id is not None
        assert task.name == "Write report"
        assert task.description == "Quarterly report"
        assert task.category_id == category.id
        assert task.status == TaskStatus.OPEN
        assert task.user_id == user.id
        assert task.due_date is not None
        assert task.due_date > datetime.now()

    def test_create_task_without_category(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan2", password_hash="hash")
        db_session.add(user)
        db_session.commit()

        data = TaskCreate(
            name="No category task",
            category_id=None,
        )
        task = TaskService.create_task(user.id, data, db_session)

        assert task.category_id is None
        assert task.status == TaskStatus.OPEN

    def test_create_task_invalid_category(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan3", password_hash="hash")
        db_session.add(user)
        db_session.commit()

        data = TaskCreate(
            name="Task",
            category_id=999,  # не существует
        )
        with pytest.raises(ValueError, match="Category not found"):
            TaskService.create_task(user.id, data, db_session)

    def test_get_task_success(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan4", password_hash="hash")
        db_session.add(user)
        db_session.commit()

        task = Task(name="Get me", user_id=user.id)
        db_session.add(task)
        db_session.commit()

        fetched = TaskService.get_task(task.id, user.id, db_session)
        assert fetched.id == task.id
        assert fetched.name == "Get me"

    def test_get_task_not_found(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan5", password_hash="hash")
        db_session.add(user)
        db_session.commit()

        with pytest.raises(ValueError, match="Task not found"):
            TaskService.get_task(999, user.id, db_session)

    def test_get_tasks_filter_by_status(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan6", password_hash="hash")
        cat = Category(name="TestCat")
        db_session.add_all([user, cat])
        db_session.commit()

        task1 = Task(name="Open task", user_id=user.id,
                     status=TaskStatus.OPEN)
        task2 = Task(name="Closed task", user_id=user.id,
                     status=TaskStatus.CLOSE)
        db_session.add_all([task1, task2])
        db_session.commit()

        open_tasks = TaskService.get_tasks(user.id, db_session,
                                           status=TaskStatus.OPEN)
        assert len(open_tasks) == 1
        assert open_tasks[0].name == "Open task"

    def test_get_tasks_filter_by_category(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan7", password_hash="hash")
        cat1 = Category(name="Cat1")
        cat2 = Category(name="Cat2")
        db_session.add_all([user, cat1, cat2])
        db_session.commit()

        task1 = Task(name="Task1", user_id=user.id,
                     category_id=cat1.id)
        task2 = Task(name="Task2", user_id=user.id,
                     category_id=cat2.id)
        db_session.add_all([task1, task2])
        db_session.commit()

        filtered = TaskService.get_tasks(user.id, db_session,
                                         category_id=cat1.id)
        assert len(filtered) == 1
        assert filtered[0].name == "Task1"

    def test_update_task_success(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan8", password_hash="hash")
        cat1 = Category(name="OldCat")
        cat2 = Category(name="NewCat")
        db_session.add_all([user, cat1, cat2])
        db_session.commit()

        task = Task(name="Old name", description="Old desc",
                    user_id=user.id, category_id=cat1.id)
        db_session.add(task)
        db_session.commit()

        update_data = TaskUpdate(
            name="New name",
            description="New desc",
            category_id=cat2.id,
        )
        updated = TaskService.update_task(task.id, user.id,
                                          update_data, db_session)

        assert updated.name == "New name"
        assert updated.description == "New desc"
        assert updated.category_id == cat2.id

    def test_update_task_partial(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan9", password_hash="hash")
        db_session.add(user)
        db_session.commit()

        task = Task(name="Original", user_id=user.id)
        db_session.add(task)
        db_session.commit()

        update_data = TaskUpdate(name="Only name changed")
        updated = TaskService.update_task(task.id, user.id,
                                          update_data, db_session)

        assert updated.name == "Only name changed"
        assert updated.description == ""  # default from model

    def test_update_task_invalid_category(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan10", password_hash="hash")
        db_session.add(user)
        db_session.commit()

        task = Task(name="Task", user_id=user.id)
        db_session.add(task)
        db_session.commit()

        update_data = TaskUpdate(category_id=999)
        with pytest.raises(ValueError, match="Category not found"):
            TaskService.update_task(task.id, user.id, update_data, db_session)

    def test_delete_task_success(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan11", password_hash="hash")
        db_session.add(user)
        db_session.commit()

        task = Task(name="To delete", user_id=user.id)
        db_session.add(task)
        db_session.commit()
        task_id = task.id

        TaskService.delete_task(task_id, user.id, db_session)
        deleted = db_session.query(Task).get(task_id)
        assert deleted is None

    def test_delete_task_not_found(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan12", password_hash="hash")
        db_session.add(user)
        db_session.commit()

        with pytest.raises(ValueError, match="Task not found"):
            TaskService.delete_task(999, user.id, db_session)

    def test_change_status_success(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan13", password_hash="hash")
        db_session.add(user)
        db_session.commit()

        task = Task(name="Status change", user_id=user.id,
                    status=TaskStatus.OPEN)
        db_session.add(task)
        db_session.commit()

        updated = TaskService.change_status(task.id, user.id,
                                            TaskStatus.WORK, db_session)
        assert updated.status == TaskStatus.WORK

    def test_close_task_calls_retrain(self, db_session, monkeypatch):
        # mock-вызов retrain_for_user, чтобы не зависеть от ml модели
        from app.services import prediction_service
        retrain_called = False

        def mock_retrain(user_id, db):
            nonlocal retrain_called
            retrain_called = True

        monkeypatch.setattr(prediction_service.PredictionService,
                            "retrain_for_user", mock_retrain)

        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan14", password_hash="hash")
        db_session.add(user)
        db_session.commit()

        task = Task(name="Close me", user_id=user.id, status=TaskStatus.OPEN)
        db_session.add(task)
        db_session.commit()

        final_seconds = 5400
        closed_task = TaskService.close_task(task.id,
                                             user.id, final_seconds,
                                             db_session)

        assert closed_task.status == TaskStatus.CLOSE
        assert closed_task.final_assessment_seconds == final_seconds
        assert retrain_called is True

    def test_create_task_auto_due_date(self, db_session):
        user = User(first_name="Ivan", second_name="Ivanov",
                    login="ivan15", password_hash="hash")
        db_session.add(user)
        db_session.commit()

        data = TaskCreate(name="Test", due_date=None)
        task = TaskService.create_task(user.id, data, db_session)

        assert task.due_date is not None
        expected = datetime.now() + timedelta(days=1)
        assert abs((task.due_date - expected).total_seconds()) < 5
