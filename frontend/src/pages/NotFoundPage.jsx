import { Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';

export const NotFoundPage = () => {
  return (
    <Container>
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h1 style={{ fontSize: '6rem', marginBottom: '0.5rem' }}>404</h1>
        <h2 style={{ marginBottom: '1rem' }}>Страница не найдена</h2>
        <p style={{ color: 'var(--secondary-color)', marginBottom: '2rem' }}>
          Извините, запрашиваемая страница не существует.
        </p>
        <Link to="/">
          <Button variant="primary">На главную</Button>
        </Link>
      </div>
    </Container>
  );
};