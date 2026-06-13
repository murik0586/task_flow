import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../api/categoriesApi';
import { getApiErrorMessage } from '../api/client';
import { tasksApi } from '../api/tasksApi';
import { Container } from '../components/layout/Container';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { Textarea } from '../components/ui/Textarea';
import { TimeDurationSliders } from '../components/ui/TimeDurationSliders';
import { PRIORITY_LABELS, PRIORITY_OPTIONS } from '../constants/priorityLabels';
import { STATUS_LABELS, STATUS_OPTIONS } from '../constants/statusLabels';
import {
  EMPTY_DURATION,
  formatSeconds,
  secondsToParts,
} from '../utils/timeDuration';

const PAGE_SIZE = 10;
const EMPTY_FORM = {
  name: '',
  description: '',
  category_id: '',
  priority: 'medium',
};

export const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [initialDuration, setInitialDuration] = useState(EMPTY_DURATION);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [finalDuration, setFinalDuration] = useState(EMPTY_DURATION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const categoryById = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await tasksApi.getTasks({
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        category_id: categoryFilter || undefined,
        sort_by: sortBy || undefined,
        sort_order: sortBy ? sortOrder : undefined,
      });

      setTasks(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось загрузить задачи'));
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, page, sortBy, sortOrder, statusFilter]);

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await categoriesApi.getCategories({ limit: 500 });
      setCategories(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось загрузить категории'));
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setInitialDuration(EMPTY_DURATION);
    setEditingTask(null);
  };

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = { ...formData, initialDuration };

      if (editingTask) {
        await tasksApi.updateTask(editingTask.id, payload);
      } else {
        await tasksApi.createTask(payload);
      }

      resetForm();
      await loadTasks();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось сохранить задачу'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      category_id: task.category_id || '',
      priority: task.priority || 'medium',
    });
    setInitialDuration(secondsToParts(task.initial_assessment_seconds));
  };

  const changeStatus = async (taskId, nextStatus) => {
    try {
      const { data } = await tasksApi.updateStatus(taskId, nextStatus);
      setTasks((current) => current.map((task) => (task.id === taskId ? data : task)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось сменить статус'));
    }
  };

  const handleStatusClick = (task, nextStatus) => {
    if (nextStatus === 'close' && task.status !== 'close') {
      setCompletingTask(task);
      setFinalDuration(secondsToParts(task.initial_assessment_seconds));
      return;
    }

    changeStatus(task.id, nextStatus);
  };

  const confirmComplete = async () => {
    if (!completingTask) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await tasksApi.updateTask(completingTask.id, {
        name: completingTask.name,
        description: completingTask.description || '',
        category_id: completingTask.category_id || '',
        priority: completingTask.priority || 'medium',
        finalDuration,
      });
      await changeStatus(completingTask.id, 'close');
      setCompletingTask(null);
      setFinalDuration(EMPTY_DURATION);
      await loadTasks();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось завершить задачу'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTask) {
      return;
    }

    try {
      await tasksApi.deleteTask(deleteTask.id);
      setDeleteTask(null);
      await loadTasks();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось удалить задачу'));
    }
  };

  return (
    <Container>
      <main style={{ padding: '2rem 0 3rem' }}>
        <div className="page-header">
          <div>
            <h1>Задачи</h1>
            <p style={{ color: 'var(--secondary-color)' }}>
              Планируйте работу, отслеживайте прогресс и фиксируйте, сколько времени ушло на выполнение.
            </p>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <ErrorMessage message={error} onRetry={loadTasks} />
          </div>
        )}

        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>{editingTask ? 'Редактировать задачу' : 'Новая задача'}</h2>
          <form onSubmit={handleSubmit}>
            <Input
              label="Название"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Например, подготовить демо"
              required
            />
            <Textarea
              label="Описание"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Коротко опишите задачу"
              rows={3}
            />
            <label className="field-label" htmlFor="task-category">
              Категория
            </label>
            <select
              id="task-category"
              name="category_id"
              value={formData.category_id}
              onChange={handleFormChange}
              className="control"
            >
              <option value="">Без категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <label className="field-label" htmlFor="task-priority" style={{ marginTop: '1rem' }}>
              Приоритет
            </label>
            <select
              id="task-priority"
              name="priority"
              value={formData.priority}
              onChange={handleFormChange}
              className="control"
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>

            <TimeDurationSliders
              label="Сколько времени планируете потратить?"
              value={initialDuration}
              onChange={setInitialDuration}
            />

            <div className="actions-row">
              <Button type="submit" disabled={saving || !formData.name.trim()}>
                {saving ? 'Сохраняю...' : editingTask ? 'Сохранить' : 'Создать'}
              </Button>
              {editingTask && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="filters-bar">
            <label>
              <span className="field-label">Статус</span>
              <select value={statusFilter} onChange={handleFilterChange(setStatusFilter)} className="control">
                <option value="">Все статусы</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="field-label">Категория</span>
              <select value={categoryFilter} onChange={handleFilterChange(setCategoryFilter)} className="control">
                <option value="">Все категории</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="field-label">Сортировка</span>
              <select value={sortBy} onChange={handleFilterChange(setSortBy)} className="control">
                <option value="">По умолчанию</option>
                <option value="id">ID</option>
                <option value="name">Название</option>
                <option value="status">Статус</option>
              </select>
            </label>

            <label>
              <span className="field-label">Порядок</span>
              <select value={sortOrder} onChange={handleFilterChange(setSortOrder)} className="control">
                <option value="asc">По возрастанию</option>
                <option value="desc">По убыванию</option>
              </select>
            </label>
          </div>
        </section>

        {loading ? (
          <div className="centered-block">
            <Spinner size="lg" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="Нет задач"
            description="Создайте первую задачу или измените фильтры."
            actionText="Сбросить фильтры"
            onAction={() => {
              setStatusFilter('');
              setCategoryFilter('');
              setSortBy('');
              setSortOrder('asc');
              setPage(1);
            }}
          />
        ) : (
          <>
            <div className="tasks-grid">
              {tasks.map((task) => (
                <article key={task.id} className="task-card">
                  <div className="task-card__header">
                    <div>
                      <Link to={`/tasks/${task.id}`} className="task-title">
                        #{task.id} {task.name}
                      </Link>
                      <p style={{ color: 'var(--secondary-color)', marginTop: '0.25rem' }}>
                        {categoryById[task.category_id] || 'Без категории'}
                      </p>
                      <p style={{ color: 'var(--secondary-color)', marginTop: '0.25rem' }}>
                        Приоритет: {PRIORITY_LABELS[task.priority] || task.priority || 'Средний'}
                      </p>
                      {task.initial_assessment_seconds > 0 && (
                        <p style={{ color: 'var(--secondary-color)', marginTop: '0.25rem' }}>
                          План: {formatSeconds(task.initial_assessment_seconds)}
                        </p>
                      )}
                      {task.final_assessment_seconds > 0 && (
                        <p style={{ color: 'var(--secondary-color)', marginTop: '0.25rem' }}>
                          Факт: {formatSeconds(task.final_assessment_seconds)}
                        </p>
                      )}
                    </div>
                    <Badge status={task.status} />
                  </div>

                  {task.description && <p className="task-description">{task.description}</p>}

                  <div className="status-actions">
                    {STATUS_OPTIONS.map((status) => (
                      <Button
                        key={status.value}
                        size="sm"
                        variant={task.status === status.value ? 'primary' : 'secondary'}
                        disabled={task.status === status.value}
                        onClick={() => handleStatusClick(task, status.value)}
                      >
                        {STATUS_LABELS[status.value]}
                      </Button>
                    ))}
                  </div>

                  <div className="actions-row">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(task)}>
                      Редактировать
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteTask(task)}>
                      Удалить
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="pagination">
              <Button variant="secondary" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
                Назад
              </Button>
              <span>
                Страница {page} из {totalPages}, всего {total}
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Вперёд
              </Button>
            </div>
          </>
        )}

        <Modal
          isOpen={Boolean(deleteTask)}
          onClose={() => setDeleteTask(null)}
          title="Удалить задачу?"
          confirmText="Удалить"
          onConfirm={confirmDelete}
        >
          <p>Задача «{deleteTask?.name}» будет удалена без восстановления.</p>
        </Modal>

        <Modal
          isOpen={Boolean(completingTask)}
          onClose={() => {
            setCompletingTask(null);
            setFinalDuration(EMPTY_DURATION);
          }}
          title="Завершить задачу"
          confirmText="Сохранить и завершить"
          onConfirm={confirmComplete}
        >
          <p style={{ marginBottom: '1rem' }}>
            Сколько времени вы потратили на «{completingTask?.name}»? Мы подставили вашу первоначальную оценку — при
            необходимости скорректируйте.
          </p>
          <TimeDurationSliders value={finalDuration} onChange={setFinalDuration} />
        </Modal>
      </main>
    </Container>
  );
};
