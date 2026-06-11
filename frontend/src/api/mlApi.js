import { apiClient } from './client';

export const mlApi = {
  predictTask(taskId) {
    return apiClient.get(`/tasks/${taskId}/predict`);
  },
};
