## Описание

Task Flow — это To-Do приложение, разработанное в рамках дисциплины «Разработка прототипов программных решений». Проект реализует полный цикл работы с задачами: создание, редактирование, удаление, фильтрацию по статусу и категориям, а также AI-функцию прогноза времени выполнения на основе истории пользователя.

## Архитектура проекта

Проект построен на основе **многослойной архитектуры** с чётным разделением ответственности:

| Слой | Назначение | Технологии |
|------|------------|------------|
| **Frontend** | UI, маршрутизация, работа с API | React, Vite, React Router, Axios |
| **API слой** | Обработка HTTP-запросов, валидация, сериализация | FastAPI |
| **Слой бизнес-логики** | Реализация правил приложения, AI-функции | Python-сервисы |
| **Слой данных** | Работа с БД, ORM-модели, миграции | SQLAlchemy, Alembic |
| **База данных** | Хранение пользователей, задач, категорий | PostgreSQL |
| **Тестирование** | Backend: pytest; Frontend: Vitest + React Testing Library | pytest, Vitest |
| **Контейнеризация** | Изоляция и воспроизводимость окружения | Docker + Docker Compose |

### Структура проекта

```
task_flow/
├── backend/          # FastAPI, SQLAlchemy, ML-модель
├── frontend/         # React SPA (Vite)
├── docs/             # Дополнительная документация
└── docker-compose.prod.yml
```

![](./pics/tree.png)

---

## Frontend

SPA на **React 19** + **Vite**. Основные возможности:

- авторизация и регистрация;
- список задач с фильтрами, сортировкой и оценкой времени;
- страница задачи с редактированием, сменой статуса и ML-прогнозом;
- управление категориями;
- светлая/тёмная тема, PWA.

### Структура `frontend/src`

| Папка | Содержимое |
|-------|------------|
| `api/` | HTTP-клиент и запросы к backend |
| `pages/` | Страницы приложения |
| `components/` | UI-компоненты и layout |
| `store/` | React Context (auth, theme) |
| `routes/` | Маршрутизация, защищённые маршруты |
| `utils/` | Вспомогательные функции (время, имя пользователя) |
| `test/` | Автотесты (Vitest + RTL) |

### Локальный запуск фронтенда

```bash
cd frontend
npm install
npm run dev
```

Приложение: http://localhost:5173  
Запросы к API проксируются на `http://localhost:8000` (см. `frontend/vite.config.js`).

Сборка production:

```bash
npm run build
npm run preview   # локальный просмотр сборки
```

---

## Backend

API на **FastAPI**. Swagger: http://localhost:8000/docs

### Локальный запуск backend

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Для работы нужна PostgreSQL (см. `DATABASE_URL` в настройках или Docker Compose).

---

## Запуск через Docker (production)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

| Сервис | URL |
|--------|-----|
| Frontend (Nginx) | http://localhost/ |
| Backend API | http://localhost:8000 |
| API через Nginx | http://localhost/api/v1/... |

Пересборка отдельных сервисов:

```bash
docker compose -f docker-compose.prod.yml build --no-cache app frontend
docker compose -f docker-compose.prod.yml up -d app frontend
```

---

## Тестирование

### Backend (pytest)

Тесты используют отдельную PostgreSQL в Docker на порту **5433**.

```bash
cd backend

# 1. Поднять тестовую БД
docker compose -f docker-compose.test.yml up -d

# 2. Установить зависимости (если ещё не установлены)
pip install -r requirements.txt

# 3. Запустить тесты
pytest -v
```

С отчётом о покрытии:

```bash
pytest -v --cov=app --cov-report=term-missing
```

Запуск отдельного файла:

```bash
pytest tests/test_api/test_tasks.py -v
```

Подробнее: [docs/testing-guide.md](docs/testing-guide.md)

### Frontend (Vitest + React Testing Library)

Тесты лежат в `frontend/src/test/` и покрывают:

- утилиты (`timeDuration`, `cleanTaskPayload`);
- страницы (Home, Login, Register, Categories);
- защищённые маршруты и UI-компоненты.

```bash
cd frontend
npm install
npm test              # один прогон
npm run test:watch    # режим watch
```

**Windows:** если `npm` не в PATH:

```powershell
$env:Path = "C:\Program Files\nodejs\;$env:Path"
cd frontend
npm test
```

---

## Документация Swagger

После запуска backend: http://localhost:8000/docs

Дополнительные материалы — в папке [docs/](docs/).
