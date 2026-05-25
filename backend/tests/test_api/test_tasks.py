from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.task import Task, TaskStatus
from app.models.user import User
from app.models.category import Category


class TestCreateTask:

    def test_create_task_success(self, client: TestClient,
                                 db_session: Session,
                                 test_user: User,
                                 test_category: Category, override_auth):
        response = client.post("/api/v1/tasks/", json={
            "name": "Test Task",
            "description": "Test Desc",
            "category_id": test_category.id,
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Task"
        assert data["status"] == "open"

    def test_create_task_minimal(self, client: TestClient,
                                 db_session: Session,
                                 test_user: User, override_auth):
        response = client.post("/api/v1/tasks/", json={"name": "Minimal Task"})
        assert response.status_code == 201
        assert response.json()["status"] == "open"

    def test_create_task_rejects_zero_category_id(
            self, client: TestClient,
            test_user: User, override_auth):
        response = client.post("/api/v1/tasks/", json={
            "name": "No Category",
            "category_id": 0,
        })
        assert response.status_code == 422

    def test_create_task_missing_category(self, client: TestClient,
                                          test_user: User, override_auth):
        response = client.post("/api/v1/tasks/", json={
            "name": "Missing Category",
            "category_id": 9999,
        })
        assert response.status_code == 404

    def test_create_task_unauthorized(self, client: TestClient):
        from main import app
        app.dependency_overrides.clear()
        response = client.post("/api/v1/tasks/", json={"name": "Task"})
        assert response.status_code == 401


class TestGetTasks:

    def test_empty_list(self, client: TestClient,
                        test_user: User, override_auth):
        response = client.get("/api/v1/tasks/")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []

    def test_list_with_tasks(self, client: TestClient, db_session: Session,
                             test_user: User, override_auth):
        for i in range(3):
            db_session.add(Task(name=f"Task {i}", user_id=test_user.id))
        db_session.commit()

        response = client.get("/api/v1/tasks/")
        data = response.json()
        assert data["total"] == 3
        assert len(data["items"]) == 3

    def test_filter_by_status(self, client: TestClient, db_session: Session,
                              test_user: User, override_auth):
        db_session.add(Task(name="Open",
                            user_id=test_user.id, status=TaskStatus.OPEN))
        db_session.add(Task(name="Closed",
                            user_id=test_user.id, status=TaskStatus.CLOSE))
        db_session.commit()

        response = client.get("/api/v1/tasks/?status=close")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "Closed"

    def test_pagination(self, client: TestClient,
                        db_session: Session,
                        test_user: User, override_auth):
        for i in range(15):
            db_session.add(Task(name=f"Task {i}", user_id=test_user.id))
        db_session.commit()

        response = client.get("/api/v1/tasks/?skip=0&limit=5")
        data = response.json()
        assert data["total"] == 15
        assert len(data["items"]) == 5


class TestGetTask:

    def test_get_own_task(self, client: TestClient,
                          db_session: Session,
                          test_user: User, override_auth):
        task = Task(name="My Task", user_id=test_user.id)
        db_session.add(task)
        db_session.commit()

        response = client.get(f"/api/v1/tasks/{task.id}")
        assert response.status_code == 200
        assert response.json()["name"] == "My Task"

    def test_get_other_user_task(self, client: TestClient,
                                 db_session: Session,
                                 test_user: User, override_auth):
        other_user = User(id=999, first_name="Other",
                          second_name="User", login="other",
                          password_hash="hash", email="other@test.com")
        db_session.add(other_user)
        db_session.flush()

        other_task = Task(name="Other", user_id=other_user.id)
        db_session.add(other_task)
        db_session.commit()

        response = client.get(f"/api/v1/tasks/{other_task.id}")
        assert response.status_code == 404

    def test_task_not_found(self, client: TestClient,
                            test_user: User, override_auth):
        response = client.get("/api/v1/tasks/9999")
        assert response.status_code == 404


class TestUpdateTask:

    def test_update_name(self, client: TestClient,
                         db_session: Session,
                         test_user: User, override_auth):
        task = Task(name="Old", user_id=test_user.id)
        db_session.add(task)
        db_session.commit()

        response = client.put(f"/api/v1/tasks/{task.id}", json={"name": "New"})
        assert response.status_code == 200
        assert response.json()["name"] == "New"


class TestUpdateTaskStatus:

    def test_change_status(self, client: TestClient,
                           db_session: Session,
                           test_user: User, override_auth):
        task = Task(name="Task", user_id=test_user.id, status=TaskStatus.OPEN)
        db_session.add(task)
        db_session.commit()

        response = client.patch(
            f"/api/v1/tasks/{task.id}/status?new_status=close")
        assert response.status_code == 200
        assert response.json()["status"] == "close"

    def test_invalid_status(self, client: TestClient,
                            db_session: Session,
                            test_user: User, override_auth):
        task = Task(name="Task", user_id=test_user.id)
        db_session.add(task)
        db_session.commit()

        response = client.patch(
            f"/api/v1/tasks/{task.id}/status?new_status=invalid")
        assert response.status_code == 422


class TestDeleteTask:

    def test_delete_own_task(self, client: TestClient,
                             db_session: Session,
                             test_user: User, override_auth):
        task = Task(name="To Delete", user_id=test_user.id)
        db_session.add(task)
        db_session.commit()

        response = client.delete(f"/api/v1/tasks/{task.id}")
        assert response.status_code == 204

    def test_delete_other_user_task(self, client: TestClient,
                                    db_session: Session,
                                    test_user: User, override_auth):
        other_user = User(id=999, first_name="Other", second_name="User",
                          login="other", password_hash="hash",
                          email="other@test.com")
        db_session.add(other_user)
        db_session.flush()

        task = Task(name="Other", user_id=other_user.id)
        db_session.add(task)
        db_session.commit()

        response = client.delete(f"/api/v1/tasks/{task.id}")
        assert response.status_code == 404
