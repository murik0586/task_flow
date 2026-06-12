import { apiClient } from './client';

export const categoriesApi = {
  // Получить список категорий 
  getCategories(params) {
    return apiClient.get('/categories', { params });
  },
  
  // Создать категорию
  createCategory(name) {
    return apiClient.post('/categories', { name });
  },
  
  // Обновить категорию
  updateCategory(id, name) {
    return apiClient.put(`/categories/${id}`, { name });
  },
  
  // Удалить категорию
  deleteCategory(id) {
    return apiClient.delete(`/categories/${id}`);
  }
};