import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import { render } from '@testing-library/react';
import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';

import { DatePicker } from '../date-picker';
import { DateRangePicker } from '../date-range-picker';
import { DateTimePicker } from '../datetime-picker';
import { DateTimeRangePicker } from '../datetime-range-picker';
import { TimePicker } from '../time-picker';
import { TimeRangePicker } from '../time-range-picker';

const day = (date: number) => plainDate(2026, 11, date);
const at = (date: number, hour: number) => plainDateTime(day(date), plainTime(hour));
const RUN = { start: at(27, 17), end: at(30, 22) };
const DAYS = { start: day(27), end: day(30) };
const TIMES = { start: plainTime(9), end: plainTime(22, 45) };
const US = { defaultOpen: true, hourCycle: 12, locale: 'en-US' } as const;

const PICKERS: [string, ReactElement][] = [
  ['date', <DatePicker defaultOpen presets={[preset(day(30))]} />],
  ['time', <TimePicker {...US} />],
  ['date-range', <DateRangePicker defaultOpen defaultValue={DAYS} presets={[preset(DAYS)]} />],
  ['datetime', <DateTimePicker {...US} presets={[preset(at(30, 14))]} />],
  ['time-range', <TimeRangePicker {...US} defaultValue={TIMES} />],
  ['datetime-range', <DateTimeRangePicker {...US} defaultValue={RUN} />],
];

/* One module of 280 for a day or a time, two for both or for a run, beside a rail
   of 148, and the two edges of the surface. */
const WIDTHS: Record<string, number> = {
  date: 430,
  time: 430,
  'date-range': 710,
  datetime: 710,
  'time-range': 710,
  'datetime-range': 710,
};

describe('the panel of a picker', () => {
  beforeEach(async () => {
    await page.viewport(1440, 1000);
  });
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it.each(PICKERS)('%s keeps its grid, and nothing in it scrolls', (kind, picker) => {
    render(picker);
    const { offsetWidth, scrollHeight, clientHeight } = surface();

    expect(offsetWidth).toBe(WIDTHS[kind]);
    expect(scrollHeight).toBe(clientHeight);
  });

  it.each(PICKERS)('%s is one column of a phone', async (_, picker) => {
    await page.viewport(390, 844);
    render(picker);

    expect(surface().offsetWidth).toBeLessThanOrEqual(390);
    expect(document.documentElement.scrollWidth).toBe(390);
  });
});

function preset<V>(value: V) {
  return { label: 'A shortcut', value };
}

function surface() {
  return document.querySelector<HTMLElement>('[data-part="content"]')!;
}
