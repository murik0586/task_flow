import { useState, useEffect } from 'react';
import { Spinner } from '../components/ui/Spinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { EmptyState } from '../components/ui/EmptyState';
import { tasksApi } from '../api/tasksApi';

export const TasksPageExample = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tasksApi.getTasks();
      setTasks(data.items);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return <Spinner size="lg" fullPage />;
  if (error) return <ErrorMessage message={error} onRetry={fetchTasks} />;
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Нет задач"
        description="Создайте свою первую задачу, чтобы начать работу"
        actionText="Создать задачу"
        onAction={() => { /* открыть модалку создания */ }}
        icon="📋"
      />
    );
  }

  return (
    <div>
      {/* Здесь рендер списка задач */}
      {tasks.map(task => (
        <div key={task.id}>{task.name}</div>
      ))}
    </div>
  );
};