import React from 'react';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../store/AuthContext';
import { ProtectedRoute } from '../routes/ProtectedRoute';

const defaultAuthValue = {
  isAuthenticated: false,
  user: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  changePassword: vi.fn(),
};

export const renderWithProviders = (
  ui,
  { route = '/', authValue = {} } = {},
) => {
  const auth = { ...defaultAuthValue, ...authValue };

  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  );
};

export const renderProtectedRoute = (
  protectedElement,
  { route = '/tasks', authValue = {} } = {},
) => {
  const auth = { ...defaultAuthValue, ...authValue };

  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/login" element={<div>Страница входа</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="tasks" element={protectedElement} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
};
