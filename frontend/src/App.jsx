// Временно для демонстрации компонентов

import { useState } from 'react';
import './styles/global.css';
import { Header } from './components/layout/Header';
import { Container } from './components/layout/Container';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { Badge } from './components/ui/Badge';
import { Spinner } from './components/ui/Spinner';
import { ErrorMessage } from './components/ui/ErrorMessage';
import { Textarea } from './components/ui/Textarea';
import { EmptyState } from './components/ui/EmptyState';
import { Modal } from './components/ui/Modal';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Header />
      <Container>
        <div style={{ paddingBottom: '3rem' }}>
          <h1>Добро пожаловать</h1>
          
          <Input 
            label="Название задачи" 
            placeholder="Купить молоко" 
          />
          
          <Select
            label="Категория"
            options={[
              { value: 'work', label: 'Работа' },
              { value: 'personal', label: 'Личное' },
              { value: 'study', label: 'Учеба' },
            ]}
            placeholder="Выберите категорию"
          />
          
          <Textarea 
            label="Описание задачи"
            placeholder="Подробное описание..."
            rows={3}
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="primary">Создать</Button>
            <Button variant="secondary">Отмена</Button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
            <Badge status="open">OPEN</Badge>
            <Badge status="work">WORK</Badge>
            <Badge status="waiting">WAITING</Badge>
            <Badge status="close">CLOSE</Badge>
            <Badge status="cancelled">CANCELLED</Badge>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <ErrorMessage 
              message="Не удалось загрузить задачи" 
              onRetry={() => alert('Повтор')} 
            />
          </div>

          <div style={{ marginTop: '2rem' }}>
            <EmptyState 
              title="Нет задач"
              description="Создайте свою первую задачу"
              actionText="Создать задачу"
              onAction={() => alert('Создать')}
            />
          </div>

          <div style={{ marginTop: '2rem' }}>
            <Button 
              variant="primary" 
              onClick={() => setIsModalOpen(true)}
              style={{ borderRadius: '2rem' }}
            >
              Открыть модалку
            </Button>
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Подтверждение"
            onConfirm={() => {
              alert('Действие подтверждено');
              setIsModalOpen(false);
            }}
          >
            <p>Вы уверены, что хотите выполнить это действие?</p>
          </Modal>
        </div>
      </Container>
    </>
  );
}

export default App;