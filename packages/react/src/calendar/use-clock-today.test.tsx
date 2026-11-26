import { plainDate } from '@slotted/core/date';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useClockToday } from './use-clock-today';

describe('useClockToday', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 25, 12));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('knows no day in the markup a server writes', () => {
    expect(renderToString(<Day />)).toBe('none');
  });

  it('knows the day in a render on the client, and keeps one snapshot for it', () => {
    const days: unknown[] = [];
    const { rerender } = render(<Day onDay={(day) => days.push(day)} />);
    rerender(<Day onDay={(day) => days.push(day)} />);

    expect(days[0]).toEqual(plainDate(2026, 11, 25));
    expect(days[1]).toBe(days[0]);
  });
});

function Day({ onDay }: { onDay?: (day: unknown) => void }) {
  const day = useClockToday(undefined);
  onDay?.(day);

  return day === null ? 'none' : `${String(day.year)}-${String(day.month)}-${String(day.day)}`;
}
