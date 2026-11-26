import { render } from '@testing-library/react';
import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Field, FieldLabel } from '../field';
import { Select } from './select';
import { SelectDefaultsProvider } from './select-defaults';
import { SelectItem } from './select-items';
import { SelectContent, SelectTrigger, SelectValue } from './select-parts';
import type { SelectPresentation } from './select.types';

interface GroupByProps {
  onValueChange?: (value: unknown) => void;
  presentation?: SelectPresentation | undefined;
  search?: boolean;
}

function GroupBy({ onValueChange, presentation, search = false }: GroupByProps) {
  return (
    <Field>
      <FieldLabel>Group by</FieldLabel>
      <Select
        onValueChange={(value) => onValueChange?.(value)}
        {...(presentation === undefined ? {} : { presentation })}
        search={search}
      >
        <SelectTrigger>
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Day</SelectItem>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="month">Month</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

const trigger = () => document.querySelector<HTMLElement>('[data-part="trigger"]')!;
const layer = () =>
  document.querySelector<HTMLElement>('[data-ui="select"][data-part="positioner"]');

async function open() {
  await userEvent.click(trigger());
  await vi.waitFor(() => expect(layer()?.hasAttribute('data-open')).toBe(true));
  for (let index = 0; index < 5; index += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  await Promise.allSettled(document.getAnimations().map((animation) => animation.finished));
}

/**
 * A select on a phone opened a listbox narrower than a thumb's reach of the
 * screen, anchored to its trigger, beside a date field that rose as a sheet.
 */
describe('the listbox of a select on a phone', () => {
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('is a modal sheet named by the label under presentation="auto"', async () => {
    await page.viewport(390, 844);
    const onValueChange = vi.fn();
    render(<GroupBy onValueChange={onValueChange} presentation="auto" />);

    await open();
    const dialog = layer()!.querySelector<HTMLElement>('[role="dialog"]')!;
    const heading = document.getElementById(dialog.getAttribute('aria-labelledby')!)!;
    const choices = [...dialog.querySelectorAll<HTMLElement>('[role="option"]')];
    const box = dialog.getBoundingClientRect();

    expect(layer()!.dataset['presentation']).toBe('sheet');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(heading.textContent).toBe('Group by');
    expect(choices.map((option) => option.textContent)).toEqual(['Day', 'Week', 'Month']);
    expect(dialog.querySelector('[role="listbox"]')!.contains(document.activeElement)).toBe(true);
    expect(trigger().closest('[inert]')).not.toBeNull();
    expect(Math.round(box.bottom)).toBe(844);
    expect(Math.round(box.width)).toBe(390);
    for (const option of choices) {
      expect(option.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    }

    await userEvent.click(choices[1]!);
    await vi.waitFor(() => expect(layer()?.hasAttribute('data-open') ?? false).toBe(false));

    expect(onValueChange).toHaveBeenLastCalledWith('week');
    expect(trigger().textContent).toContain('Week');
    expect(document.activeElement).toBe(trigger());
  });

  it('closes on a press on the scrim, with focus on the trigger', async () => {
    await page.viewport(390, 844);
    render(<GroupBy presentation="auto" />);

    await open();
    const scrim = layer()!.querySelector<HTMLElement>(':scope > [data-part="backdrop"]')!;
    await userEvent.click(scrim, { position: { x: 195, y: 20 } });
    await vi.waitFor(() => expect(layer()?.hasAttribute('data-open') ?? false).toBe(false));

    expect(document.activeElement).toBe(trigger());
    expect(document.querySelector('[inert]')).toBeNull();
  });

  it('moves the highlight and takes it with the keys, while the list holds focus', async () => {
    await page.viewport(390, 844);
    const onValueChange = vi.fn();
    render(<GroupBy onValueChange={onValueChange} presentation="auto" />);

    await open();
    const list = layer()!.querySelector<HTMLElement>('[role="listbox"]')!;
    /* The press opened onto the first option; two steps down is the third. */
    expect(list.getAttribute('aria-activedescendant')).toBe(
      list.querySelector('[role="option"]')!.id,
    );
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await vi.waitFor(() => expect(onValueChange).toHaveBeenCalled());

    expect(onValueChange).toHaveBeenLastCalledWith('month');
    expect(document.activeElement).toBe(trigger());
  });

  it('is a sheet for every select under the provider', async () => {
    await page.viewport(390, 844);
    render(
      <SelectDefaultsProvider presentation="auto">
        <GroupBy />
      </SelectDefaultsProvider>,
    );

    await open();

    expect(layer()!.dataset['presentation']).toBe('sheet');
  });

  it.each([
    ['presentation="auto" on a wide screen', 'auto', false, 1024],
    ['presentation="auto" with a search field', 'auto', true, 390],
    ['no presentation on a phone', undefined, false, 390],
    ['no presentation on a wide screen', undefined, false, 1024],
  ] as const)('is the anchored listbox with %s', async (_, presentation, search, width) => {
    await page.viewport(width, 844);
    render(<GroupBy presentation={presentation} search={search} />);

    await open();

    expect(layer()!.dataset['presentation']).toBe('popover');
    expect(layer()!.querySelector('[data-part="backdrop"], [aria-modal]')).toBeNull();
    expect(document.querySelector('[inert]')).toBeNull();
  });
});
