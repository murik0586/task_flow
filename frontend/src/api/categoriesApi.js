import { apiClient } from './client';

export const categoriesApi = {
  getCategories(params = {}) {
    return apiClient.get('/categories/', { params });
  },

  createCategory(name) {
    return apiClient.post('/categories/', { name: name.trim() });
  },

  updateCategory(categoryId, name) {
    return apiClient.put(`/categories/${categoryId}`, { name: name.trim() });
  },

  deleteCategory(categoryId) {
    return apiClient.delete(`/categories/${categoryId}`);
  },
};
