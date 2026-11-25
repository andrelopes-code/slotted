import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';

import { DatePicker } from '../date-picker';
import { DateRangePicker } from '../date-range-picker';
import { DateTimePicker } from '../datetime-picker';
import { DateTimeRangePicker } from '../datetime-range-picker';
import { TimePicker } from '../time-picker';
import { TimeRangePicker } from '../time-range-picker';

const day = (date: number) => plainDate(2026, 11, date);
const at = (date: number, hour: number) => plainDateTime(day(date), plainTime(hour));

interface ClearProps {
  readonly clearable?: boolean;
  readonly onValueChange: (value: unknown) => void;
  readonly required?: boolean;
}

/* Each picker open on a value, the value written at once: no confirmation. */
const PICKERS: [string, (props: ClearProps) => ReactElement][] = [
  ['date', (props) => <DatePicker {...props} defaultOpen defaultValue={day(25)} />],
  [
    'time',
    (props) => <TimePicker {...props} confirm={false} defaultOpen defaultValue={plainTime(9)} />,
  ],
  [
    'date-range',
    (props) => (
      <DateRangePicker
        {...props}
        confirm={false}
        defaultOpen
        defaultValue={{ start: day(25), end: day(27) }}
      />
    ),
  ],
  [
    'datetime',
    (props) => <DateTimePicker {...props} confirm={false} defaultOpen defaultValue={at(25, 9)} />,
  ],
  [
    'time-range',
    (props) => (
      <TimeRangePicker
        {...props}
        confirm={false}
        defaultOpen
        defaultValue={{ start: plainTime(9), end: plainTime(17) }}
      />
    ),
  ],
  [
    'datetime-range',
    (props) => (
      <DateTimeRangePicker
        {...props}
        confirm={false}
        defaultOpen
        defaultValue={{ start: at(25, 9), end: at(27, 17) }}
      />
    ),
  ],
];

describe('the Clear of a panel', () => {
  it.each(PICKERS)('%s draws none when the picker is not clearable', (_, picker) => {
    render(picker({ onValueChange: vi.fn() }));

    expect(clearIn(panel())).toBeNull();
  });

  it.each(PICKERS)('%s requests null with clearable', (_, picker) => {
    const onValueChange = vi.fn();
    render(picker({ clearable: true, onValueChange }));

    fireEvent.click(clearIn(panel())!);

    expect(onValueChange.mock.lastCall?.[0]).toBeNull();
  });

  it.each(PICKERS)('%s draws none when the value is required', (_, picker) => {
    render(picker({ clearable: true, onValueChange: vi.fn(), required: true }));

    expect(clearIn(panel())).toBeNull();
  });
});

function panel() {
  return screen.getByRole('dialog');
}

function clearIn(dialog: HTMLElement) {
  return within(dialog).queryByRole('button', { name: 'Clear' });
}
