import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import { render } from '@testing-library/react';
import { cdp, page } from 'vitest/browser';
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
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true });
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

  it('draws no footer in a sheet with nothing to say and nothing to press', async () => {
    await page.viewport(390, 844);
    render(<DatePicker defaultOpen defaultValue={day(25)} />);

    expect(document.querySelector('[data-presentation="sheet"]')).not.toBeNull();
    expect(document.querySelector('[data-part="footer"]')).toBeNull();
  });

  it('keeps each shortcut in reach where the room under the field is short', async () => {
    await page.viewport(390, 900);
    /* A mouse: the context of the suite has a touch screen, which is a coarse pointer. */
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
    render(
      <div style={{ paddingBlockStart: 430 }}>
        <DatePicker
          aria-label="Entry date"
          defaultOpen
          defaultValue={day(25)}
          presets={[{ label: 'Yesterday', value: day(24) }]}
        />
      </div>,
    );
    await expect.poll(() => document.querySelector('[data-positioned]')).not.toBeNull();

    const presets = [...document.querySelectorAll<HTMLElement>('[data-part="preset"]')];
    expect(presets).toHaveLength(2);
    for (const preset of presets) {
      preset.scrollIntoView({ block: 'nearest' });
      expect(visibleBlockSize(preset)).toBeGreaterThanOrEqual(44);
    }
  });
});

function preset<V>(value: V) {
  return { label: 'A shortcut', value };
}

/** How much of a shortcut can be pressed: a point of it answers as the shortcut itself. */
function visibleBlockSize(preset: HTMLElement) {
  const { height, left, top, width } = preset.getBoundingClientRect();
  const rows = Array.from({ length: Math.round(height) }, (_, row) => top + row + 0.5);

  return rows.filter((y) => preset.contains(document.elementFromPoint(left + width / 2, y))).length;
}

function surface() {
  return document.querySelector<HTMLElement>('[data-part="content"]')!;
}
