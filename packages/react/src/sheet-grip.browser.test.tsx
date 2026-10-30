import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { cdp, page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';

import { DatePicker } from './date-picker';
import { DateRangePicker } from './date-range-picker';
import { DateTimePicker } from './datetime-picker';
import { DateTimeRangePicker } from './datetime-range-picker';
import { TimePicker } from './time-picker';
import { TimeRangePicker } from './time-range-picker';

type OnOpenChange = (open: boolean, request: { reason: string }) => void;

const families: { name: string; Picker: ComponentType<{ onOpenChange: OnOpenChange }> }[] = [
  { name: 'date-picker', Picker: DatePicker as never },
  { name: 'date-range-picker', Picker: DateRangePicker as never },
  { name: 'time-picker', Picker: TimePicker as never },
  { name: 'time-range-picker', Picker: TimeRangePicker as never },
  { name: 'datetime-picker', Picker: DateTimePicker as never },
  { name: 'datetime-range-picker', Picker: DateTimeRangePicker as never },
];

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * On a phone these families rise as a bottom sheet, and the sheet had no grip
 * where a `Drawer` sheet, the filter bar's and an action sheet all draw one,
 * and no pull that dismissed it.
 */
describe.each(families)('a $name presented as a sheet', ({ name, Picker }) => {
  it('draws a grip at its top that a pull down dismisses it by', async () => {
    await page.viewport(390, 844);
    const onOpenChange = vi.fn<OnOpenChange>();
    render(<Picker onOpenChange={onOpenChange} />);
    await userEvent.click(document.querySelector<HTMLElement>('[data-part="trigger"]')!);
    for (let index = 0; index < 10; index += 1) await frame();
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
    const sheet = document.querySelector<HTMLElement>(
      `[data-ui="${name}"][data-part="positioner"][data-presentation="sheet"]`,
    )!;
    const content = sheet.querySelector<HTMLElement>(':scope > [data-part="content"]')!;
    const grips = content.querySelectorAll<HTMLElement>('[data-part="grip"]');
    const grip = grips[0]!.getBoundingClientRect();
    const box = content.getBoundingClientRect();

    expect(grips).toHaveLength(1);
    expect(grips[0]!.getAttribute('aria-hidden')).toBe('true');
    expect(Math.abs(grip.left + grip.width / 2 - (box.left + box.width / 2))).toBeLessThan(1);
    expect(grip.top - box.top).toBeLessThanOrEqual(1);

    const x = grip.left + grip.width / 2;
    const y = grip.top + grip.height / 2;
    await pull(x, y, sheet.offsetHeight * 0.6);

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'pointer' }),
    );
  });
});

async function pull(x: number, y: number, by: number) {
  const frameBox = window.frameElement?.getBoundingClientRect();
  const at = (dy: number) => [{ x: (frameBox?.left ?? 0) + x, y: (frameBox?.top ?? 0) + y + dy }];
  await cdp().send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(0) });
  for (let step = 1; step <= 10; step += 1) {
    await cdp().send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: at((by * step) / 10),
    });
    await frame();
  }

  await cdp().send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await frame();
}
