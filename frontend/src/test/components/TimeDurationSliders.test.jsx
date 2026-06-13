import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TimeDurationSliders } from '../../components/ui/TimeDurationSliders';

describe('TimeDurationSliders', () => {
  it('отображает итоговую длительность', () => {
    render(
      <TimeDurationSliders
        label="Плановое время"
        value={{ weeks: 0, hours: 2, minutes: 15 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Итого: 2 ч 15 мин')).toBeInTheDocument();
  });

  it('вызывает onChange при изменении слайдера', async () => {
    const onChange = vi.fn();

    render(
      <TimeDurationSliders
        value={{ weeks: 0, hours: 0, minutes: 0 }}
        onChange={onChange}
      />,
    );

    const hoursSlider = screen.getByLabelText('Часы');
    fireEvent.input(hoursSlider, { target: { value: '3' } });

    expect(onChange).toHaveBeenCalledWith({
      weeks: 0,
      hours: 3,
      minutes: 0,
    });
  });

  it('показывает «Не указано» для нулевых значений', () => {
    const { container } = render(
      <TimeDurationSliders
        value={{ weeks: 0, hours: 0, minutes: 0 }}
        onChange={vi.fn()}
      />,
    );

    expect(container.querySelector('.duration-summary')).toHaveTextContent('Итого: Не указано');
  });
});
