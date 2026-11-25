import { plainTime, toISOTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/time-picker/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { TimePicker, TimePickerDefaultsProvider } from './index';
import type { TimePickerHandle, TimePickerProps } from './index';

const t = plainTime;
const HALF_PAST_TWO = t(14, 30);
const TEN_TWENTY = t(10, 20);

describe('what it is made of', () => {
  it('declares every part the contract names, and opens the shared panel', () => {
    draw({ defaultOpen: true });

    for (const part of contract.members.timePicker.parts) {
      expect(root().parentElement?.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root()).toHaveAttribute('data-ui', contract.ui);
    expect(panel()).toHaveAttribute('data-kind', 'time');
  });

  it('is a dialog, and the trigger says so', () => {
    draw({ defaultValue: HALF_PAST_TWO });
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');

    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-controls', screen.getByRole('dialog').id);
  });

  it('draws the whole day, the shortcuts and the steps from now', () => {
    draw({ defaultOpen: true, presets: [{ label: 'Lunch', value: t(12) }] });

    expect(options('Hours')).toHaveLength(24);
    expect(presets()).toEqual([
      ['Now', '10:20'],
      ['Lunch', '12:00'],
    ]);
    expect(chips()).toEqual(['+15 min', '+30 min', '+1 hr', '+2 hr', '+4 hr', '+8 hr']);
  });

  it('is the clock alone when there is nothing to put in the rail', () => {
    draw({ defaultOpen: true, offsets: [] });

    expect(document.querySelector('[data-part="rail"]')).toBeNull();
  });

  it('draws whole times from a stated list, with no Now and no steps', () => {
    draw({
      defaultOpen: true,
      options: [t(9), t(9, 20)],
      renderSlot: ({ label }) => `${label} free`,
    });

    expect(options('Times').map((option) => option.textContent)).toEqual([
      '09:00 free',
      '09:20 free',
    ]);
    expect(document.querySelector('[data-part="rail"]')).toBeNull();
  });

  it('says how far the time is from now', () => {
    draw({ defaultOpen: true, defaultValue: HALF_PAST_TWO });
    expect(meta()).toBe('in 4 hr 10 min');

    fireEvent.click(options('Hours')[9]!);
    expect(meta()).toBe('50 min ago');
  });
});

describe('the draft', () => {
  it('reaches the field only on Apply, which closes the panel', () => {
    const change = draw({ defaultOpen: true, defaultValue: HALF_PAST_TWO });

    fireEvent.click(options('Hours')[9]!);
    fireEvent.click(options('Minutes')[1]!);
    expect(change).not.toHaveBeenCalled();

    fireEvent.click(apply());
    expect(written(change)).toEqual(['09:15']);
    expect(showing()).toBe(false);
    expect(trigger()).toHaveFocus();
  });

  it('is dropped by Escape, and by a press outside', () => {
    const change = draw({ defaultOpen: true, defaultValue: HALF_PAST_TWO });

    fireEvent.click(options('Hours')[9]!);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(showing()).toBe(false);

    fireEvent.click(trigger());
    expect(selected()).toEqual(['14', ':30']);
    expect(change).not.toHaveBeenCalled();
  });

  it('follows what is typed in the field, and Apply keeps the typed time', () => {
    const change = draw({ defaultOpen: true, defaultValue: HALF_PAST_TWO });
    fireEvent.click(options('Hours')[9]!);

    fireEvent.keyDown(segment('hour'), { key: 'ArrowUp' });
    expect(written(change)).toEqual(['15:30']);
    expect(selected()).toEqual(['15', ':30']);

    fireEvent.click(apply());
    expect(written(change)).toEqual(['15:30']);
  });

  it('is applied by Ctrl and Enter from anywhere in the panel', () => {
    const change = draw({ defaultOpen: true });

    fireEvent.click(options('Hours')[9]!);
    fireEvent.keyDown(options('Hours')[9]!, { ctrlKey: true, key: 'Enter' });
    expect(written(change)).toEqual(['09:00']);
  });

  it('is emptied by Clear, and Apply writes the empty value', () => {
    const change = draw({ clearable: true, defaultOpen: true, defaultValue: HALF_PAST_TWO });

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Clear' }));
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(apply());
    expect(change.mock.lastCall?.[0]).toBeNull();
  });

  it('keeps Apply off while nothing is chosen, and says why a time is refused', () => {
    const { rerender } = render(<TimePicker {...base} defaultOpen />);
    expect(apply()).toBeDisabled();

    rerender(<TimePicker {...base} defaultOpen min={t(9)} value={t(8)} />);
    expect(apply()).toBeDisabled();
    expect(hint()).toBe('Not an accepted time');
  });

  it('waits for the consumer who owns the value', () => {
    draw({ defaultOpen: true, value: HALF_PAST_TWO });

    fireEvent.click(options('Hours')[9]!);
    fireEvent.click(apply());
    fireEvent.click(trigger());
    expect(selected()).toEqual(['14', ':30']);
  });
});

describe('without a confirmation', () => {
  it('writes and closes on the press that completes the time', () => {
    const change = draw({ confirm: false, defaultOpen: true });

    fireEvent.click(options('Hours')[9]!);
    expect(change).not.toHaveBeenCalled();
    expect(showing()).toBe(true);

    fireEvent.click(options('Minutes')[1]!);
    expect(written(change)).toEqual(['09:15']);
    expect(showing()).toBe(false);
  });

  it('completes on the hour where the step is whole hours', () => {
    const change = draw({ confirm: false, defaultOpen: true, step: 3600 });

    fireEvent.click(options('Hours')[9]!);
    expect(written(change)).toEqual(['09:00']);
  });

  it('draws no Apply, and writes a shortcut at once', () => {
    const change = draw({ confirm: false, defaultOpen: true });

    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Now/ }));
    expect(written(change)).toEqual(['10:20']);
  });

  it('is what the application says once for every picker', () => {
    render(
      <TimePickerDefaultsProvider confirm={false}>
        <TimePicker {...base} defaultOpen />
      </TimePickerDefaultsProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull();
  });
});

