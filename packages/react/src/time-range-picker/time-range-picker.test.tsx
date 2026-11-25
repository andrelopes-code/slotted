import { plainTime as t } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/time-range-picker/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { TimeRangePicker, TimeRangePickerDefaultsProvider } from './index';
import type { TimeRange, TimeRangePickerHandle, TimeRangePickerProps } from './index';

const RUN: TimeRange = { start: t(9), end: t(11, 45) };
const HOUR = 3600;

afterEach(() => vi.unstubAllGlobals());

describe('what it is made of', () => {
  it('declares every part the contract names, and opens the shared panel', () => {
    draw({ clearable: true, defaultOpen: true, defaultValue: RUN });

    for (const part of contract.members.timeRangePicker.parts) {
      expect(document.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root()).toHaveAttribute('data-ui', contract.ui);
    expect(panel()).toHaveAttribute('data-kind', 'time-range');
  });

  it('is a one-line frame: the run in words, and no field in it', () => {
    draw({ defaultValue: RUN });

    expect(root().querySelector('[data-part="summary"]')).toHaveTextContent('09:00 – 11:45');
    expect(root().querySelector('[data-ui="time-field"]')).toBeNull();
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('writes an open end with the dash and nothing beside it', () => {
    draw({ defaultValue: { start: t(9), end: null } });

    expect(root().querySelector('[data-part="summary"]')).toHaveTextContent('09:00 –');
  });

  it('draws a typed half and a clock for each end, and the day between them', () => {
    draw({ defaultOpen: true, defaultValue: RUN });

    expect(panel().querySelectorAll('[data-part="half"] [data-ui="time-field"]')).toHaveLength(2);
    expect(panel().querySelectorAll('[data-ui="clock"]')).toHaveLength(2);
    expect(screen.getAllByRole('slider').map((handle) => handle.ariaValueText)).toHaveLength(2);
    expect(metas()).toEqual(['morning', 'morning']);
  });

  it('draws the shortcuts with their run, and the lengths', () => {
    draw({
      defaultOpen: true,
      defaultValue: RUN,
      presets: [{ label: 'Work day', value: { start: t(9), end: t(18) } }],
    });

    expect(presets()).toEqual([['Work day', '09:00 – 18:00']]);
    expect(chips()).toEqual([
      '15 min',
      '30 min',
      '45 min',
      '1 hr',
      '1 hr 30 min',
      '2 hr',
      '3 hr',
      '4 hr',
    ]);
  });

  it('has no rail with neither', () => {
    draw({ defaultOpen: true, durations: [] });

    expect(panel().querySelector('[data-part="rail"]')).toBeNull();
  });
});

describe('the trigger', () => {
  it('asks for a run, then carries both ends and the length', () => {
    const { rerender } = render(<TimeRangePicker {...BASE} />);
    expect(trigger()).toHaveAccessibleName('Choose range');

    rerender(<TimeRangePicker {...BASE} value={RUN} />);
    expect(trigger().getAttribute('aria-label')).toMatch(/^Change range, .* – .*, 2 hr 45 min$/);
  });

  it('carries no length while the ends are out of order', () => {
    draw({ defaultValue: { start: t(11), end: t(9) } });

    expect(trigger().getAttribute('aria-label')).toMatch(/^Change range, [^,]* – [^,]*$/);
  });
});

describe('the length', () => {
  it('says how long the run is, and steps its end', () => {
    draw({ defaultOpen: true, defaultValue: RUN });
    expect(spanText()).toBe('2 hr 45 min');

    fireEvent.click(screen.getByRole('button', { name: 'Lengthen' }));
    expect(spanText()).toBe('3 hr');
    fireEvent.click(screen.getByRole('button', { name: 'Shorten' }));
    fireEvent.click(screen.getByRole('button', { name: 'Shorten' }));
    expect(spanText()).toBe('2 hr 30 min');
  });

  it('stops at its limits, which the footer says', () => {
    draw({ defaultOpen: true, defaultValue: RUN, maxLength: 2.75 * HOUR, minLength: HOUR });

    expect(screen.getByRole('button', { name: 'Lengthen' })).toBeDisabled();
    expect(hint()).toBe('1 hr to 2 hr 45 min');
  });

  it('is set by a duration, from the start', () => {
    const { onValueChange } = draw({ defaultOpen: true, defaultValue: RUN });

    fireEvent.click(chip('1 hr'));
    expect(chip('1 hr')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledWith({ start: t(9), end: t(10) }, expect.anything());
  });

  it('takes no duration without a start, nor past midnight', () => {
    draw({ defaultOpen: true });
    expect(chip('1 hr')).toBeDisabled();

    fireEvent.click(hours('Start')[23]!);
    expect(chip('30 min')).toBeEnabled();
    expect(chip('1 hr')).toBeDisabled();
  });

  it('is written by the application’s own words', () => {
    draw({
      defaultOpen: true,
      defaultValue: RUN,
      lengthLabel: (seconds) => `${String(seconds / 60)} minutes`,
    });

    expect(spanText()).toBe('165 minutes');
  });
});

describe('the draft', () => {
  it('takes a start, moves to the end, and Apply writes both', () => {
    const { onPositionChange, onValueChange } = draw({ defaultOpen: true });

    fireEvent.click(hours('Start')[9]!);
    expect(apply()).toBeDisabled();
    fireEvent.click(minutes('Start')[0]!);
    expect(onPositionChange).toHaveBeenCalledWith('end', expect.anything());
    expect(hours('End')).toContain(document.activeElement);

    fireEvent.click(hours('End')[11]!);
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledWith(
      { start: t(9), end: t(11) },
      expect.objectContaining({ reason: 'select' }),
    );
    expect(trigger()).toHaveFocus();
  });

  it('takes an end typed in its half', () => {
    const { onValueChange } = draw({ defaultOpen: true, defaultValue: RUN });
    const [hour] = within(half('End')).getAllByRole('spinbutton');

    fireEvent.keyDown(hour!, { key: 'ArrowUp' });
    fireEvent.click(apply());
    expect(onValueChange).toHaveBeenCalledWith({ start: t(9), end: t(12, 45) }, expect.anything());
  });

  it('takes a handle of the day, one step at a time, up to the other', () => {
    draw({ defaultOpen: true, defaultValue: { start: t(9), end: t(9, 30) } });
    const [start] = screen.getAllByRole('slider');

    fireEvent.keyDown(start!, { key: 'ArrowRight' });
    expect(spanText()).toBe('15 min');
    fireEvent.keyDown(start!, { key: 'ArrowRight' });
    expect(spanText()).toBe('15 min');
    fireEvent.keyDown(start!, { key: 'PageDown' });
    expect(spanText()).toBe('1 hr 15 min');
  });

  it('takes a shortcut, and marks the one it is', () => {
    const { onValueChange } = draw({
      defaultOpen: true,
      presets: [{ label: 'Work day', value: () => ({ start: t(9), end: t(18) }) }],
    });
    const preset = screen.getByRole('button', { name: /Work day/ });

    fireEvent.click(preset);
    expect(preset).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(panel(), { ctrlKey: true, key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith({ start: t(9), end: t(18) }, expect.anything());
  });

  it('is discarded by Escape, and emptied by Clear', () => {
    const { onValueChange } = draw({ defaultOpen: true, defaultValue: RUN });

    fireEvent.click(chip('1 hr'));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(trigger());
    expect(spanText()).toBe('2 hr 45 min');

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
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
    expect(onValueChange).toHaveBeenCalledWith({ start: t(9), end: t(12) }, expect.anything());
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.keyDown(within(half('Start')).getAllByRole('spinbutton')[0]!, { key: 'ArrowUp' });
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: t(10), end: t(12) },
      expect.objectContaining({ reason: 'keyboard' }),
    );

    fireEvent.click(minutes('End')[1]!);
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: t(10), end: t(12, 15) },
      expect.anything(),
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
  });
});

describe('the rules', () => {
  it('strike in the clock of the end what the start refuses', () => {
    draw({ defaultOpen: true, defaultValue: RUN, step: HOUR });

    expect(offered('Start')).toHaveLength(24);
    expect(offered('End')[0]).toBe(10);
  });

  it('stop the end at an unavailable time, unless the run may cross it', () => {
    const rules = {
      defaultOpen: true,
      defaultValue: { start: t(9), end: null },
      isTimeUnavailable: ({ hour }: { hour: number }) => hour === 12,
      step: HOUR,
    };
    const { unmount } = draw(rules);
    expect(offered('End')).toEqual([10, 11]);
    unmount();

    draw({ ...rules, contiguous: false });
    expect(offered('End').at(-1)).toBe(23);
  });

  it('say why a run is refused, and turn Apply off', () => {
    draw({ defaultOpen: true, defaultValue: { start: t(11), end: t(9) } });

    expect(hint()).toBe('The end must come after the start');
    expect(apply()).toBeDisabled();
    expect(root()).toHaveAttribute('data-invalid');
  });

  it('say by how much a run is over', () => {
    draw({ defaultOpen: true, defaultValue: RUN, maxLength: 2 * HOUR });

    expect(hint()).toBe('45 min over the limit');
  });

  it('turn off a shortcut they refuse', () => {
    draw({
      defaultOpen: true,
      maxLength: 2 * HOUR,
      presets: [{ label: 'Work day', value: { start: t(9), end: t(18) } }],
    });

    expect(screen.getByRole('button', { name: /Work day/ })).toBeDisabled();
  });
});

describe('the end being edited', () => {
  it('is the half and the clock the reader is in', () => {
    const { onPositionChange } = draw({ defaultOpen: true, defaultValue: RUN });
    expect(half('Start')).toHaveAttribute('data-current');

    fireEvent.pointerDown(half('End'));
    expect(onPositionChange).toHaveBeenCalledWith(
      'end',
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(half('End')).toHaveAttribute('data-current');
    expect(clock('End')).toHaveAttribute('data-current');
  });

  it('is a button and one clock at a time in one column', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      addEventListener: () => undefined,
      matches: query.includes('760px'),
      removeEventListener: () => undefined,
    }));
    draw({ defaultOpen: true, defaultValue: RUN });
    expect(panel().querySelector('[data-part="half"] [data-ui="time-field"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '11:45' }));
    expect(clock('End')).toHaveAttribute('data-current');
    expect(clock('Start')).not.toHaveAttribute('data-current');
  });

  it('may belong to the consumer', () => {
    draw({ defaultOpen: true, defaultValue: RUN, position: 'end' });

    fireEvent.pointerDown(half('Start'));
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

    fireEvent.click(chip('1 hr'));
    fireEvent.click(apply());
    await waitFor(() => expect(posted()).toEqual(['09:00:00', '10:00:00']));

    act(() => container.querySelector('form')?.reset());
    await waitFor(() => expect(posted()).toEqual(['09:00:00', '11:45:00']));
  });

  it('waits for the consumer when they own the value', async () => {
    const Owned = () => {
      const [value, setValue] = useState<TimeRange | null>(RUN);

      return <TimeRangePicker {...BASE} defaultOpen onValueChange={setValue} value={value} />;
    };
    render(<Owned />);

    fireEvent.click(chip('1 hr'));
    fireEvent.click(apply());
    await waitFor(() =>
      expect(root().querySelector('[data-part="summary"]')).toHaveTextContent('09:00 – 10:00'),
    );
  });

  it('empties both ends from the clear on the frame', () => {
    const { onValueChange } = draw({ clearable: true, defaultValue: RUN });

    fireEvent.click(screen.getByRole('button', { name: 'Clear range' }));
    expect(onValueChange).toHaveBeenCalledWith(null, expect.objectContaining({ reason: 'clear' }));
    expect(trigger()).toHaveFocus();
  });

  it('is opened, closed and focused from its ref', async () => {
    const ref = createRef<TimeRangePickerHandle>();
    draw({ defaultValue: RUN, ref });

    act(() => ref.current?.open());
    await waitFor(() => expect(hours('Start')).toContain(document.activeElement));
    act(() => ref.current?.close());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    act(() => ref.current?.focus());
    expect(trigger()).toHaveFocus();
  });

  it('takes its shape from a provider, and its words from the language in force', () => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <TimeRangePickerDefaultsProvider confirm={false} step={HOUR}>
          <TimeRangePicker defaultOpen minLength={HOUR} value={RUN} />
        </TimeRangePickerDefaultsProvider>
      </SlottedProvider>,
    );

    // language: pt-BR
    expect(hint()).toBe('pelo menos 1 h');
    expect(metas()).toEqual(['manhã', 'manhã']);
    // language: en-US
    expect(document.querySelector('[data-part="apply"]')).toBeNull();
  });

  it('lays its own messages and its own footer', () => {
    draw({
      defaultOpen: true,
      footer: 'The room closes at 6',
      messages: { start: 'From' },
    });

    expect(half('From')).toBeInTheDocument();
    expect(hint()).toBe('The room closes at 6');
  });

  it('draws the whole times of a stated list its own way', () => {
    draw({
      defaultOpen: true,
      options: [t(9), t(13)],
      renderSlot: ({ label }) => `${label} free`,
    });

    expect(
      within(within(clock('Start')).getByRole('listbox'))
        .getAllByRole('option')
        .map((slot) => slot.textContent),
    ).toEqual(['09:00 free', '13:00 free']);
  });

  it('names its panel for itself, and not for the field around it', () => {
    render(
      <Field>
        <FieldLabel>Booking</FieldLabel>
        <TimeRangePicker {...BASE} defaultOpen />
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

const BASE = { hourCycle: 24, locale: 'en', referenceTime: t(8, 20) } as const;

function draw(props: Partial<TimeRangePickerProps> = {}, Wrapper: 'div' | 'form' = 'div') {
  const onOpenChange = vi.fn();
  const onPositionChange = vi.fn();
  const onValueChange = vi.fn();
  const view = render(
    <Wrapper>
      <TimeRangePicker
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
  return document.querySelector<HTMLElement>('[data-ui="time-range-picker"][data-part="root"]')!;
}

function panel() {
  return document.querySelector<HTMLElement>('[data-ui="picker-panel"][data-part="root"]')!;
}

function trigger() {
  return root().querySelector<HTMLButtonElement>('[data-part="trigger"]')!;
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

function metas() {
  return [...panel().querySelectorAll('[data-part="half-meta"]')].map((meta) => meta.textContent);
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

function chips() {
  return [...panel().querySelectorAll('[data-part="chip"]')].map((chip) => chip.textContent);
}

function chip(label: string) {
  return screen.getByRole('button', { name: label });
}

function presets() {
  return [...panel().querySelectorAll('[data-part="preset"]')].map((preset) =>
    ['label', 'result'].map((part) =>
      preset.querySelector(`[data-part="preset-${part}"]`)?.textContent?.replaceAll(/\s/g, ' '),
    ),
  );
}
