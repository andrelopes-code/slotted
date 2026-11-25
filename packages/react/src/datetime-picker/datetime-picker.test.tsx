import { plainDate, plainDateTime, plainTime, toISODateTime } from '@slotted/core/date';
import type { PlainDateTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/datetime-picker/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { DateTimePicker, DateTimePickerDefaultsProvider } from './index';
import type { DateTimePickerHandle, DateTimePickerProps } from './index';

const at = (day: number, hour: number, minute = 0) =>
  plainDateTime(plainDate(2026, 9, day), plainTime(hour, minute));

/** A Thursday. Stated rather than read from the clock, so every assertion is fixed. */
const NOW = at(10, 10, 20);
const VALUE = at(17, 14, 30);

afterEach(() => vi.unstubAllGlobals());

describe('what it is made of', () => {
  it('declares every part the contract names, and opens the shared panel', () => {
    draw({ defaultOpen: true });

    for (const part of contract.members.dateTimePicker.parts) {
      expect(document.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root()).toHaveAttribute('data-ui', contract.ui);
    expect(panel()).toHaveAttribute('data-kind', 'datetime');
  });

  it('is a dialog holding a month and a clock, and the trigger says so', () => {
    draw({ defaultValue: VALUE });
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');

    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-controls', screen.getByRole('dialog').id);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(hours()).toHaveLength(24);
  });

  it('writes the day in words, and how far it is', () => {
    draw({ defaultOpen: true, defaultValue: VALUE });

    expect(part('value').textContent).toBe('Thu, September 17');
    expect(part('meta').textContent).toBe('in 7 days, week 38');
    expect(part('time-meta').textContent).toBe('in 7 days 4 hr 10 min');
  });

  it('names the zone the moment is in, when one is stated', () => {
    draw({ defaultOpen: true, defaultValue: VALUE, timeZone: 'Europe/Lisbon' });

    expect(part('time-meta').textContent).toBe('Europe/Lisbon');
  });

  it('asks for a day, and says what today is', () => {
    draw({ defaultOpen: true });

    expect(part('value').textContent).toBe('Choose a day');
    expect(part('meta').textContent).toBe('Today: Thu, Sep 10');
  });

  it('draws the shortcuts with what they write, after Now', () => {
    draw({ defaultOpen: true, presets: [{ label: 'Monday early', value: at(14, 9) }] });

    expect(presets()).toEqual([
      ['Now', 'Sep 10, 10:20 AM'],
      ['Monday early', 'Sep 14, 9:00 AM'],
    ]);
  });

  it('counts from the day the application states, at the time of the moment', () => {
    draw({
      defaultOpen: true,
      presets: [{ label: 'Monday early', value: at(14, 9) }],
      today: plainDate(2026, 9, 3),
    });

    expect(part('meta').textContent).toBe('Today: Thu, Sep 3');
    expect(presets()[0]).toEqual(['Now', 'Sep 3, 10:20 AM']);
    expect(document.querySelector('[data-part="day"][data-today]')?.textContent).toBe('3');
  });

  it('has no rail with no shortcuts', () => {
    draw({ defaultOpen: true });

    expect(document.querySelector('[data-part="rail"]')).toBeNull();
  });

  it('draws whole times from a stated list, with no steps from now', () => {
    draw({
      defaultOpen: true,
      options: [plainTime(9), plainTime(9, 20)],
      defaultValue: VALUE,
      renderSlot: ({ date, label }) => `${label} on the ${String(date?.day)}th`,
    });

    expect(slots().map((slot) => slot.textContent)).toEqual([
      '09:00 AM on the 17th',
      '09:20 AM on the 17th',
    ]);
    expect(document.querySelector('[data-part="offsets"]')).toBeNull();
  });
});

describe('the draft', () => {
  it('takes a day, then a time, and Apply writes both', () => {
    const { onOpenChange, onValueChange } = draw({ defaultOpen: true });

    fireEvent.click(day(18));
    expect(apply()).toBeDisabled();
    fireEvent.click(hours()[9]!);
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledWith(
      at(18, 9),
      expect.objectContaining({ reason: 'select' }),
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'select' }),
    );
    expect(trigger()).toHaveFocus();
  });

  it('moves to the clock when a day leaves the time missing', () => {
    draw({ defaultOpen: true });

    fireEvent.click(day(18));
    expect(hours()).toContain(document.activeElement);
  });

  it('stays on the month when the time is already there', () => {
    draw({ defaultOpen: true, defaultValue: VALUE });

    fireEvent.click(day(18));
    expect(hours()).not.toContain(document.activeElement);
  });

  it('takes a time typed in the panel', () => {
    const { onValueChange } = draw({ defaultOpen: true, defaultValue: VALUE });
    const [hour] = within(part('time-value')).getAllByRole('spinbutton');

    fireEvent.keyDown(hour!, { key: 'ArrowUp' });
    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledWith(at(17, 15, 30), expect.anything());
  });

  it('moves one day, over the days the rules refuse', () => {
    draw({
      defaultOpen: true,
      defaultValue: VALUE,
      isDateUnavailable: ({ day: date }) => date === 18,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(part('value').textContent).toBe('Sat, September 19');
  });

  it('takes a step from now, over the end of the day', () => {
    const { onValueChange } = draw({ defaultOpen: true });

    fireEvent.click(screen.getByRole('button', { name: '+1 day' }));
    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledWith(at(11, 10, 20), expect.anything());
  });

  it('takes a shortcut, and marks the one it is', () => {
    const { onValueChange } = draw({
      defaultOpen: true,
      presets: [{ label: 'Monday early', value: () => at(14, 9) }],
    });
    const preset = screen.getByRole('button', { name: /Monday early/ });

    fireEvent.click(preset);
    expect(preset).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledWith(at(14, 9), expect.anything());
  });

  it('is applied by Ctrl and Enter', () => {
    const { onValueChange } = draw({ defaultOpen: true, defaultValue: VALUE });

    fireEvent.click(day(18));
    fireEvent.keyDown(panel(), { ctrlKey: true, key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith(at(18, 14, 30), expect.anything());
  });

  it('is discarded by Escape', () => {
    const { onValueChange } = draw({ defaultOpen: true, defaultValue: VALUE });

    fireEvent.click(day(18));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(trigger());
    expect(part('value').textContent).toBe('Thu, September 17');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('is emptied by Clear, and Apply writes the empty value', () => {
    const { onValueChange } = draw({ clearable: true, defaultOpen: true, defaultValue: VALUE });

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Clear' }));
    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledWith(null, expect.anything());
  });

  it('follows what is typed in the field', async () => {
    draw({ defaultOpen: true, defaultValue: VALUE });
    const [month] = within(root()).getAllByRole('spinbutton');

    fireEvent.keyDown(month!, { key: 'ArrowUp' });
    await waitFor(() => expect(part('value').textContent).toBe('Sat, October 17'));
  });
});

describe('without a confirmation', () => {
  it('writes the press that completes the moment, and closes', () => {
    const { onOpenChange, onValueChange } = draw({ confirm: false, defaultOpen: true });

    fireEvent.click(day(18));
    fireEvent.click(hours()[9]!);
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.click(minutes()[1]!);
    expect(onValueChange).toHaveBeenCalledWith(at(18, 9, 15), expect.anything());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
  });

  it('writes a day of a whole moment, and stays', () => {
    const { onOpenChange, onValueChange } = draw({
      confirm: false,
      defaultOpen: true,
      defaultValue: VALUE,
    });

    fireEvent.click(day(18));
    expect(onValueChange).toHaveBeenCalledWith(at(18, 14, 30), expect.anything());
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('writes a time typed in the panel', () => {
    const { onValueChange } = draw({ confirm: false, defaultOpen: true, defaultValue: VALUE });
    const [hour] = within(part('time-value')).getAllByRole('spinbutton');

    fireEvent.keyDown(hour!, { key: 'ArrowUp' });
    expect(onValueChange).toHaveBeenCalledWith(at(17, 15, 30), expect.anything());
  });

  it('writes a shortcut', () => {
    const { onValueChange } = draw({
      confirm: false,
      defaultOpen: true,
      presets: [{ label: 'Monday early', value: at(14, 9) }],
    });

    fireEvent.click(screen.getByRole('button', { name: /Now/ }));
    expect(onValueChange).toHaveBeenCalledWith(NOW, expect.anything());
    expect(document.querySelector('[data-part="apply"]')).toBeNull();
  });
});

describe('the rules', () => {
  it('bound the whole moment and every day at once', () => {
    draw({
      defaultOpen: true,
      defaultValue: at(10, 15),
      maxTime: plainTime(18),
      min: at(10, 14),
      minTime: plainTime(8),
    });
    expect(offered()).toEqual([14, 15, 16, 17, 18]);

    fireEvent.click(day(11));
    expect(offered()).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
    expect(day(9)).toHaveAttribute('aria-disabled', 'true');
  });

  it('refuse every time of a refused day', () => {
    draw({
      defaultOpen: true,
      defaultValue: VALUE,
      isDateUnavailable: ({ day: date }) => date === 17,
    });

    expect(offered()).toEqual([]);
    expect(root()).toHaveAttribute('data-invalid');
    expect(part('hint').textContent).toBe('Not an accepted date and time');
    expect(apply()).toBeDisabled();
  });

  it('ask about a time of a day', () => {
    draw({
      defaultOpen: true,
      defaultValue: VALUE,
      isTimeUnavailable: ({ hour }, { day: date }) => date === 17 && hour > 8,
      step: 3600,
    });

    expect(offered()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('turn off the shortcuts and the steps they refuse', () => {
    draw({
      defaultOpen: true,
      max: at(10, 12),
      presets: [{ label: 'Monday early', value: at(14, 9) }],
    });

    expect(screen.getByRole('button', { name: /Monday early/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: '+1 hr' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '+4 hr' })).toBeDisabled();
  });
});

describe('one part at a time', () => {
  it('shows the day, and the time after a day is pressed', () => {
    stubNarrow();
    draw({ defaultOpen: true });
    expect(panel()).toHaveAttribute('data-showing', 'day');

    fireEvent.click(day(18));
    expect(panel()).toHaveAttribute('data-showing', 'time');
  });

  it('is brought back by its own head', () => {
    stubNarrow();
    draw({ defaultOpen: true, defaultValue: VALUE });

    fireEvent.click(screen.getByRole('button', { name: 'Time' }));
    expect(panel()).toHaveAttribute('data-showing', 'time');

    const head = screen.getByRole('button', { name: 'Thu, September 17' });
    expect(head).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(head);
    expect(panel()).toHaveAttribute('data-showing', 'day');
  });

  it('has no such heads where both are on screen', () => {
    draw({ defaultOpen: true, defaultValue: VALUE });

    expect(part('value').tagName).toBe('SPAN');
    expect(part('time-label').tagName).toBe('SPAN');
  });
});

describe('the contract with the consumer', () => {
  it('posts the moment, and returns to the first one on a reset', async () => {
    const { container } = draw({ defaultOpen: true, defaultValue: VALUE, name: 'when' }, 'form');

    fireEvent.click(day(18));
    fireEvent.click(apply());
    await waitFor(() => expect(hidden()).toHaveValue(toISODateTime(at(18, 14, 30))));

    act(() => container.querySelector('form')?.reset());
    await waitFor(() => expect(hidden()).toHaveValue(toISODateTime(VALUE)));
  });

  it('waits for the consumer when they own the value', async () => {
    const Owned = () => {
      const [value, setValue] = useState<PlainDateTime | null>(VALUE);

      return (
        <DateTimePicker
          defaultOpen
          locale="en-US"
          name="when"
          onValueChange={setValue}
          value={value}
        />
      );
    };
    render(<Owned />);

    fireEvent.click(day(18));
    fireEvent.click(apply());
    await waitFor(() => expect(hidden()).toHaveValue(toISODateTime(at(18, 14, 30))));
  });

  it('asks before it opens', () => {
    const { onOpenChange } = draw({ open: false });

    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'pointer' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is opened, closed and focused from its ref', async () => {
    const ref = createRef<DateTimePickerHandle>();
    draw({ defaultValue: VALUE, ref });

    act(() => ref.current?.open());
    await waitFor(() => expect(day(17)).toHaveFocus());
    act(() => ref.current?.close());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    act(() => ref.current?.focus());
    expect(within(root()).getAllByRole('spinbutton')).toContain(document.activeElement);
  });

  it('opens from a segment with the chord, and leaves focus in the field', () => {
    draw({ defaultValue: VALUE });
    const [month] = within(root()).getAllByRole('spinbutton');
    month!.focus();

    fireEvent.keyDown(month!, { altKey: true, key: 'ArrowDown' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(month).toHaveFocus();
  });

  it('takes its shape from a provider, and its words from the language in force', () => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <DateTimePickerDefaultsProvider confirm={false} step={3600}>
          <DateTimePicker defaultOpen referenceDateTime={NOW} value={VALUE} />
        </DateTimePickerDefaultsProvider>
      </SlottedProvider>,
    );

    // language: pt-BR
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toMatch(
      /^Alterar data e hora, .*setembro/,
    );
    expect(part('value').textContent).toBe('qui., 17 de setembro');
    // language: en-US
    expect(minutes()).toHaveLength(0);
    expect(document.querySelector('[data-part="apply"]')).toBeNull();
  });

  it('lays its own messages and its own footer', () => {
    draw({ defaultOpen: true, footer: 'Doors close at 6', messages: { choose: 'Pick a slot' } });

    expect(screen.getByRole('dialog', { name: 'Pick a slot' })).toBeInTheDocument();
    expect(part('hint').textContent).toBe('Doors close at 6');
  });

  it('is named by its field, and the panel is not', () => {
    render(
      <Field>
        <FieldLabel>Departure</FieldLabel>
        <DateTimePicker defaultOpen locale="en-US" referenceDateTime={NOW} />
      </Field>,
    );

    expect(within(root()).getByRole('group', { name: /Departure/ })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Choose date and time');
  });
});

describe('states', () => {
  it.each(['disabled', 'readOnly'] as const)('does not open while %s', (state) => {
    draw({ defaultValue: VALUE, [state]: true });

    expect(trigger()).toBeDisabled();
    expect(root()).toHaveAttribute(`data-${state.toLowerCase()}`);
  });

  it('is invalid when a bound refuses the value, whatever the field says', () => {
    draw({ defaultValue: VALUE, min: at(18, 9) });

    expect(root()).toHaveAttribute('data-invalid');
  });
});

function draw(props: Partial<DateTimePickerProps> = {}, Wrapper: 'div' | 'form' = 'div') {
  const onOpenChange = vi.fn();
  const onValueChange = vi.fn();
  const view = render(
    <Wrapper>
      <DateTimePicker
        locale="en-US"
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
        referenceDateTime={NOW}
        {...props}
      />
    </Wrapper>,
  );

  return { ...view, onOpenChange, onValueChange };
}

function root() {
  return document.querySelector<HTMLElement>('[data-ui="datetime-picker"][data-part="root"]')!;
}

function panel() {
  return document.querySelector<HTMLElement>('[data-ui="picker-panel"][data-part="root"]')!;
}

function part(name: string) {
  return panel().querySelector<HTMLElement>(`[data-part="${name}"]`)!;
}

function trigger() {
  return root().querySelector<HTMLButtonElement>('[data-part="trigger"]')!;
}

function hidden() {
  return document.querySelector<HTMLInputElement>('[data-part="hidden-input"]');
}

function apply() {
  return screen.getByRole('button', { name: 'Apply' });
}

function day(date: number) {
  return [...panel().querySelectorAll<HTMLElement>('[data-part="day"]')].find(
    (element) =>
      element.textContent === String(date) &&
      element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') !== true,
  )!;
}

function grid(name: string) {
  const list = screen.queryByRole('listbox', { name });

  return list === null ? [] : within(list).getAllByRole('option');
}

function hours() {
  return grid('Hours');
}

function minutes() {
  return grid('Minutes');
}

function slots() {
  return grid('Times');
}

/** The hours the clock accepts. */
function offered() {
  return hours()
    .filter((hour) => hour.getAttribute('aria-disabled') !== 'true')
    .map((hour) => hours().indexOf(hour));
}

function presets() {
  return [...panel().querySelectorAll('[data-part="preset"]')].map((preset) => [
    preset.querySelector('[data-part="preset-label"]')?.textContent,
    preset.querySelector('[data-part="preset-result"]')?.textContent,
  ]);
}

/** A viewport under the widest panel. */
function stubNarrow() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    addEventListener: () => undefined,
    matches: query.includes('760px'),
    removeEventListener: () => undefined,
  }));
}
