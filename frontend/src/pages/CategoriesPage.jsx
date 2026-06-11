import { useCallback, useEffect, useState } from 'react';
import { categoriesApi } from '../api/categoriesApi';
import { getApiErrorMessage } from '../api/client';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await categoriesApi.getCategories({ search: search || undefined, limit: 500 });
      setCategories(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось загрузить категории'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setName('');
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await categoriesApi.updateCategory(editingId, name);
      } else {
        await categoriesApi.createCategory(name);
      }

      resetForm();
      await loadCategories();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось сохранить категорию'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setName(category.name);
  };

  const removeCategory = async (categoryId) => {
    try {
      await categoriesApi.deleteCategory(categoryId);
      await loadCategories();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось удалить категорию'));
    }
  };

  return (
    <Container>
      <main style={{ padding: '2rem 0 3rem' }}>
        <h1>Категории</h1>
        <p style={{ color: 'var(--secondary-color)', marginBottom: '1.5rem' }}>
          Минимальный CRUD категорий для фильтров задач.
        </p>

        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <ErrorMessage message={error} onRetry={loadCategories} />
          </div>
        )}

        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <Input
              label={editingId ? 'Новое название' : 'Новая категория'}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Работа"
              required
            />
            <div className="actions-row">
              <Button type="submit" disabled={saving || !name.trim()}>
                {saving ? 'Сохраняю...' : editingId ? 'Сохранить' : 'Создать'}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <Input
            label="Поиск"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Найти категорию"
          />
        </section>

        {loading ? (
          <div className="centered-block">
            <Spinner size="lg" />
          </div>
        ) : categories.length === 0 ? (
          <EmptyState title="Категорий нет" description="Создайте категорию для группировки задач." />
        ) : (
          <div className="categories-list">
            {categories.map((category) => (
              <article key={category.id} className="category-card">
                <strong>{category.name}</strong>
                <div className="actions-row">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(category)}>
                    Редактировать
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => removeCategory(category.id)}>
                    Удалить
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </Container>
  );
};