describe('the shortcuts', () => {
  it('steps from now', () => {
    const change = draw({ defaultOpen: true });

    fireEvent.click(screen.getByRole('button', { name: '+1 hr' }));
    fireEvent.click(apply());
    expect(written(change)).toEqual(['11:20']);
  });

  it('refuses a step past midnight, and one out of bounds', () => {
    draw({ defaultOpen: true, max: t(18), referenceTime: t(17, 0) });

    expect(screen.getByRole('button', { name: '+1 hr' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '+2 hr' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '+8 hr' })).toBeDisabled();
  });

  it('marks the shortcut the draft is, and resolves a function at the press', () => {
    draw({ defaultOpen: true, presets: [{ label: 'Lunch', value: () => t(12) }] });

    fireEvent.click(preset('Lunch'));
    expect(preset('Lunch')).toHaveAttribute('aria-pressed', 'true');
    expect(selected()).toEqual(['12', ':00']);
  });

  it('refuses a shortcut the rules refuse', () => {
    draw({ defaultOpen: true, min: t(13), presets: [{ label: 'Lunch', value: t(12) }] });

    expect(preset('Lunch')).toBeDisabled();
  });
});

describe('opening', () => {
  it('takes focus to the chosen hour from the trigger', async () => {
    draw({ defaultValue: HALF_PAST_TWO });

    fireEvent.click(trigger());
    await nextFrame();
    expect(options('Hours')[14]).toHaveFocus();
  });

  it('leaves focus in the field from the chord', async () => {
    draw({ defaultValue: HALF_PAST_TWO });
    segment('hour').focus();

    fireEvent.keyDown(segment('hour'), { altKey: true, key: 'ArrowDown' });
    await nextFrame();
    expect(showing()).toBe(true);
    expect(segment('hour')).toHaveFocus();
  });

  it('opens from the trigger by an arrow', () => {
    draw();

    fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
    expect(showing()).toBe(true);
  });

  it('asks before moving the open state the consumer owns', () => {
    const openChange = vi.fn();
    draw({ onOpenChange: openChange, open: false });

    fireEvent.click(trigger());
    expect(openChange.mock.lastCall?.[0]).toBe(true);
    expect(showing()).toBe(false);
  });

  it('opens and closes through the handle', () => {
    const handle = createRef<TimePickerHandle>();
    const { rerender } = render(<TimePicker {...base} ref={handle} />);

    handle.current?.open();
    rerender(<TimePicker {...base} ref={handle} />);
    expect(showing()).toBe(true);
  });

  it('keeps Tab inside the panel', () => {
    draw({ defaultOpen: true, defaultValue: HALF_PAST_TWO });
    const last = apply();
    last.focus();

    fireEvent.keyDown(last, { key: 'Tab' });
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    expect(last).not.toHaveFocus();
  });

  it('answers no press at all while it is disabled', () => {
    draw({ disabled: true });

    expect(trigger()).toBeDisabled();
  });
});

