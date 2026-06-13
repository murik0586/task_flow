import { describe, expect, it } from 'vitest';
import { cleanTaskPayload } from '../../api/tasksApi';

describe('cleanTaskPayload', () => {
  it('нормализует данные задачи перед отправкой', () => {
    expect(
      cleanTaskPayload({
        name: '  Задача  ',
        description: '  Описание  ',
        category_id: '3',
        priority: 'high',
        initialDuration: { weeks: 0, hours: 1, minutes: 0 },
      }),
    ).toEqual({
      name: 'Задача',
      description: 'Описание',
      category_id: 3,
      priority: 'high',
      initial_assessment_seconds: 3600,
    });
  });

  it('ставит null для пустой категории и нулевой оценки времени', () => {
    expect(
      cleanTaskPayload({
        name: 'Задача',
        category_id: '',
        initialDuration: { weeks: 0, hours: 0, minutes: 0 },
      }),
    ).toEqual({
      name: 'Задача',
      description: '',
      category_id: null,
      priority: 'medium',
      initial_assessment_seconds: null,
    });
  });

  it('сохраняет finalDuration только если она больше нуля', () => {
    expect(
      cleanTaskPayload({
        name: 'Задача',
        finalDuration: { weeks: 0, hours: 0, minutes: 30 },
      }),
    ).toEqual({
      name: 'Задача',
      description: '',
      category_id: null,
      priority: 'medium',
      final_assessment_seconds: 1800,
    });
  });

  it('использует priority medium по умолчанию', () => {
    expect(cleanTaskPayload({ name: 'Без приоритета' }).priority).toBe('medium');
  });
});
