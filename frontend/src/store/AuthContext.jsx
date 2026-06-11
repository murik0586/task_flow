import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi';
import { setUnauthorizedHandler } from '../api/client';

export const AuthContext = createContext(null);

const getStoredUser = () => {
  const rawUser = localStorage.getItem('user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem('access_token')),
  );

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password);
    const nextUser = { email };

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
    setIsAuthenticated(true);
  }, []);

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    await authApi.changePassword(oldPassword, newPassword);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      login,
      logout,
      changePassword,
    }),
    [changePassword, isAuthenticated, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
