import { plainDate } from '@slotted/core/date';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Calendar, CalendarDayMark, CalendarDayMarks, CalendarDayValue } from './index';

describe('a month with content in its days', () => {
  it('draws the marks and the figure of a day, names it, and fills its column', () => {
    const { container } = render(
      <div style={{ inlineSize: 480 }}>
        <Calendar
          dayLabel={(date) =>
            date.day === 20 ? 'October 20; 2 items, 1 open' : `October ${String(date.day)}`
          }
          defaultFocusedDate={plainDate(2026, 10, 1)}
          layout="fill"
          renderDay={(date) =>
            date.day === 20 && date.month === 10 ? (
              <>
                <CalendarDayMarks>
                  <CalendarDayMark tone="data-1" />
                  <CalendarDayMark hollow tone="data-2" />
                </CalendarDayMarks>
                <CalendarDayValue>−220</CalendarDayValue>
              </>
            ) : null
          }
        />
      </div>,
    );
    const day = screen.getByRole('button', { name: 'October 20; 2 items, 1 open' });
    const marks = [...day.querySelectorAll<HTMLElement>('[data-part="day-mark"]')];
    const value = day.querySelector<HTMLElement>('[data-part="day-value"]')!;
    const header = container.querySelector('[data-part="week-header"]')!;

    expect(marks.map((mark) => mark.dataset['tone'])).toEqual(['data-1', 'data-2']);
    expect(marks[1]!.hasAttribute('data-hollow')).toBe(true);
    expect(getComputedStyle(marks[1]!).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(value.textContent).toBe('−220');
    expect(value.getBoundingClientRect().height).toBeLessThan(20);
    expect(header.getBoundingClientRect().width).toBeCloseTo(480 / 7, 0);
  });
});
