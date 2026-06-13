import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { categoriesApi } from '../api/categoriesApi';
import { getApiErrorMessage } from '../api/client';
import { mlApi } from '../api/mlApi';
import { tasksApi } from '../api/tasksApi';
import { Container } from '../components/layout/Container';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
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

const EMPTY_FORM = {
  name: '',
  description: '',
  category_id: '',
  priority: 'medium',
};

export const TaskDetailsPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [categories, setCategories] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [initialDuration, setInitialDuration] = useState(EMPTY_DURATION);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [completingTask, setCompletingTask] = useState(false);
  const [finalDuration, setFinalDuration] = useState(EMPTY_DURATION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState('');
  const [predictionError, setPredictionError] = useState('');

  const categoryName = useMemo(() => {
    return categories.find((category) => category.id === task?.category_id)?.name || 'Без категории';
  }, [categories, task?.category_id]);

  const loadTask = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [{ data: taskData }, { data: categoryData }] = await Promise.all([
        tasksApi.getTask(taskId),
        categoriesApi.getCategories({ limit: 500 }),
      ]);

      setTask(taskData);
      setCategories(categoryData);
      setFormData({
        name: taskData.name,
        description: taskData.description || '',
        category_id: taskData.category_id || '',
        priority: taskData.priority || 'medium',
      });
      setInitialDuration(secondsToParts(taskData.initial_assessment_seconds));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось загрузить задачу'));
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const loadPrediction = async () => {
    setPredicting(true);
    setPredictionError('');

    try {
      const { data } = await mlApi.predictTask(taskId);
      setPrediction(data);
    } catch (err) {
      setPredictionError(getApiErrorMessage(err, 'Не удалось получить прогноз'));
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data } = await tasksApi.updateTask(taskId, { ...formData, initialDuration });
      setTask(data);
      setIsEditing(false);
      setFormData({
        name: data.name,
        description: data.description || '',
        category_id: data.category_id || '',
        priority: data.priority || 'medium',
      });
      setInitialDuration(secondsToParts(data.initial_assessment_seconds));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось сохранить задачу'));
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: task.name,
      description: task.description || '',
      category_id: task.category_id || '',
      priority: task.priority || 'medium',
    });
    setInitialDuration(secondsToParts(task.initial_assessment_seconds));
  };

  const changeStatus = async (nextStatus) => {
    setSaving(true);
    setError('');

    try {
      const { data } = await tasksApi.updateStatus(taskId, nextStatus);
      setTask(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось сменить статус'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusClick = (nextStatus) => {
    if (nextStatus === 'close' && task.status !== 'close') {
      setCompletingTask(true);
      setFinalDuration(secondsToParts(task.initial_assessment_seconds));
      return;
    }

    changeStatus(nextStatus);
  };

  const confirmComplete = async () => {
    setSaving(true);
    setError('');

    try {
      const { data: updatedTask } = await tasksApi.updateTask(taskId, {
        name: task.name,
        description: task.description || '',
        category_id: task.category_id || '',
        priority: task.priority || 'medium',
        finalDuration,
      });
      const { data } = await tasksApi.updateStatus(taskId, 'close');
      setTask({ ...data, final_assessment_seconds: updatedTask.final_assessment_seconds });
      setCompletingTask(false);
      setFinalDuration(EMPTY_DURATION);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось завершить задачу'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await tasksApi.deleteTask(taskId);
      navigate('/tasks');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось удалить задачу'));
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="centered-block">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error && !task) {
    return (
      <Container>
        <main style={{ padding: '2rem 0' }}>
          <ErrorMessage message={error} onRetry={loadTask} />
        </main>
      </Container>
    );
  }

  return (
    <Container>
      <main style={{ padding: '2rem 0 3rem' }}>
        <Link to="/tasks" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
          ← Назад к задачам
        </Link>

        {error && (
          <div style={{ marginTop: '1rem' }}>
            <ErrorMessage message={error} />
          </div>
        )}

        <section className="card" style={{ marginTop: '1rem' }}>
          <div className="task-card__header">
            <div>
              <h1>{isEditing ? 'Редактирование задачи' : task.name}</h1>
              {!isEditing && <p style={{ color: 'var(--secondary-color)' }}>ID: {task.id}</p>}
            </div>
            {!isEditing && <Badge status={task.status} />}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} style={{ marginTop: '1rem' }}>
              <Input
                label="Название"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
              <Textarea
                label="Описание"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
              />
              <label className="field-label" htmlFor="details-category">
                Категория
              </label>
              <select
                id="details-category"
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
              <label className="field-label" htmlFor="details-priority" style={{ marginTop: '1rem' }}>
                Приоритет
              </label>
              <select
                id="details-priority"
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
                  {saving ? 'Сохраняю...' : 'Сохранить'}
                </Button>
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  Отмена
                </Button>
              </div>
            </form>
          ) : (
            <>
              <dl className="details-list">
                <div>
                  <dt>Категория</dt>
                  <dd>{categoryName}</dd>
                </div>
                <div>
                  <dt>Приоритет</dt>
                  <dd>{PRIORITY_LABELS[task.priority] || task.priority || 'Средний'}</dd>
                </div>
                <div>
                  <dt>Описание</dt>
                  <dd>{task.description || 'Нет описания'}</dd>
                </div>
                <div>
                  <dt>Плановое время</dt>
                  <dd>
                    {task.initial_assessment_seconds
                      ? formatSeconds(task.initial_assessment_seconds)
                      : 'Не указано'}
                  </dd>
                </div>
                <div>
                  <dt>Фактическое время</dt>
                  <dd>
                    {task.final_assessment_seconds
                      ? formatSeconds(task.final_assessment_seconds)
                      : 'Пока не указано'}
                  </dd>
                </div>
              </dl>

              <div className="status-actions" style={{ marginTop: '1.5rem' }}>
                {STATUS_OPTIONS.map((status) => (
                  <Button
                    key={status.value}
                    size="sm"
                    variant={task.status === status.value ? 'primary' : 'secondary'}
                    disabled={task.status === status.value || saving}
                    onClick={() => handleStatusClick(status.value)}
                  >
                    {STATUS_LABELS[status.value]}
                  </Button>
                ))}
              </div>

              <div className="actions-row">
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  Редактировать
                </Button>
                <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                  Удалить
                </Button>
              </div>
            </>
          )}
        </section>

        {!isEditing && (
          <section className="card" style={{ marginTop: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>ML-прогноз времени</h2>
            {predictionError && (
              <div style={{ marginBottom: '1rem' }}>
                <ErrorMessage message={predictionError} />
              </div>
            )}
            {prediction ? (
              <div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {formatSeconds(prediction.predicted_seconds)}
                </p>
                <p style={{ color: 'var(--secondary-color)' }}>{prediction.message}</p>
              </div>
            ) : (
              <p style={{ color: 'var(--secondary-color)', marginBottom: '1rem' }}>
                Нажмите кнопку, чтобы получить прогноз времени выполнения на основе вашей истории задач.
              </p>
            )}
            <Button onClick={loadPrediction} disabled={predicting}>
              {predicting ? 'Считаю...' : 'Получить прогноз'}
            </Button>
          </section>
        )}

        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Удалить задачу?"
          confirmText="Удалить"
          onConfirm={confirmDelete}
        >
          <p>Задача «{task.name}» будет удалена без восстановления.</p>
        </Modal>

        <Modal
          isOpen={completingTask}
          onClose={() => {
            setCompletingTask(false);
            setFinalDuration(EMPTY_DURATION);
          }}
          title="Завершить задачу"
          confirmText="Сохранить и завершить"
          onConfirm={confirmComplete}
        >
          <p style={{ marginBottom: '1rem' }}>
            Сколько времени вы потратили на «{task.name}»? Мы подставили вашу первоначальную оценку — при
            необходимости скорректируйте.
          </p>
          <TimeDurationSliders value={finalDuration} onChange={setFinalDuration} />
        </Modal>
      </main>
    </Container>
  );
};
