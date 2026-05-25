import pickle
import os
from typing import Dict, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session

from app.models.task import Task, TaskStatus
from app.core.config import settings


# Минимальное количество записей для обучения модели
MIN_GLOBAL_SAMPLES = 10
MIN_USER_SAMPLES = 5

# Ключ для категории NULL
NULL_CATEGORY_KEY = "__none__"


class CompletionTimePredictor:
    def __init__(self):
        # global_models:
        # ключ = category_key (int или "__none__"),
        # значение = обученная модель
        self.global_models: Dict[Any, LinearRegression] = {}
        # user_models: ключ = (user_id, category_key), значение = модель
        self.user_models: Dict[Tuple[int, Any], LinearRegression] = {}
        # средние значения для fallback
        self.global_mean: float = 0.0  # среднее по всем завершённым задачам
        self.category_means: Dict[Any, float] = {}   # среднее по категории
        self.user_means: Dict[int, float] = {}  # среднее по пользователю
        self.user_category_means: Dict[Tuple[int, Any], float] = {}

        self._load()

    def _model_path(self) -> str:
        # динамически берём актуальный путь из настроек
        return settings.ML_MODEL_PATH

    def _load(self):
        path = self._model_path()
        if os.path.exists(path):
            with open(path, "rb") as f:
                saved = pickle.load(f)
                self.global_models = saved.get("global_models", {})
                self.user_models = saved.get("user_models", {})
                self.global_mean = saved.get("global_mean", 0.0)
                self.category_means = saved.get("category_means", {})
                self.user_means = saved.get("user_means", {})
                self.user_category_means = saved.get("user_category_means", {})
        # Если файла нет – используем только статистики после обучения

    def save(self):
        path = self._model_path()
        # на случай, если путь относительный, создаём папку, если есть
        dir_name = os.path.dirname(path)
        if dir_name:
            os.makedirs(dir_name, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump({
                "global_models": self.global_models,
                "user_models": self.user_models,
                "global_mean": self.global_mean,
                "category_means": self.category_means,
                "user_means": self.user_means,
                "user_category_means": self.user_category_means,
            }, f)

    @staticmethod
    def _category_key(category_id: Optional[int]) -> Any:
        return category_id if category_id is not None else NULL_CATEGORY_KEY

    def train(self, db: Session):
        """
        Извлекает все завершённые задачи (status=CLOSE) и обучает модели:
        - глобальные для каждой категории
        - персональные для каждого пользователя в каждой категории
        """
        closed_tasks = (
            db.query(Task)
            .filter(Task.status == TaskStatus.CLOSE,
                    Task.final_assessment_seconds.isnot(None))
            .all()
        )

        if not closed_tasks:
            return

        df = pd.DataFrame([{
            "user_id": t.user_id,
            "category_id": t.category_id,
            "category_key": self._category_key(t.category_id),
            "actual_seconds": t.final_assessment_seconds,
            "initial_seconds": t.initial_assessment_seconds,
        } for t in closed_tasks])

        # Общие средние
        self.global_mean = df["actual_seconds"].mean()
        self.category_means = (
            df.groupby("category_key")["actual_seconds"].mean().to_dict())
        self.user_means = (
            df.groupby("user_id")["actual_seconds"].mean().to_dict())
        self.user_category_means = (
            df.groupby(["user_id", "category_key"])["actual_seconds"]
            .mean().to_dict()
        )

        # ===== Обучаем глобальные модели по категориям =====
        self.global_models = {}
        for cat_key, group in df.groupby("category_key"):
            if len(group) < MIN_GLOBAL_SAMPLES:
                continue  # недостаточно данных, останется fallback
            features = self._build_features(group, fit=True)
            y = group["actual_seconds"].values
            model = LinearRegression()
            model.fit(features, y)
            self.global_models[cat_key] = model

        # ===== Обучаем персональные модели (user, category) =====
        self.user_models = {}
        for ((user_id, cat_key),
             group) in df.groupby(["user_id", "category_key"]):
            if len(group) < MIN_USER_SAMPLES:
                continue
            # для маленькой группы переобучаем LabelEncoder на лету
            features = self._build_features(group, fit=True)
            y = group["actual_seconds"].values
            # При очень малом количестве данных используем простую среднюю
            if len(group) <= 10:
                model = LinearRegression()
            else:
                model = LinearRegression()
            model.fit(features, y)
            self.user_models[(user_id, cat_key)] = model

        self.save()

    def _get_user_data(self, user_id: int, db: Session) -> pd.DataFrame:
        """Возвращает DataFrame завершённых задач конкретного пользователя."""
        tasks = (
            db.query(Task)
            .filter(
                Task.user_id == user_id,
                Task.status == TaskStatus.CLOSE,
                Task.final_assessment_seconds.isnot(None),
            )
            .all()
        )
        return pd.DataFrame([{
            "user_id": t.user_id,
            "category_id": t.category_id,
            "category_key": self._category_key(t.category_id),
            "actual_seconds": t.final_assessment_seconds,
            "initial_seconds": t.initial_assessment_seconds,
        } for t in tasks])

    def partial_train_user(self, user_id: int, db: Session):
        """Переобучает только модели для пользователя (по категориям)."""
        df = self._get_user_data(user_id, db)
        if df.empty:
            return

        # Обновляем глобальные средние пользователя (используются в fallback)
        self.user_means[user_id] = df["actual_seconds"].mean()
        user_cat_means = df.groupby("category_key")["actual_seconds"].mean()
        for cat_key, mean_val in user_cat_means.items():
            self.user_category_means[(user_id, cat_key)] = mean_val

        # Переобучаем модели для каждой категории пользователя
        for cat_key, group in df.groupby("category_key"):
            if len(group) < MIN_USER_SAMPLES:
                continue
            features = self._build_features(group)
            y = group["actual_seconds"].values
            model = LinearRegression()
            model.fit(features, y)
            self.user_models[(user_id, cat_key)] = model

        self.save()

    def partial_train_global(self, db: Session):
        """Переобучает глобальные модели и общие средние."""
        closed_tasks = (
            db.query(Task)
            .filter(Task.status == TaskStatus.CLOSE,
                    Task.final_assessment_seconds.isnot(None))
            .all()
        )
        if not closed_tasks:
            return
        df = pd.DataFrame([{
            "user_id": t.user_id,
            "category_id": t.category_id,
            "category_key": self._category_key(t.category_id),
            "actual_seconds": t.final_assessment_seconds,
            "initial_seconds": t.initial_assessment_seconds,
        } for t in closed_tasks])

        self.global_mean = df["actual_seconds"].mean()
        self.category_means = (
            df.groupby("category_key")["actual_seconds"].mean().to_dict())
        # user_means и user_category_means лучше не перезаписывать полностью,
        # потому что они уже обновляются при закрытии задач.
        # Но для полной синхронизации можно пересчитать:
        self.user_means = (
            df.groupby("user_id")["actual_seconds"].mean().to_dict())
        self.user_category_means = (
            df.groupby(["user_id", "category_key"])["actual_seconds"]
            .mean().to_dict()
        )

        # Обучаем глобальные модели заново
        self.global_models = {}
        for cat_key, group in df.groupby("category_key"):
            if len(group) < MIN_GLOBAL_SAMPLES:
                continue
            features = self._build_features(group)
            y = group["actual_seconds"].values
            model = LinearRegression()
            model.fit(features, y)
            self.global_models[cat_key] = model

        self.save()

    def _build_features(self, df: pd.DataFrame,
                        fit: bool = False) -> np.ndarray:
        """
        Строит матрицу признаков для DataFrame,
        содержащего user_id, category_key,
        actual_seconds, initial_seconds.
        Используемые признаки:
        - user_cat_mean: среднее время пользователя в данной категории
        - user_global_mean: среднее время пользователя по всем задачам
        - initial_seconds: начальная оценка (если есть, иначе -1 или 0)
        """
        # Считаем статистики прямо внутри,
        # чтобы не зависеть от внешних словарей

        # user_cat_mean
        user_cat_means = (
            df.groupby(["user_id", "category_key"])["actual_seconds"]
            .transform("mean"))
        # user_global_mean
        user_global_means = (
            df.groupby("user_id")["actual_seconds"]
            .transform("mean"))

        features = []
        features.append(user_cat_means.values.reshape(-1, 1))
        features.append(user_global_means.values.reshape(-1, 1))

        # initial_seconds
        init = (df["initial_seconds"].fillna(-1)
                .values.reshape(-1, 1))  # -1 для пустых
        features.append(init)

        return np.hstack(features)

    def predict(self, task: Task, user_id: int, db: Session) -> float:
        """
        Возвращает предсказанное время в секундах для задачи task.
        """
        cat_key = self._category_key(task.category_id)

        # Пытаемся использовать персональную модель
        user_model = self.user_models.get((user_id, cat_key))
        if user_model is not None:
            features = (
                self._make_prediction_features(task,
                                               user_id,
                                               cat_key, db))
            return max(0.0, user_model.predict(features)[0])

        # Иначе – глобальная модель категории
        global_model = self.global_models.get(cat_key)
        if global_model is not None:
            features = (
                self._make_prediction_features(task,
                                               user_id,
                                               cat_key, db))
            return max(0.0, global_model.predict(features)[0])

        # Fallback: среднее пользователя в этой категории →
        # среднее пользователя → среднее категории → глобальное
        return self._fallback(user_id, cat_key)

    def _make_prediction_features(self, task: Task,
                                  user_id: int, cat_key: Any,
                                  db: Session) -> np.ndarray:
        """
        Строит вектор признаков для одной задачи.
        Необходимо вычислить user_cat_mean
        и user_global_mean по сохранённым статистикам
        или запросить их динамически.
        Используем уже вычисленные средние,
        если есть; иначе – глобальное среднее.
        """
        # user_cat_mean – берём из self.user_category_means
        user_cat_mean = self.user_category_means.get((user_id, cat_key), None)
        if user_cat_mean is None:
            # если нет истории, используем среднее категории
            user_cat_mean = self.category_means.get(cat_key, self.global_mean)

        # user_global_mean
        user_global_mean = self.user_means.get(user_id, None)
        if user_global_mean is None:
            user_global_mean = self.global_mean

        init = task.initial_assessment_seconds \
            if task.initial_assessment_seconds is not None else -1

        return np.array([[user_cat_mean, user_global_mean, init]])

    def _fallback(self, user_id: int, cat_key: Any) -> float:
        # 1. среднее пользователя в этой категории
        val = self.user_category_means.get((user_id, cat_key))
        if val is not None:
            return val
        # 2. среднее пользователя (все категории)
        val = self.user_means.get(user_id)
        if val is not None:
            return val
        # 3. среднее категории
        val = self.category_means.get(cat_key)
        if val is not None:
            return val
        # 4. общее среднее
        return self.global_mean


# Глобальный экземпляр, загружается при импорте
predictor = CompletionTimePredictor()
