import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let onUnauthorized;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      onUnauthorized?.();
      return Promise.reject(refreshError);
    }
  },
);

export const getApiErrorMessage = (error, fallback = 'Произошла ошибка') => {
  const detail = error.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(', ');
  }

  return detail || error.message || fallback;
};
