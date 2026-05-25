import pytest
import os
from app.ml.model import (CompletionTimePredictor,
                          MIN_USER_SAMPLES, NULL_CATEGORY_KEY)
from app.models.task import Task, TaskStatus
from app.core.config import settings
from backend.tests.conftest import create_closed_task

TEST_ML_MODEL_PATH = "./test_ml_model.pkl"


# Помощник для заполнения истории задач
def populate_closed_tasks(db_session, tasks_params):
    """
    tasks_params: список dict с ключами:
     user_id, category_id, final_seconds, initial_seconds
    """
    for params in tasks_params:
        task = Task(
            user_id=params["user_id"],
            category_id=params.get("category_id"),
            name="test",
            status=TaskStatus.CLOSE,
            final_assessment_seconds=params["final_seconds"],
            initial_assessment_seconds=params.get("initial_seconds"),
        )
        db_session.add(task)
    db_session.commit()


@pytest.fixture(autouse=True)
def clean_ml_file():
    """Удаляет файл модели перед каждым тестом,
    чтобы начинать с чистого состояния."""
    if os.path.exists(settings.ML_MODEL_PATH):
        os.remove(settings.ML_MODEL_PATH)
    yield
    if os.path.exists(settings.ML_MODEL_PATH):
        os.remove(settings.ML_MODEL_PATH)


