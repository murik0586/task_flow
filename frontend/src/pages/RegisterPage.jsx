import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { getApiErrorMessage } from '../api/client';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Input } from '../components/ui/Input';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authApi.register(formData);
      navigate('/login');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Ошибка регистрации'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <main style={{ maxWidth: 460, margin: '0 auto', padding: '3rem 0' }}>
        <form onSubmit={handleSubmit} className="card">
          <h1 style={{ marginBottom: '1rem' }}>Регистрация</h1>
          {error && (
            <div style={{ marginBottom: '1rem' }}>
              <ErrorMessage message={error} />
            </div>
          )}
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Пароль"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <Input
            label="Имя"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          />
          <Input
            label="Фамилия"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          />
          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
          </Button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </main>
    </Container>
  );
};