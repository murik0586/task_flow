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

const getProfileCache = () => {
  try {
    return JSON.parse(localStorage.getItem('user_profiles') || '{}');
  } catch {
    return {};
  }
};

const saveProfileCache = (email, profile) => {
  const cache = getProfileCache();
  cache[email] = {
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
  };
  localStorage.setItem('user_profiles', JSON.stringify(cache));
};

const getCachedProfile = (email) => getProfileCache()[email] || {};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem('access_token')),
  );

  const persistSession = useCallback((tokens, profile = {}) => {
    const cached = profile.email ? getCachedProfile(profile.email) : {};
    const nextUser = {
      email: profile.email || '',
      first_name: profile.first_name || cached.first_name || '',
      last_name: profile.last_name || cached.last_name || '',
    };

    if (nextUser.email) {
      saveProfileCache(nextUser.email, nextUser);
    }

    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
    setIsAuthenticated(true);
  }, []);

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

  const login = useCallback(
    async (email, password) => {
      const { data } = await authApi.login(email, password);
      const cached = getCachedProfile(email);

      persistSession(data, { email, ...cached });
    },
    [persistSession],
  );

  const register = useCallback(
    async (formData) => {
      const { data: userData } = await authApi.register(formData);
      const { data: tokenData } = await authApi.login(formData.email, formData.password);
      persistSession(tokenData, userData);
    },
    [persistSession],
  );

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    await authApi.changePassword(oldPassword, newPassword);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      login,
      register,
      logout,
      changePassword,
    }),
    [changePassword, isAuthenticated, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