describe('the form around it', () => {
  it('posts the chosen time, and returns to the first one on a reset', () => {
    render(
      <form>
        <TimePicker {...base} defaultOpen defaultValue={HALF_PAST_TWO} name="at" />
      </form>,
    );
    const form = document.querySelector('form')!;
    fireEvent.click(options('Hours')[9]!);
    fireEvent.click(apply());
    expect(new FormData(form).get('at')).toBe('09:30:00');

    fireEvent.reset(form);
    expect(new FormData(form).get('at')).toBe('14:30:00');
  });

  it('names the control by the field around it, and not the panel', () => {
    render(
      <Field>
        <FieldLabel>Departure</FieldLabel>
        <TimePicker {...base} defaultOpen />
      </Field>,
    );

    expect(
      within(screen.getByRole('dialog')).queryByRole('group', { name: /Departure/ }),
    ).toBeNull();
    expect(within(root()).getByRole('group', { name: /Departure/ })).toBeInTheDocument();
  });

  it('is invalid on a time the bounds refuse', () => {
    draw({ defaultValue: t(8), min: t(9) });

    expect(root()).toHaveAttribute('data-invalid');
  });
});

describe('the words', () => {
  it('change with the language in force, clock and panel together', () => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <TimePicker defaultOpen referenceTime={TEN_TWENTY} />
      </SlottedProvider>,
    );

    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument();
    expect(chips()[0]).toBe('+15 min');
    expect(options('Minutos')).toHaveLength(4);
    // language: en-US
  });

  it('name the trigger with the time written', () => {
    draw({ defaultValue: HALF_PAST_TWO });
    expect(trigger()).toHaveAccessibleName('Change time, 14:30');
  });

  it('are laid over by its own messages', () => {
    draw({ messages: { choose: 'Pick a slot' } });

    expect(trigger()).toHaveAccessibleName('Pick a slot');
  });
});

it('holds the value a consumer stores', () => {
  function Owner() {
    const [time, setTime] = useState<PlainTime | null>(HALF_PAST_TWO);

    return <TimePicker {...base} defaultOpen onValueChange={setTime} value={time} />;
  }
  render(<Owner />);

  fireEvent.click(options('Hours')[9]!);
  fireEvent.click(apply());
  expect(trigger()).toHaveAccessibleName('Change time, 09:30');
});

const base = { hourCycle: 24, locale: 'en-US', referenceTime: TEN_TWENTY } as const;

type Change = NonNullable<TimePickerProps['onValueChange']>;

function draw(props: Partial<TimePickerProps> = {}) {
  const change = vi.fn<Change>();
  render(<TimePicker {...base} onValueChange={change} {...props} />);

  return change;
}

function written(change: ReturnType<typeof draw>) {
  return change.mock.calls.map(([time]) => time && toISOTime(time, 'minute'));
}

function options(name: string): HTMLElement[] {
  const list = screen.queryByRole('listbox', { name });

  return list === null ? [] : within(list).queryAllByRole('option');
}

const root = () =>
  document.querySelector('[data-ui="time-picker"][data-part="root"]') as HTMLElement;
const panel = () => document.querySelector('[data-ui="picker-panel"][data-part="root"]');
const trigger = () => document.querySelector('[data-part="trigger"]') as HTMLButtonElement;
const apply = () => screen.getByRole('button', { name: 'Apply' });
const preset = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label}`) });
const hint = () => document.querySelector('[data-part="hint"]')?.textContent;
const meta = () => document.querySelector('[data-part="time-meta"]')?.textContent;
const segment = (field: string) =>
  root().querySelector(`[data-part="segment"][data-field="${field}"]`) as HTMLElement;
const showing = () => document.querySelector('[data-part="positioner"][data-open]') !== null;
const chips = () =>
  [...document.querySelectorAll('[data-part="chip"]')].map((chip) => chip.textContent);
const presets = () =>
  [...document.querySelectorAll('[data-part="preset"]')].map((element) =>
    ['label', 'result'].map(
      (part) => element.querySelector(`[data-part="preset-${part}"]`)?.textContent,
    ),
  );
const selected = () =>
  screen.queryAllByRole('option', { selected: true }).map((option) => option.textContent);
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
