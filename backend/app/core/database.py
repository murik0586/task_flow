from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings


def _sync_database_url(url: str) -> str:
    return url.replace("postgresql+asyncpg://", "postgresql://", 1)


# Синхронный движок: текущие сервисы и эндпоинты используют db.query/db.commit.
engine = create_engine(
    _sync_database_url(settings.DATABASE_URL),
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False
)

# Фабрика синхронных сессий
SessionLocal = sessionmaker(
    engine,
    autocommit=False,
    autoflush=False
)

# Базовый класс для моделей
Base = declarative_base()


# Генератор зависимости FastAPI для получения сессии БД
def get_db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
