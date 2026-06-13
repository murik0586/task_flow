import { describe, expect, it } from 'vitest';
import { getUserDisplayName } from '../../utils/userDisplay';

describe('getUserDisplayName', () => {
  it('возвращает имя пользователя, если оно задано', () => {
    expect(getUserDisplayName({ first_name: 'Иван', email: 'ivan@test.com' })).toBe(
      'Иван',
    );
  });

  it('обрезает пробелы в имени', () => {
    expect(getUserDisplayName({ first_name: '  Анна  ' })).toBe('Анна');
  });

  it('использует часть email до @, если имени нет', () => {
    expect(getUserDisplayName({ email: 'user@example.com' })).toBe('user');
  });

  it('возвращает fallback для пустого пользователя', () => {
    expect(getUserDisplayName(null)).toBe('пользователь');
    expect(getUserDisplayName({})).toBe('пользователь');
  });
});
