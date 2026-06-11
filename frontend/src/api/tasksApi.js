import { apiClient } from './client';

const cleanTaskPayload = (task) => ({
  name: task.name.trim(),
  description: task.description?.trim() || '',
  category_id: task.category_id ? Number(task.category_id) : null,
  priority: task.priority || 'medium',
});

export const tasksApi = {
  getTasks(params) {
    return apiClient.get('/tasks/', { params });
  },

  getTask(taskId) {
    return apiClient.get(`/tasks/${taskId}`);
  },

  createTask(task) {
    return apiClient.post('/tasks/', cleanTaskPayload(task));
  },

  updateTask(taskId, task) {
    return apiClient.put(`/tasks/${taskId}`, cleanTaskPayload(task));
  },

  updateStatus(taskId, newStatus) {
    return apiClient.patch(`/tasks/${taskId}/status`, null, {
      params: { new_status: newStatus },
    });
  },

  deleteTask(taskId) {
    return apiClient.delete(`/tasks/${taskId}`);
  },
};
