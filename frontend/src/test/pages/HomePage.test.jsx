import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { HomePage } from '../../pages/HomePage';
import { renderWithProviders } from '../testUtils';

describe('HomePage', () => {
  it('показывает кнопки входа и регистрации гостю', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('link', { name: 'Вход' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Регистрация' })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.queryByRole('link', { name: 'Мои задачи' })).not.toBeInTheDocument();
  });

  it('показывает приветствие и навигацию авторизованному пользователю', () => {
    renderWithProviders(<HomePage />, {
      authValue: {
        isAuthenticated: true,
        user: { first_name: 'Игорь', email: 'igor@test.com' },
      },
    });

    expect(screen.getByText('Добро пожаловать, Игорь!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Мои задачи' })).toHaveAttribute('href', '/tasks');
    expect(screen.getByRole('link', { name: 'Категории' })).toHaveAttribute(
      'href',
      '/categories',
    );
    expect(screen.queryByRole('link', { name: /^вход$/i })).not.toBeInTheDocument();
  });
});
