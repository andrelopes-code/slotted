import { plainDate, plainDateTime, plainTime, toISODateTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/datetime-range-picker/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { DateTimeRangePicker, DateTimeRangePickerDefaultsProvider } from './index';
import type { DateTimeRange, DateTimeRangePickerHandle, DateTimeRangePickerProps } from './index';

const DAY = 86_400;
const at = (day: number, hour: number, minute = 0) =>
  plainDateTime(plainDate(2026, 9, day), plainTime(hour, minute));

/** A Thursday. Stated rather than read from the clock, so every assertion is fixed. */
const NOW = at(10, 10, 20);
const RUN: DateTimeRange = { start: at(14, 17), end: at(17, 10, 30) };
const BASE = { hourCycle: 24, locale: 'en-US', referenceDateTime: NOW } as const;

afterEach(() => vi.unstubAllGlobals());

describe('what it is made of', () => {
  it('declares every part the contract names, and opens the shared panel', () => {
    draw({ clearable: true, defaultOpen: true, defaultValue: RUN });

    for (const part of contract.members.dateTimeRangePicker.parts) {
      expect(document.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root()).toHaveAttribute('data-ui', contract.ui);
    expect(panel()).toHaveAttribute('data-kind', 'datetime-range');
  });

  it('is a one-line frame: the run in words, and no field in it', () => {
    draw({ defaultValue: RUN });

    expect(summary()).toBe('Sep 14, 17:00 – Sep 17, 10:30');
    expect(root().querySelector('[data-ui="datetime-field"]')).toBeNull();
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('writes an open end with the dash and nothing beside it', () => {
    draw({ defaultValue: { start: at(14, 17), end: null } });

    expect(summary()).toBe('Sep 14, 17:00 –');
  });

  it('draws a typed half and a clock for each end, under two months', () => {
    draw({ defaultOpen: true, defaultValue: RUN });

    expect(panel().querySelectorAll('[data-part="half"] [data-ui="datetime-field"]')).toHaveLength(
      2,
    );
    expect(panel().querySelectorAll('[data-ui="clock"]')).toHaveLength(2);
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    expect(metas()).toEqual(['Mon, in 4 days', 'Thu, in 7 days']);
  });

  it('draws the shortcuts with their days, and the lengths', () => {
    draw({ defaultOpen: true, defaultValue: RUN, presets: [{ label: 'Next week', value: RUN }] });

    expect(texts('[data-part="preset-result"]')).toEqual(['Sep 14 – 17']);
    expect(texts('[data-part="chip"]')).toEqual([
      '1 day',
      '2 days',
      '3 days',
      '5 days',
      '7 days',
      '14 days',
    ]);
  });

  it('has no rail with neither', () => {
    draw({ defaultOpen: true, durations: [] });

    expect(panel().querySelector('[data-part="rail"]')).toBeNull();
  });
});

describe('the trigger', () => {
  it('asks for a run, then carries both ends and the length', () => {
    const { rerender } = render(<DateTimeRangePicker {...BASE} />);
    expect(trigger()).toHaveAccessibleName('Choose range');

    rerender(<DateTimeRangePicker {...BASE} value={RUN} />);
    expect(trigger().getAttribute('aria-label')).toMatch(
      /^Change range, .*September 14.* – .*September 17.*, 2 days 17 hr 30 min$/,
    );
  });
});

describe('the four halves', () => {
  it('are chosen one after the other, each press bringing the next grid', () => {
    const { onPositionChange, onValueChange } = draw({ defaultOpen: true });

    fireEvent.click(day(14));
    expect(hours('Start')).toContain(document.activeElement);

    fireEvent.click(hours('Start')[17]!);
    fireEvent.click(minutes('Start')[0]!);
    expect(onPositionChange).toHaveBeenLastCalledWith('end', expect.anything());
    expect(panel().querySelector('[data-ui="calendar"]')).toContainElement(
      document.activeElement as HTMLElement,
    );

    fireEvent.click(day(17));
    expect(hours('End')).toContain(document.activeElement);
    expect(apply()).toBeDisabled();

    fireEvent.click(hours('End')[10]!);
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledWith(
      { start: at(14, 17), end: at(17, 10) },
      expect.objectContaining({ reason: 'select' }),
    );
    expect(trigger()).toHaveFocus();
  });

  it('are written in words while one of an end is missing', () => {
    draw({ defaultOpen: true });

    fireEvent.click(day(14));
    expect(half('Start').querySelector('[data-ui="datetime-field"]')).toBeNull();
    expect(within(half('Start')).getByRole('button', { name: 'Mon, Sep 14' })).toBeInTheDocument();

    fireEvent.click(within(half('Start')).getByRole('button', { name: 'Time' }));
    fireEvent.click(hours('Start')[17]!);
    expect(half('Start').querySelector('[data-ui="datetime-field"]')).not.toBeNull();
  });

  it('keep their times under new days, in the order the days fall', () => {
    const { onValueChange } = draw({ defaultOpen: true, defaultValue: RUN });

    fireEvent.click(day(24));
    fireEvent.click(day(21));
    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledWith(
      { start: at(21, 17), end: at(24, 10, 30) },
      expect.anything(),
    );
  });

  it('are typed in the head', () => {
    const { onValueChange } = draw({ defaultOpen: true, defaultValue: RUN });
    const [month] = within(half('Start')).getAllByRole('spinbutton');

    fireEvent.keyDown(month!, { key: 'ArrowDown' });
    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledWith(
      { ...RUN, start: plainDateTime(plainDate(2026, 8, 14), plainTime(17)) },
      expect.anything(),
    );
  });
});

describe('the length', () => {
  it('says how long the run is, and steps its end by a day', () => {
    draw({ defaultOpen: true, defaultValue: RUN });
    expect(spanText()).toBe('2 days 17 hr 30 min');

    fireEvent.click(screen.getByRole('button', { name: 'Lengthen' }));
    expect(spanText()).toBe('3 days 17 hr 30 min');
  });

  it('says the days of the run the pointer would draw', () => {
    draw({ defaultOpen: true, defaultValue: RUN });

    fireEvent.click(day(21));
    fireEvent.pointerEnter(day(24));
    expect(spanText()).toBe('2 days 17 hr 30 min');
    fireEvent.pointerEnter(day(26));
    expect(spanText()).toBe('4 days 17 hr 30 min');
  });

  it('is set by a duration, from the start', () => {
    const { onValueChange } = draw({ defaultOpen: true, defaultValue: RUN });

    fireEvent.click(chip('7 days'));
    expect(chip('7 days')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledWith({ ...RUN, end: at(21, 17) }, expect.anything());
  });

  it('takes no duration without a whole start', () => {
    draw({ defaultOpen: true });

    expect(chip('1 day')).toBeDisabled();
  });

  it('stops at its limits, which the footer says', () => {
    draw({ defaultOpen: true, defaultValue: RUN, maxLength: 3 * DAY, minLength: DAY });

    expect(screen.getByRole('button', { name: 'Lengthen' })).toBeDisabled();
    expect(chip('5 days')).toBeDisabled();
    expect(hint()).toBe('1 day to 3 days');
  });
});

describe('the draft', () => {
  it('takes a shortcut, and is applied by Ctrl and Enter', () => {
    const { onValueChange } = draw({
      defaultOpen: true,
      presets: [{ label: 'Next week', value: () => RUN }],
    });
    const preset = screen.getByRole('button', { name: /Next week/ });

    fireEvent.click(preset);
    expect(preset).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(panel(), { ctrlKey: true, key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith(RUN, expect.anything());
  });

  it('is discarded by Escape, and emptied by Clear', () => {
    const { onValueChange } = draw({ clearable: true, defaultOpen: true, defaultValue: RUN });

    fireEvent.click(chip('7 days'));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(trigger());
    expect(spanText()).toBe('2 days 17 hr 30 min');

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Clear' }));
    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(null, expect.anything());
  });

  it('is written as it goes, without a confirmation', () => {
    const { onOpenChange, onValueChange } = draw({
      confirm: false,
      defaultOpen: true,
      defaultValue: RUN,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lengthen' }));
    expect(onValueChange).toHaveBeenCalledWith({ ...RUN, end: at(18, 10, 30) }, expect.anything());

    fireEvent.keyDown(within(half('End')).getAllByRole('spinbutton')[3]!, { key: 'ArrowUp' });
    expect(onValueChange).toHaveBeenLastCalledWith(
      { ...RUN, end: at(18, 11, 30) },
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.click(minutes('End')[0]!);
    expect(onValueChange).toHaveBeenLastCalledWith({ ...RUN, end: at(18, 11) }, expect.anything());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
  });
});

describe('the rules', () => {
  it('strike in the clock of the end what a start of the same day refuses', () => {
    draw({
      defaultOpen: true,
      defaultValue: { start: at(14, 17), end: at(14, 20) },
      step: 3600,
    });

    expect(offered('Start')).toHaveLength(24);
    expect(offered('End')).toEqual([18, 19, 20, 21, 22, 23]);
  });

  it('bound each clock on its own day', () => {
    draw({
      defaultOpen: true,
      defaultValue: RUN,
      max: at(17, 12),
      min: at(14, 16),
      step: 3600,
    });

    expect(offered('Start')[0]).toBe(16);
    expect(offered('End').at(-1)).toBe(12);
  });

  it('stop the days of a run at an unavailable one, unless it may cross it', () => {
    const rules = {
      defaultOpen: true,
      defaultValue: { start: at(14, 17), end: null },
      isDateUnavailable: ({ day: date }: { day: number }) => date === 16,
    };
    const { unmount } = draw(rules);
    expect(day(17)).toHaveAttribute('aria-disabled', 'true');
    unmount();

    draw({ ...rules, contiguous: false });
    expect(day(17)).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('say by how much a run is over, and mark its days', () => {
    draw({ defaultOpen: true, defaultValue: RUN, maxLength: 2 * DAY });

    expect(hint()).toBe('17 hr 30 min over the limit');
    expect(apply()).toBeDisabled();
    expect(
      [...panel().querySelectorAll('[data-part="cell"][data-over]')].map(
        (cell) => cell.textContent,
      ),
    ).toEqual(['17']);
  });

  it('say why a run is refused', () => {
    draw({ defaultOpen: true, defaultValue: { start: RUN.end, end: RUN.start } });

    expect(hint()).toBe('The end must come after the start');
    expect(root()).toHaveAttribute('data-invalid');
  });

  it('name the zone in the footer, when one is stated and no limit is', () => {
    draw({ defaultOpen: true, timeZone: 'Europe/Lisbon' });

    expect(hint()).toBe('Europe/Lisbon');
  });
});

describe('one part at a time', () => {
  it('shows the day or the time of one end, and the halves bring them', () => {
    stubNarrow();
    draw({ defaultOpen: true, defaultValue: RUN });
    expect(panel()).toHaveAttribute('data-showing', 'day');
    expect(screen.getAllByRole('grid')).toHaveLength(1);
    expect(panel().querySelector('[data-part="half"] [data-ui="datetime-field"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '10:30' }));
    expect(panel()).toHaveAttribute('data-showing', 'time');
    expect(clock('End')).toHaveAttribute('data-current');
    expect(clock('Start')).not.toHaveAttribute('data-current');

    fireEvent.click(screen.getByRole('button', { name: 'Mon, Sep 14' }));
    expect(panel()).toHaveAttribute('data-showing', 'day');
  });

  it('moves to the time once a day is pressed, and to the other day once it is chosen', () => {
    stubNarrow();
    draw({ defaultOpen: true });

    fireEvent.click(day(14));
    expect(panel()).toHaveAttribute('data-showing', 'time');
    fireEvent.click(hours('Start')[17]!);
    fireEvent.click(minutes('Start')[0]!);
    expect(panel()).toHaveAttribute('data-showing', 'day');
    expect(half('End')).toHaveAttribute('data-current');
  });
});

describe('the contract with the consumer', () => {
  it('posts two values, and returns to the first run on a reset', async () => {
    const { container } = draw(
      { defaultOpen: true, defaultValue: RUN, endName: 'to', startName: 'from' },
      'form',
    );
    const posted = () => ['from', 'to'].map((name) => hidden(name)?.value);

    fireEvent.click(chip('7 days'));
    fireEvent.click(apply());
    await waitFor(() =>
      expect(posted()).toEqual([toISODateTime(at(14, 17)), toISODateTime(at(21, 17))]),
    );

    act(() => container.querySelector('form')?.reset());
    await waitFor(() => expect(posted()[1]).toBe(toISODateTime(at(17, 10, 30))));
  });

  it('waits for the consumer when they own the value', async () => {
    const Owned = () => {
      const [value, setValue] = useState<DateTimeRange | null>(RUN);

      return <DateTimeRangePicker {...BASE} defaultOpen onValueChange={setValue} value={value} />;
    };
    render(<Owned />);

    fireEvent.click(chip('7 days'));
    fireEvent.click(apply());
    await waitFor(() => expect(summary()).toBe('Sep 14, 17:00 – Sep 21, 17:00'));
  });

  it('empties both ends from the clear on the frame', () => {
    const { onValueChange } = draw({ clearable: true, defaultValue: RUN });

    fireEvent.click(screen.getByRole('button', { name: 'Clear range' }));
    expect(onValueChange).toHaveBeenCalledWith(null, expect.objectContaining({ reason: 'clear' }));
    expect(trigger()).toHaveFocus();
  });

  it('is opened, closed and focused from its ref', async () => {
    const ref = createRef<DateTimeRangePickerHandle>();
    draw({ defaultValue: RUN, ref });

    act(() => ref.current?.open());
    await waitFor(() => expect(day(14)).toHaveFocus());
    act(() => ref.current?.close());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    act(() => ref.current?.focus());
    expect(trigger()).toHaveFocus();
  });

  it('may own the end being edited', () => {
    draw({ defaultOpen: true, defaultValue: RUN, position: 'end' });

    fireEvent.pointerDown(half('Start'));
    expect(half('End')).toHaveAttribute('data-current');
  });

  it('takes its shape from a provider, and its words from the language in force', () => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <DateTimeRangePickerDefaultsProvider confirm={false} months={1}>
          <DateTimeRangePicker defaultOpen minLength={DAY} referenceDateTime={NOW} value={RUN} />
        </DateTimeRangePickerDefaultsProvider>
      </SlottedProvider>,
    );

    // language: pt-BR
    expect(hint()).toBe('pelo menos 1 dia');
    expect(metas()[0]).toBe('seg., em 4 dias');
    // language: en-US
    expect(screen.getAllByRole('grid')).toHaveLength(1);
    expect(document.querySelector('[data-part="apply"]')).toBeNull();
  });

  it('lays its own messages and its own footer', () => {
    draw({ defaultOpen: true, footer: 'Keys at the desk', messages: { start: 'Pickup' } });

    expect(half('Pickup')).toBeInTheDocument();
    expect(hint()).toBe('Keys at the desk');
  });

  it('draws the whole times of a stated list its own way, per end and day', () => {
    draw({
      defaultOpen: true,
      defaultValue: RUN,
      options: [plainTime(9), plainTime(17)],
      renderSlot: ({ date, label, position }) => `${position} ${String(date?.day)} ${label}`,
    });

    expect(texts('[data-ui="clock"] [role="option"]')).toEqual([
      'start 14 09:00',
      'start 14 17:00',
      'end 17 09:00',
      'end 17 17:00',
    ]);
  });

  it('names its panel for itself, and not for the field around it', () => {
    render(
      <Field>
        <FieldLabel>Rental</FieldLabel>
        <DateTimeRangePicker {...BASE} defaultOpen />
      </Field>,
    );

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Choose range');
  });

  it.each(['disabled', 'readOnly'] as const)('does not open while %s', (state) => {
    draw({ defaultValue: RUN, [state]: true });

    expect(trigger()).toBeDisabled();
    expect(root()).toHaveAttribute(`data-${state.toLowerCase()}`);
  });
});

function draw(props: Partial<DateTimeRangePickerProps> = {}, Wrapper: 'div' | 'form' = 'div') {
  const onOpenChange = vi.fn();
  const onPositionChange = vi.fn();
  const onValueChange = vi.fn();
  const view = render(
    <Wrapper>
      <DateTimeRangePicker
        {...BASE}
        onOpenChange={onOpenChange}
        onPositionChange={onPositionChange}
        onValueChange={onValueChange}
        {...props}
      />
    </Wrapper>,
  );

  return { ...view, onOpenChange, onPositionChange, onValueChange };
}

function root() {
  return document.querySelector<HTMLElement>(
    '[data-ui="datetime-range-picker"][data-part="root"]',
  )!;
}

function panel() {
  return document.querySelector<HTMLElement>('[data-ui="picker-panel"][data-part="root"]')!;
}

function trigger() {
  return root().querySelector<HTMLButtonElement>('[data-part="trigger"]')!;
}

function summary() {
  return root().querySelector('[data-part="summary"]')?.textContent?.replaceAll(/\s/g, ' ');
}

function hidden(name: string) {
  return root().querySelector<HTMLInputElement>(`input[name="${name}"]`);
}

function apply() {
  return screen.getByRole('button', { name: 'Apply' });
}

function hint() {
  return panel().querySelector('[data-part="hint"]')?.textContent;
}

function spanText() {
  return panel().querySelector('[data-part="span-text"]')?.textContent;
}

function half(name: string) {
  return [...panel().querySelectorAll<HTMLElement>('[data-part="half"]')].find(
    (element) => element.querySelector('[data-part="half-label"]')?.textContent === name,
  )!;
}

function texts(selector: string) {
  return [...panel().querySelectorAll(selector)].map((element) =>
    element.textContent?.replaceAll(/\s/g, ' '),
  );
}

function metas() {
  return texts('[data-part="half-meta"]');
}

function day(date: number) {
  return [...panel().querySelectorAll<HTMLElement>('[data-part="day"]')].find(
    (element) =>
      element.textContent === String(date) &&
      element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') !== true,
  )!;
}

function clock(name: string) {
  return panel().querySelector<HTMLElement>(`[data-ui="clock"][aria-label="${name}"]`)!;
}

function grid(name: string, unit: string) {
  return within(within(clock(name)).getByRole('listbox', { name: unit })).getAllByRole('option');
}

function hours(name: string) {
  return grid(name, 'Hours');
}

function minutes(name: string) {
  return grid(name, 'Minutes');
}

/** The hours the clock of an end accepts. */
function offered(name: string) {
  return hours(name).flatMap((hour, index) =>
    hour.getAttribute('aria-disabled') === 'true' ? [] : [index],
  );
}

function chip(label: string) {
  return screen.getByRole('button', { name: label });
}

/** A viewport under the widest panel. */
function stubNarrow() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    addEventListener: () => undefined,
    matches: query.includes('760px'),
    removeEventListener: () => undefined,
  }));
}
