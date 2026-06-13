import { describe, expect, it } from 'vitest';
import {
  EMPTY_DURATION,
  formatDurationParts,
  formatSeconds,
  partsToSeconds,
  secondsToParts,
} from '../../utils/timeDuration';

describe('timeDuration', () => {
  describe('partsToSeconds', () => {
    it('конвертирует недели, часы и минуты в секунды', () => {
      expect(partsToSeconds({ weeks: 1, hours: 2, minutes: 30 })).toBe(
        7 * 24 * 3600 + 2 * 3600 + 30 * 60,
      );
    });

    it('возвращает 0 для пустой длительности', () => {
      expect(partsToSeconds(EMPTY_DURATION)).toBe(0);
    });

    it('обрабатывает частично заполненные значения', () => {
      expect(partsToSeconds({ minutes: 15 })).toBe(900);
    });
  });

  describe('secondsToParts', () => {
    it('разбивает секунды на части', () => {
      expect(secondsToParts(3661)).toEqual({ weeks: 0, hours: 1, minutes: 1 });
    });

    it('возвращает нули для null, 0 и отрицательных значений', () => {
      expect(secondsToParts(null)).toEqual(EMPTY_DURATION);
      expect(secondsToParts(0)).toEqual(EMPTY_DURATION);
      expect(secondsToParts(-100)).toEqual(EMPTY_DURATION);
    });

    it('округляет дробные секунды', () => {
      expect(secondsToParts(59.6)).toEqual({ weeks: 0, hours: 0, minutes: 1 });
    });
  });

  describe('formatDurationParts', () => {
    it('форматирует непустую длительность', () => {
      expect(formatDurationParts({ weeks: 1, hours: 3, minutes: 5 })).toBe(
        '1 нед. 3 ч 5 мин',
      );
    });

    it('возвращает «Не указано» для нулевой длительности', () => {
      expect(formatDurationParts(EMPTY_DURATION)).toBe('Не указано');
    });
  });

  describe('formatSeconds', () => {
    it('форматирует секунды через разбиение на части', () => {
      expect(formatSeconds(3600)).toBe('1 ч');
    });
  });
});
