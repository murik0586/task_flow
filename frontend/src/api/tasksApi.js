import { apiClient } from './client';

import { partsToSeconds } from '../utils/timeDuration';

const cleanTaskPayload = (task) => {
  const payload = {
    name: task.name.trim(),
    description: task.description?.trim() || '',
    category_id: task.category_id ? Number(task.category_id) : null,
    priority: task.priority || 'medium',
  };

  if (task.initialDuration) {
    const seconds = partsToSeconds(task.initialDuration);
    payload.initial_assessment_seconds = seconds > 0 ? seconds : null;
  } else if (task.initial_assessment_seconds !== undefined) {
    payload.initial_assessment_seconds = task.initial_assessment_seconds;
  }

  if (task.finalDuration) {
    const seconds = partsToSeconds(task.finalDuration);
    payload.final_assessment_seconds = seconds > 0 ? seconds : null;
  } else if (task.final_assessment_seconds !== undefined) {
    payload.final_assessment_seconds = task.final_assessment_seconds;
  }

  return payload;
};

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

export { cleanTaskPayload };
