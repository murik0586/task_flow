import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderProtectedRoute } from '../testUtils';

describe('ProtectedRoute', () => {
  it('перенаправляет неавторизованного пользователя на вход', () => {
    renderProtectedRoute(<div>Защищённый контент</div>);

    expect(screen.getByText('Страница входа')).toBeInTheDocument();
    expect(screen.queryByText('Защищённый контент')).not.toBeInTheDocument();
  });

  it('показывает контент авторизованному пользователю', () => {
    renderProtectedRoute(<div>Защищённый контент</div>, {
      authValue: { isAuthenticated: true, user: { email: 'user@test.com' } },
    });

    expect(screen.getByText('Защищённый контент')).toBeInTheDocument();
    expect(screen.queryByText('Страница входа')).not.toBeInTheDocument();
  });
});
