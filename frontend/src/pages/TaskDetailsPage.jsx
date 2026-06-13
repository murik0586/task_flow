import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { categoriesApi } from '../api/categoriesApi';
import { getApiErrorMessage } from '../api/client';
import { mlApi } from '../api/mlApi';
import { tasksApi } from '../api/tasksApi';
import { Container } from '../components/layout/Container';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Spinner } from '../components/ui/Spinner';
import { PRIORITY_LABELS } from '../constants/priorityLabels';
import { formatSeconds } from '../utils/timeDuration';

export const TaskDetailsPage = () => {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [categories, setCategories] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <Container>
        <div className="centered-block">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error) {
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

        <section className="card" style={{ marginTop: '1rem' }}>
          <div className="task-card__header">
            <div>
              <h1>{task.name}</h1>
              <p style={{ color: 'var(--secondary-color)' }}>ID: {task.id}</p>
            </div>
            <Badge status={task.status} />
          </div>

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
        </section>

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
      </main>
    </Container>
  );
};
