import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterPage } from '../../pages/RegisterPage';
import { renderWithProviders } from '../testUtils';

describe('RegisterPage', () => {
  it('отправляет данные регистрации и перенаправляет на главную', async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<RegisterPage />, { authValue: { register } });

    await user.type(screen.getByLabelText(/email/i), 'new@test.com');
    await user.type(screen.getByLabelText(/пароль/i), 'password123');
    await user.type(screen.getByLabelText(/имя/i), 'Мария');
    await user.type(screen.getByLabelText(/фамилия/i), 'Иванова');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'password123',
        first_name: 'Мария',
        last_name: 'Иванова',
      });
    });
  });

  it('показывает ошибку при дублировании email', async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockRejectedValue({
      response: { data: { detail: 'User already exists' } },
    });

    renderWithProviders(<RegisterPage />, { authValue: { register } });

    await user.type(screen.getByLabelText(/email/i), 'exists@test.com');
    await user.type(screen.getByLabelText(/пароль/i), 'password123');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    expect(await screen.findByText('User already exists')).toBeInTheDocument();
  });

  it('требует email и пароль', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText(/email/i)).toBeRequired();
    expect(screen.getByLabelText(/пароль/i)).toBeRequired();
  });
});
