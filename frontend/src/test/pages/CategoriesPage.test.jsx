import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoriesPage } from '../../pages/CategoriesPage';
import { renderWithProviders } from '../testUtils';
import { categoriesApi } from '../../api/categoriesApi';

vi.mock('../../api/categoriesApi', () => ({
  categoriesApi: {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoriesApi.getCategories.mockResolvedValue({ data: [] });
  });

  it('блокирует создание категории с пустым названием', async () => {
    renderWithProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Создать' })).toBeDisabled();
    });
  });

  it('создаёт категорию с валидным названием', async () => {
    const user = userEvent.setup();
    categoriesApi.createCategory.mockResolvedValue({ data: { id: 1, name: 'Работа' } });
    categoriesApi.getCategories
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ id: 1, name: 'Работа' }] });

    renderWithProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Работа')).toBeEnabled();
    });

    await user.type(screen.getByPlaceholderText('Работа'), 'Работа');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(() => {
      expect(categoriesApi.createCategory).toHaveBeenCalledWith('Работа');
    });
  });

  it('показывает ошибку при попытке создать дубликат', async () => {
    const user = userEvent.setup();
    categoriesApi.createCategory.mockRejectedValue({
      response: { data: { detail: 'Category already exists' } },
    });

    renderWithProviders(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Работа')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Работа'), 'Работа');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByText('Category already exists')).toBeInTheDocument();
  });

  it('показывает пустое состояние, если категорий нет', async () => {
    renderWithProviders(<CategoriesPage />);

    expect(await screen.findByText('Категорий нет')).toBeInTheDocument();
  });
});
