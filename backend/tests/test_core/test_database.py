from app.core.database import get_db
from unittest.mock import patch, MagicMock


def test_get_db():
    """Проверяем, что get_db работает корректно."""
    mock_session = MagicMock()

    with patch('app.core.database.SessionLocal') as mock_SessionLocal:
        mock_SessionLocal.return_value = mock_session

        # Вызываем генератор
        gen = get_db()
        db = next(gen)

        # Проверяем, что SessionLocal был вызван
        mock_SessionLocal.assert_called_once()

        # Проверяем, что вернулся правильный объект
        assert db is mock_session

        # Имитируем нормальное завершение
        gen.close()

        # Проверяем, что close был вызван
        mock_session.close.assert_called_once()
