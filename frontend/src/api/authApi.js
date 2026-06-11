import { apiClient } from './client';

export const authApi = {
  register(payload) {
    return apiClient.post('/auth/register', payload);
  },

  login(email, password) {
    return apiClient.post('/auth/login', { email, password });
  },

  refresh(refreshToken) {
    return apiClient.post('/auth/refresh', { refresh_token: refreshToken });
  },

  changePassword(oldPassword, newPassword) {
    return apiClient.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};
