import { useState, useContext } from 'react';
import { getApiErrorMessage } from '../api/client';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Input } from '../components/ui/Input';
import { AuthContext } from '../store/AuthContext';

export const ProfilePage = () => {
  const { user, changePassword } = useContext(AuthContext);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      await changePassword(oldPassword, newPassword);
      setMessage('Пароль успешно изменён');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Ошибка смены пароля'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 0 3rem' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>Профиль пользователя</h1>

        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Информация</h2>
          <p>
            <strong>Email:</strong> {user?.email || 'Неизвестно'}
          </p>
        </section>

        <section className="card">
          <h2 style={{ marginBottom: '1rem' }}>Смена пароля</h2>
          {message && (
            <div style={{ color: '#15803d', marginBottom: '1rem' }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{ marginBottom: '1rem' }}>
              <ErrorMessage message={error} />
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <Input
              label="Текущий пароль"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <Input
              label="Новый пароль"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Подтвердите новый пароль"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Меняю...' : 'Сменить пароль'}
            </Button>
          </form>
        </section>
      </main>
    </Container>
  );
};