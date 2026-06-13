---
name: frontend team plan
overview: "Собрать React/Vite фронтенд для Task Flow поверх существующего FastAPI backend: авторизация, CRUD задач, категории, фильтры, ML-прогноз, service worker и деплой через Docker/Nginx или отдельный static hosting."
todos:
  - id: verify-api
    content: Проверить Swagger и реальные ответы auth/tasks/categories/ml перед началом фронта
    status: in_progress
  - id: setup-frontend
    content: Создать React/Vite frontend и базовую структуру src
    status: pending
  - id: implement-auth
    content: Сделать axios client, auth context, login/register/refresh/protected routes
    status: pending
  - id: implement-tasks
    content: Сделать CRUD задач, фильтры, сортировку, пагинацию и смену статусов
    status: pending
  - id: implement-categories
    content: Сделать страницу категорий и подключение к API
    status: pending
  - id: polish-deploy
    content: Добавить UI states, service worker, сборку, Docker/deploy и финальный checklist
    status: pending
isProject: false
---

# План фронта Task Flow

## Что есть сейчас
- Backend уже есть: FastAPI в [backend/main.py](backend/main.py), префикс API `/api/v1`, CORS открыт.
- Фронта в репозитории пока нет, его нужно создать отдельной папкой `frontend`.
- PDF требует React, Vite, маршрутизацию, авторизацию, работу с API, service worker, сборку и деплой.
- Основной домен: todo-приложение с пользователями, задачами, категориями и ML-прогнозом времени.

## API-контракты для фронта
- Auth: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/change-password` из [backend/app/api/v1/endpoints/auth.py](backend/app/api/v1/endpoints/auth.py).
- Tasks: `GET/POST /api/v1/tasks/`, `GET/PUT/DELETE /api/v1/tasks/{id}`, `PATCH /api/v1/tasks/{id}/status` из [backend/app/api/v1/endpoints/tasks.py](backend/app/api/v1/endpoints/tasks.py).
- Categories: `GET/POST/PUT/DELETE /api/v1/categories` из [backend/app/api/v1/endpoints/categories.py](backend/app/api/v1/endpoints/categories.py).
- ML: `GET /api/v1/tasks/{task_id}/predict` из [backend/app/api/v1/endpoints/ml.py](backend/app/api/v1/endpoints/ml.py).
- Проверить перед реализацией в Swagger `http://localhost:8000/docs`: в схемах задач есть `priority`, но SQLAlchemy-модель задач в [backend/app/models/task.py](backend/app/models/task.py) его не содержит. Это может ломать создание/вывод задачи, если OpenAPI показывает поле, которого реально нет в модели.

## Базовая структура frontend
```text
frontend/
  src/
    api/
      client.js
      authApi.js
      tasksApi.js
      categoriesApi.js
      mlApi.js
    components/
      layout/
      ui/
      tasks/
      categories/
    pages/
      HomePage.jsx
      LoginPage.jsx
      RegisterPage.jsx
      TasksPage.jsx
      TaskDetailsPage.jsx
      CategoriesPage.jsx
      ProfilePage.jsx
      NotFoundPage.jsx
    routes/
      AppRouter.jsx
      ProtectedRoute.jsx
    store/
      AuthContext.jsx
    styles/
      global.css
    App.jsx
    main.jsx
```

## Распределение на 6 участников

### Мурат, опытный: архитектура фронта и интеграция
- Создает `frontend` через Vite React.
- Настраивает `axios`, `VITE_API_BASE_URL=http://localhost:8000/api/v1`, обработку ошибок и refresh token.
- Делает `AuthContext`, хранение `access_token`/`refresh_token`, logout при 401.
- Настраивает `react-router-dom`, protected routes и layout.
- Ревьюит PR новичков и держит единый стиль компонентов.