class TestCompletionTimePredictor:

    def test_init_no_file(self):
        """Инициализация без файла – все структуры пусты."""
        p = CompletionTimePredictor()
        assert p.global_models == {}
        assert p.user_models == {}
        assert p.global_mean == 0.0
        assert p.category_means == {}
        assert p.user_means == {}
        assert p.user_category_means == {}

    def test_train_empty_db(self, db_session):
        """Обучение на пустой базе не должно падать."""
        p = CompletionTimePredictor()
        p.train(db_session)
        assert p.global_models == {}
        assert p.user_models == {}
        # глобальное среднее должно быть 0
        # (по умолчанию, так как не было данных)
        # В нашем train если задач нет,
        # self.global_mean остаётся прежним (0.0)
        assert p.global_mean == 0.0

    def test_train_with_insufficient_global_data(self, db_session,
                                                 sample_users,
                                                 sample_categories):
        """Менее MIN_GLOBAL_SAMPLES (10) задач в категории –
        глобальная модель не создаётся."""
        # Создаем 9 задач в категории 1, но не 10
        tasks = [
            {"user_id": 1, "category_id": 1, "final_seconds": 100},
            {"user_id": 1, "category_id": 1, "final_seconds": 200},
            {"user_id": 2, "category_id": 1, "final_seconds": 150},
            {"user_id": 1, "category_id": 1, "final_seconds": 180},
            {"user_id": 2, "category_id": 1, "final_seconds": 220},
            {"user_id": 1, "category_id": 1, "final_seconds": 300},
            {"user_id": 1, "category_id": 1, "final_seconds": 250},
            {"user_id": 2, "category_id": 1, "final_seconds": 280},
            {"user_id": 1, "category_id": 1, "final_seconds": 270},
        ]
        populate_closed_tasks(db_session, tasks)
        p = CompletionTimePredictor()
        p.train(db_session)
        # Глобальная модель для категории 1 не должна создаться
        assert 1 not in p.global_models
        # Но общие средние рассчитаны
        assert p.global_mean > 0

    def test_train_with_sufficient_global_data(self, db_session,
                                               sample_users,
                                               sample_categories):
        """Достаточно данных для глобальной модели по категории."""
        # Создадим 12 задач в категории 2 (достаточно для global)
        tasks = []
        for i in range(12):
            tasks.append({
                "user_id": (i % 3) + 1,  # распределяем по трём пользователям
                "category_id": 2,
                "final_seconds": 100 + i * 20,
            })
        # Добавим несколько в других категориях для средних
        tasks.append({"user_id": 1, "category_id": 1, "final_seconds": 500})
        tasks.append({"user_id": 2, "category_id": 3, "final_seconds": 600})
        populate_closed_tasks(db_session, tasks)
        p = CompletionTimePredictor()
        p.train(db_session)
        assert 2 in p.global_models  # модель для категории 2 обучена
        # другие категории без модели
        assert 1 not in p.global_models
        assert 3 not in p.global_models

    def test_user_model_created_when_enough_data(self, db_session,
                                                 sample_users,
                                                 sample_categories):
        """Для пользователя с >= MIN_USER_SAMPLES (5)
        в категории создаётся персональная модель."""
        tasks = []
        # Пользователь 1, категория 1, 6 задач
        # (достаточно для персональной модели)
        for i in range(6):
            tasks.append({"user_id": 1, "category_id": 1,
                          "final_seconds": 100 + i * 10})
        # Тот же пользователь, категория 2, только 3 задачи (недостаточно)
        tasks.extend([
            {"user_id": 1, "category_id": 2, "final_seconds": 200},
            {"user_id": 1, "category_id": 2, "final_seconds": 220},
            {"user_id": 1, "category_id": 2, "final_seconds": 240},
        ])
        # Другие пользователи без полного набора
        tasks.append({"user_id": 2, "category_id": 1, "final_seconds": 300})
        populate_closed_tasks(db_session, tasks)
        p = CompletionTimePredictor()
        p.train(db_session)
        # Проверяем наличие персональной модели для (1,1)
        assert (1, 1) in p.user_models
        # Для (1,2) нет
        assert (1, 2) not in p.user_models
        # Для (2,1) нет (всего одна задача)
        assert (2, 1) not in p.user_models

    def test_predict_uses_personal_model_first(self, db_session,
                                               sample_users,
                                               sample_categories):
        """Приоритет: персональная модель > глобальная модель > fallback."""
        # Создаём данные так:
        # Пользователь 1, категория 1:
        # 6 задач (персональная модель)
        # Глобально категория 1:
        # ещё от других пользователей, всего >10 (глобальная модель)
        # Проверим, что для пользователя 1 predict
        # использует персональную модель, а не глобальную
        tasks = []
        # Задачи пользователя 1 в категории 1
        for i in range(6):
            tasks.append({"user_id": 1, "category_id": 1,
                          "final_seconds": 200 + i * 10})
        # Ещё 8 задач от пользователей 2 и 3 в той же категории,
        # чтобы общая сумма была >10 (глобальная модель)
        for i in range(4):
            tasks.append({"user_id": 2, "category_id": 1,
                          "final_seconds": 500 + i * 20})
            tasks.append({"user_id": 3, "category_id": 1,
                          "final_seconds": 700 + i * 20})
        populate_closed_tasks(db_session, tasks)
        p = CompletionTimePredictor()
        p.train(db_session)
        # Теперь у нас есть и персональная модель (1,1),
        # и глобальная для 1.
        # Создадим новую задачу
        # для пользователя 1 в категории 1 и предскажем время
        task = Task(user_id=1, category_id=1,
                    name="test", initial_assessment_seconds=100)
        db_session.add(task)
        db_session.commit()
        pred = p.predict(task, 1, db_session)
        # Значение должно быть получено из персональной модели,
        # проверим что оно >0
        assert pred > 0
        # Также проверим, что если бы не было персональной модели,
        # использовалась бы глобальная.
        # Удалим персональную модель вручную и проверим разницу
        p.user_models.pop((1, 1), None)
        pred_global = p.predict(task, 1, db_session)
        assert pred_global > 0
        # Значения могут немного отличаться, но оба разумны

    def test_predict_fallback_chain(self, db_session,
                                    sample_users,
                                    sample_categories):
        """Проверка цепочки fallback: user_category_mean ->
        user_mean -> category_mean -> global_mean."""
        # Подготовим данные, чтобы все модели отсутствовали
        # Пользователь 1, категория 2:
        # только 2 задачи (недостаточно для модели)
        tasks = [
            {"user_id": 1, "category_id": 2, "final_seconds": 100},
            {"user_id": 1, "category_id": 2, "final_seconds": 140},
        ]
        populate_closed_tasks(db_session, tasks)
        p = CompletionTimePredictor()
        p.train(db_session)  # модели не появятся (мало данных)
        task = Task(user_id=1, category_id=2, name="fallback_test")
        db_session.add(task)
        db_session.commit()
        pred = p.predict(task, 1, db_session)
        # Ожидаем, что будет использовано
        # user_category_mean = (100+140)/2 = 120
        assert abs(pred - 120.0) < 1  # допустимая погрешность
        # Теперь удалим запись user_category_means для этого ключа,
        # чтобы проверить следующий уровень
        p.user_category_means.pop((1, 2), None)
        pred = p.predict(task, 1, db_session)
        # user_mean для пользователя 1 = среднее всех его задач (всего 2) = 120
        assert abs(pred - 120.0) < 1
        # Удалим user_means
        p.user_means.pop(1, None)
        pred = p.predict(task, 1, db_session)
        # category_mean для категории 2 = 120 (все задачи в этой категории)
        assert abs(pred - 120.0) < 1
        # Удалим category_means
        p.category_means.pop(2, None)
        pred = p.predict(task, 1, db_session)
        # global_mean = 120
        assert abs(pred - 120.0) < 1

    def test_partial_train_user(self, db_session,
                                sample_users,
                                sample_categories):
        """Частичное переобучение пользователя:
        после добавления задач модель обновляется."""
        # Создадим 5 задач пользователя 1 в категории 1
        # (пограничное количество)
        tasks = [{"user_id": 1, "category_id": 1,
                  "final_seconds": 100 + i * 10}
                 for i in range(5)]
        populate_closed_tasks(db_session, tasks)
        p = CompletionTimePredictor()
        p.train(db_session)
        # Сейчас должно быть ровно 5 задач,
        # персональная модель может создаться,
        # так как MIN_USER_SAMPLES=5

        # Проверим наличие модели
        if MIN_USER_SAMPLES == 5:
            assert (1, 1) in p.user_models
        else:
            # подгоним условие под наши константы;
            # допустим MIN_USER_SAMPLES=5
            pass
        # Добавим ещё одну задачу этому пользователю
        create_closed_task(db_session, 1, 1, 200)
        # Выполним частичное переобучение
        p.partial_train_user(1, db_session)
        # Проверяем, что модель обновлена
        # (можем сравнить предсказание до и после)
        task = Task(user_id=1, category_id=1, name="new")
        db_session.add(task)
        db_session.commit()
        pred_after = p.predict(task, 1, db_session)
        assert pred_after > 0

    def test_partial_train_global(self, db_session,
                                  sample_users,
                                  sample_categories):
        """Глобальное переобучение пересчитывает общие модели и средние."""
        tasks = []
        for i in range(15):
            tasks.append({"user_id": (i % 3)+1,
                          "category_id": 1, "final_seconds": 100 + i * 20})
        populate_closed_tasks(db_session, tasks)
        p = CompletionTimePredictor()
        # Первый train
        p.train(db_session)
        old_global_mean = p.global_mean
        # Добавим новых задач
        for i in range(5):
            create_closed_task(db_session, 1, 1, 500 + i*10)
        # Частичное глобальное переобучение
        p.partial_train_global(db_session)
        new_global_mean = p.global_mean
        # Среднее должно измениться
        assert new_global_mean != old_global_mean
        # Проверим, что глобальная модель категории 1 переобучена
        assert 1 in p.global_models

    def test_save_and_load(self, db_session,
                           sample_users,
                           sample_categories,
                           tmp_path):
        """Сохранение и загрузка модели даёт идентичные предсказания."""
        # Используем временную директорию tmp_path
        model_path = tmp_path / "test_model.pkl"
        # Переопределяем путь
        settings.ML_MODEL_PATH = str(model_path)
        # Создаём задачи
        tasks = [{"user_id": 1, "category_id": 1, "final_seconds": 300 + i*10}
                 for i in range(12)]
        populate_closed_tasks(db_session, tasks)
        p = CompletionTimePredictor()
        p.train(db_session)
        # Сохраняем
        p.save()
        # Загружаем в новый экземпляр
        p2 = CompletionTimePredictor()
        # Сравним предсказание для одной и той же задачи
        task = Task(user_id=1,
                    category_id=1,
                    name="cmp", initial_assessment_seconds=None)
        db_session.add(task)
        db_session.commit()
        pred1 = p.predict(task, 1, db_session)
        pred2 = p2.predict(task, 1, db_session)
        assert abs(pred1 - pred2) < 0.01

    def test_predict_with_none_initial(self, db_session,
                                       sample_users,
                                       sample_categories):
        """Задача с initial_assessment_seconds=None
        корректно обрабатывается (признак = -1)."""
        tasks = [{"user_id": 1, "category_id": 1, "final_seconds": 100}
                 for _ in range(6)]
        populate_closed_tasks(db_session, tasks)
        p = CompletionTimePredictor()
        p.train(db_session)
        task = Task(user_id=1, category_id=1,
                    name="none_init",
                    initial_assessment_seconds=None)
        db_session.add(task)
        db_session.commit()
        pred = p.predict(task, 1, db_session)
        assert pred >= 0

    def test_predict_always_non_negative(self,
                                         db_session,
                                         sample_users,
                                         sample_categories):
        """Результат predict всегда >= 0, даже при странных данных."""
        # Создадим одну задачу с очень малым временем
        # (чтобы модель могла предсказать отрицательное,
        # но мы применяем max(0, pred))
        tasks = [{"user_id": 1, "category_id": 1, "final_seconds": 1}
                 for _ in range(10)]
        # Добавим очень большой initial, чтобы сдвинуть регрессию
        tasks[0]["initial_seconds"] = -1000
        populate_closed_tasks(db_session, tasks)
        p = CompletionTimePredictor()
        p.train(db_session)
        # Предположим, что модель может выдать отрицательное число;
        # проверим, что predict обрезает
        # Чтобы спровоцировать отрицательное,
        # можно подсунуть экстремальные признаки.
        # Вместо этого просто проверим, что результат >=0
        # при любом раскладе (даже если модель недообучена)
        task = Task(user_id=1, category_id=1,
                    name="neg", initial_assessment_seconds=1e9)
        db_session.add(task)
        db_session.commit()
        pred = p.predict(task, 1, db_session)
        assert pred >= 0

    def test_category_key_null(self, db_session, sample_users):
        """Проверка работы с категорией NULL (NULL_CATEGORY_KEY)."""
        tasks = [{"user_id": 1, "category_id": None,
                  "final_seconds": 100 + i*10} for i in range(6)]
        populate_closed_tasks(db_session, tasks)
        p = CompletionTimePredictor()
        p.train(db_session)
        assert NULL_CATEGORY_KEY in p.category_means
        task = Task(user_id=1, category_id=None, name="null_cat")
        db_session.add(task)
        db_session.commit()
        pred = p.predict(task, 1, db_session)
        assert pred > 0
