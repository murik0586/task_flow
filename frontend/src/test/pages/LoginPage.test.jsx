import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '../../pages/LoginPage';
import { renderWithProviders } from '../testUtils';

describe('LoginPage', () => {
  it('успешно логинит пользователя и перенаправляет на главную', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<LoginPage />, { authValue: { login } });

    await user.type(screen.getByLabelText(/email/i), 'user@test.com');
    await user.type(screen.getByLabelText(/пароль/i), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('user@test.com', 'secret123');
    });
  });

  it('показывает ошибку при неудачном входе', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue({
      response: { data: { detail: 'Неверный пароль' } },
    });

    renderWithProviders(<LoginPage />, { authValue: { login } });

    await user.type(screen.getByLabelText(/email/i), 'user@test.com');
    await user.type(screen.getByLabelText(/пароль/i), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Неверный пароль')).toBeInTheDocument();
  });

  it('требует заполнения обязательных полей', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeRequired();
    expect(screen.getByLabelText(/пароль/i)).toBeRequired();
  });
});