### Игорь, опытный: задачи, фильтры, CRUD
- Делает страницу `TasksPage`: список задач, пагинация, фильтр по статусу, фильтр по категории, сортировка по `id/name/status`.
- Делает создание, редактирование, удаление задачи.
- Делает быстрые действия смены статуса: `open`, `work`, `waiting`, `close`, `cancelled`.
- Делает `TaskDetailsPage` и подключает ML-прогноз `GET /tasks/{id}/predict`.
- Проверяет реальные ответы API и фиксирует несостыковки контракта.

### Владислав, опытный: auth, деплой, качество
- Делает `LoginPage`, `RegisterPage`, `ProfilePage/change-password`.
- Настраивает ESLint/Prettier, базовые npm scripts: `dev`, `build`, `preview`, `lint`.
- Добавляет service worker: лучше через `vite-plugin-pwa`, а не `workbox-webpack-plugin`, потому что проект будет на Vite.
- Добавляет Dockerfile для фронта и обновляет compose так, чтобы фронт можно было поднять рядом с backend.
- Финально проверяет сборку, auth-flow и деплой.

### Даниил, новичок: UI-kit и layout
- Делает простые переиспользуемые компоненты: `Button`, `Input`, `Select`, `Textarea`, `Modal`, `Badge`, `Spinner`, `EmptyState`, `ErrorMessage`.
- Делает общий `Header`, `Sidebar` или верхнее меню, контейнер страниц.
- Делает базовые стили в `src/styles/global.css`: цвета, отступы, typography, responsive container.
- Работает по макету/референсам, без самостоятельной логики API.

### Василий, новичок: статичные и полу-статичные страницы
- Делает `HomePage`: описание Task Flow, основные возможности, ссылка на вход/регистрацию.
- Делает `NotFoundPage`.
- Делает пустые/загрузочные/ошибочные состояния для списка задач.
- Добавляет русские тексты интерфейса и единые подписи статусов.
- Помогает с адаптивностью страниц.

### Елизар, новичок: категории и ручное тестирование
- Делает UI для `CategoriesPage`: список, поиск, создание, редактирование, удаление категорий.
- Подключает `categoriesApi.js` по готовому шаблону от опытных.
- Проверяет сценарии вручную: регистрация, логин, создать категорию, создать задачу, сменить статус, удалить задачу.
- Ведет простой checklist багов в `docs/frontend-checklist.md`.
- Готовит демо-данные и скриншоты для защиты.

## Очередность работ
1. День 1: создать `frontend`, настроить Vite, роутинг, axios client, ESLint/Prettier, базовый layout.
2. День 2: реализовать auth-flow и protected routes; новичкам параллельно делать UI-kit и статичные страницы.
3. День 3: реализовать задачи: список, создание, редактирование, удаление, смена статуса.
4. День 4: добавить категории, фильтры, сортировки, пагинацию, detail page и ML-прогноз.
5. День 5: service worker, адаптивность, error/loading states, polish UI.
6. День 6: сборка, Docker/static deploy, ручной regression checklist, фиксы перед сдачей.

## Минимальный MVP для сдачи
- Регистрация и вход работают.
- После логина доступна страница задач.
- Можно создать, посмотреть, обновить, удалить задачу.
- Можно менять статус задачи.
- Можно создать и выбрать категорию.
- Есть роутинг: `/`, `/login`, `/register`, `/tasks`, `/tasks/:id`, `/categories`.
- Есть работа с backend API, сборка `npm run build`, service worker/PWA caching.

## Риски
- API задач может падать из-за поля `priority`, если OpenAPI/schema и модель БД реально расходятся.
- Категории сейчас не защищены авторизацией, в отличие от задач. Для учебного фронта можно использовать как есть, но это нужно понимать.
- Refresh token лучше сделать сразу опытному участнику, иначе новички будут ловить неочевидные 401.
- Не тратить время на сложный state manager. Для этого масштаба достаточно Context + локальный state, максимум TanStack Query если команда успеет.
