export const STATUS_LABELS = {
  open: 'Открыта',
  work: 'В работе',
  waiting: 'Ожидание',
  close: 'Завершена',
  cancelled: 'Отменена'
};

// Для удобного использования в select/фильтрах
export const STATUS_OPTIONS = [
  { value: 'open', label: 'Открыта' },
  { value: 'work', label: 'В работе' },
  { value: 'waiting', label: 'Ожидание' },
  { value: 'close', label: 'Завершена' },
  { value: 'cancelled', label: 'Отменена' }
];