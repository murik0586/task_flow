import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { AuthContext } from '../store/AuthContext';
import { getUserDisplayName } from '../utils/userDisplay';

export const HomePage = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const displayName = getUserDisplayName(user);

  return (
    <Container>
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Task Flow</h1>

        {isAuthenticated ? (
          <>
            <p style={{ fontSize: '1.25rem', color: 'var(--secondary-color)', marginBottom: '2rem' }}>
              Добро пожаловать, {displayName}!
            </p>
            <p style={{ color: 'var(--secondary-color)', marginBottom: '2rem' }}>
              Выберите, с чего начнёте работу сегодня.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/tasks">
                <Button variant="primary" size="lg">
                  Мои задачи
                </Button>
              </Link>
              <Link to="/categories">
                <Button variant="secondary" size="lg">
                  Категории
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: '1.25rem', color: 'var(--secondary-color)', marginBottom: '2rem' }}>
              Управляйте задачами легко и эффективно
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/login">
                <Button variant="primary" size="lg">
                  Вход
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="lg">
                  Регистрация
                </Button>
              </Link>
            </div>
          </>
        )}

        <div
          style={{
            marginTop: '4rem',
            textAlign: 'left',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <h2>Основные возможности</h2>
          <ul style={{ marginTop: '1rem', listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '0.75rem' }}>✅ Создание, редактирование и удаление задач</li>
            <li style={{ marginBottom: '0.75rem' }}>✅ Фильтрация по статусу и категориям</li>
            <li style={{ marginBottom: '0.75rem' }}>✅ Сортировка по дате, названию и статусу</li>
            <li style={{ marginBottom: '0.75rem' }}>✅ Прогноз времени выполнения на основе ИИ</li>
            <li style={{ marginBottom: '0.75rem' }}>✅ Удобный личный кабинет и смена пароля</li>
          </ul>
        </div>
      </div>
    </Container>
  );
};
