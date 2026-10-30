import { plainTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/time-range-picker/contract.json';
import { SlottedProvider } from '../i18n';
import { TimeRangePicker, TimeRangePickerDefaultsProvider, TimeRangePickerPreset } from './index';
import type { TimeRange, TimeRangePickerHandle } from './index';

const t = (hour: number, minute = 0) => plainTime(hour, minute);

/** Every scene writes 24-hour English times, so a row can be found by its text. */
const TRP = (props: ComponentProps<typeof TimeRangePicker>) => (
  <TimeRangePicker hourCycle={24} locale="en" {...props} />
);
const RUN: TimeRange = { start: t(14), end: t(16, 30) };
const NOON = t(12);

const root = () =>
  document.querySelector('[data-ui="time-range-picker"][data-part="root"]') as HTMLElement;
const part = (name: string) => document.querySelector(`[data-part="${name}"]`) as HTMLElement;
const trigger = () => part('trigger') as HTMLButtonElement;
const surface = () => document.querySelector('[data-part="content"]');
/** The one panel, which is the current end's; asking for the other end swaps the tab. */
const panel = (position: 'start' | 'end') => {
  const tab = document.querySelector(
    `[data-part="tab"][data-position="${position}"]`,
  ) as HTMLElement;
  if (!tab.hasAttribute('data-current')) fireEvent.click(tab);
  return document.querySelector(`[data-part="panel"][data-position="${position}"]`) as HTMLElement;
};
const list = (position: 'start' | 'end') =>
  panel(position).querySelector('[data-part="list"]') as HTMLElement;
const optionFor = (position: 'start' | 'end', text: string) =>
  [...list(position).querySelectorAll<HTMLElement>('[data-part="option"]')].find((row) =>
    row.textContent?.startsWith(text),
  ) as HTMLElement;
const tab = (position: 'start' | 'end') =>
  document.querySelector(`[data-part="tab"][data-position="${position}"]`) as HTMLElement;
const segments = (position: 'start' | 'end') => {
  panel(position);
  return [...part('field').querySelectorAll<HTMLElement>('[role="spinbutton"]')];
};

describe('what it is made of', () => {
  it('renders a one-line frame, and two tabs, one field and one list behind it', () => {
    render(<TRP defaultOpen defaultValue={RUN} locale="pt-BR" />);

    expect(root()).toHaveAttribute('data-ui', contract.ui);
    expect(part('control').querySelectorAll('[data-ui="time-field"]')).toHaveLength(0);
    expect(surface()?.querySelectorAll('[data-ui="time-field"]')).toHaveLength(1);
    expect(surface()?.querySelectorAll('[role="listbox"]')).toHaveLength(1);
    expect(surface()?.querySelectorAll('[role="tab"]')).toHaveLength(2);
    expect(part('summary')).toHaveTextContent('14:00 – 16:30');
    expect(tab('start')).toHaveTextContent('14:00');
    expect(tab('end')).toHaveTextContent('16:30');
  });

  it('declares every part the contract names', () => {
    /* The grip is drawn in the sheet presentation only. */
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    render(
      <TRP
        clearable
        defaultOpen
        defaultPosition="end"
        defaultValue={{ start: t(17), end: t(17) }}
        footer={<button type="button">Aplicar</button>}
        max={t(17)}
        maxLength={4 * 3600}
        minLength={900}
        presets={<TimeRangePickerPreset value={RUN}>Afternoon</TimeRangePickerPreset>}
        unavailableOptions="hide"
      />,
    );

    /* One end at a time: the empty end and the list of the other are two tabs. */
    const collect = () =>
      [
        ...document.querySelectorAll(
          '[data-ui="time-range-picker"][data-part], [data-ui="time-range-picker"] [data-part]',
        ),
      ].map((element) => (element as HTMLElement).dataset['part']);
    const present = new Set(collect());
    fireEvent.click(tab('start'));
    for (const name of collect()) present.add(name);
    for (const name of contract.members.timeRangePicker.parts) {
      if (name === 'root') continue;
      expect(present, `${name} is not rendered`).toContain(name);
    }

    vi.unstubAllGlobals();
  });

  it('carries the dialog role, and names the list by the current tab', () => {
    render(<TRP defaultOpen locale="pt-BR" messages={{ start: 'Start', end: 'End' }} />);

    expect(surface()).toHaveAttribute('role', 'dialog');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger().getAttribute('aria-controls')).toBe(surface()?.id);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Start/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('listbox', { name: /^Start/ })).toBe(list('start'));
    expect(screen.getByRole('group', { name: /^Start/ })).toBeInTheDocument();
    const end = list('end');
    expect(screen.getByRole('listbox', { name: /^End/ })).toBe(end);
  });

  it('says what to choose, and what is wrong', () => {
    const empty = render(<TRP defaultOpen messages={{ start: 'Start', end: 'End' }} />);
    expect(part('hint')).toHaveTextContent('Start: choose a time');
    expect(list('start')).toHaveAttribute('aria-describedby', part('hint').id);
    empty.unmount();

    const reversed = render(<TRP defaultOpen defaultValue={{ start: t(22), end: t(6) }} />);
    expect(part('hint')).toHaveTextContent('The end must come after the start');
    expect(part('hint')).toHaveAttribute('data-invalid');
    reversed.unmount();

    render(<TRP defaultOpen defaultValue={RUN} />);
    expect(part('hint')).toBeEmptyDOMElement();
  });

  it('opens on the first end that is missing', () => {
    const onPositionChange = vi.fn();
    render(
      <TRP
        defaultOpen
        defaultValue={{ start: t(14), end: null }}
        onPositionChange={onPositionChange}
      />,
    );
    expect(tab('end')).toHaveAttribute('data-current');
    expect(onPositionChange).toHaveBeenLastCalledWith(
      'end',
      expect.objectContaining({ reason: 'programmatic' }),
    );
  });

  it('submits two named values from the frame, whether the panel is open or not', () => {
    render(<TRP defaultValue={RUN} endName="end" startName="start" />);
    expect(document.querySelector('input[name="start"]')).toHaveValue('14:00:00');
    expect(document.querySelector('input[name="end"]')).toHaveValue('16:30:00');
    expect(surface()).toBeNull();
  });

  /** Both marks are `Glyph` elements inside an `Icon` box, never masks. */
  it('draws the clock and the cross as glyph elements', () => {
    render(<TRP clearable defaultValue={RUN} />);
    const glyph = (name: string) => part(name).querySelector("[data-ui='icon'] > svg[data-glyph]");
    expect(glyph('trigger')).toHaveAttribute('data-glyph', contract.triggerIcon);
    expect(glyph('clear')).toHaveAttribute('data-glyph', 'x');
  });
});

describe('what the frame says', () => {
  it('shows the placeholder and names itself for choosing while nothing is chosen', () => {
    render(<TRP messages={{ choose: 'Choose a time' }} />);
    expect(trigger()).toHaveAttribute('aria-label', 'Choose a time');
    expect(part('summary')).toHaveAttribute('data-placeholder');
    expect(part('summary')).toHaveTextContent('Choose a time');
  });

  it('carries both ends and the duration once the run is whole', () => {
    render(
      <TRP
        defaultValue={RUN}
        locale="pt-BR"
        messages={{ change: 'Change time, {start} – {end}, {length}' }}
      />,
    );
    const name = trigger().getAttribute('aria-label') ?? '';
    expect(name).toMatch(/^Change time, /);
    expect(name).toContain('14');
    expect(name).toContain('16');
    expect(name).toMatch(/2 h 30 min|2 hr 30 min/);
  });

  it('writes an open end with the dash and nothing beside it', () => {
    render(<TRP defaultValue={{ start: t(14), end: null }} locale="pt-BR" />);
    expect(part('summary')).toHaveTextContent(/^14:00 –$/);
    expect(part('summary')).not.toHaveAttribute('data-placeholder');
  });
});

describe('the duration, said while the run is drawn', () => {
  it('says the duration of a whole value', () => {
    render(<TRP defaultOpen defaultValue={RUN} locale="en" />);
    expect(part('length')).toHaveTextContent('2 hr 30 min');
    expect(part('length')).toHaveAttribute('aria-live', 'polite');
    expect(part('length')).not.toHaveAttribute('data-pending');
  });

  it('says the duration the row under the pointer would give, and marks it pending', () => {
    render(<TRP defaultOpen defaultValue={{ start: t(14), end: null }} locale="en" />);
    fireEvent.pointerEnter(optionFor('end', '15:00'));
    expect(part('length')).toHaveTextContent('1 hr');
    expect(part('length')).toHaveAttribute('data-pending');
    fireEvent.pointerLeave(list('end'));
    expect(part('length')).toBeEmptyDOMElement();
  });

  it('writes the duration beside every row the other end allows', () => {
    render(<TRP defaultOpen defaultValue={RUN} locale="en" />);
    expect(
      optionFor('end', '15:00').querySelector('[data-part="option-duration"]'),
    ).toHaveTextContent('1 hr');
    expect(
      optionFor('start', '13:00').querySelector('[data-part="option-duration"]'),
    ).toHaveTextContent('3 hr 30 min');
    /* Before the start is refused, and carries no duration. */
    const refused = optionFor('end', '13:00');
    expect(refused).toHaveAttribute('aria-disabled', 'true');
    expect(refused.querySelector('[data-part="option-duration"]')).toBeNull();
  });

  it('names a limit while one is set', () => {
    render(<TRP defaultOpen locale="en" maxLength={4 * 3600} minLength={1800} />);
    expect(part('limit')).toHaveTextContent('30 min to 4 hr');
  });
});

describe('what each list refuses', () => {
  it('refuses, in the end list, the times a duration limit rules out', () => {
    render(
      <TRP
        defaultOpen
        defaultValue={{ start: t(14), end: null }}
        maxLength={2 * 3600}
        minLength={1800}
      />,
    );
    expect(optionFor('end', '14:15')).toHaveAttribute('aria-disabled', 'true');
    expect(optionFor('end', '14:30')).not.toHaveAttribute('aria-disabled');
    expect(optionFor('end', '16:00')).not.toHaveAttribute('aria-disabled');
    expect(optionFor('end', '16:15')).toHaveAttribute('aria-disabled', 'true');
  });

  it('refuses the times beyond the first unavailable one while the run must be contiguous', () => {
    const unavailable = (time: PlainTime) => time.hour === 15 && time.minute === 0;
    const { rerender } = render(
      <TRP
        defaultOpen
        defaultValue={{ start: t(14), end: null }}
        isTimeUnavailable={unavailable}
      />,
    );
    expect(optionFor('end', '14:45')).not.toHaveAttribute('aria-disabled');
    expect(optionFor('end', '15:00')).toHaveAttribute('aria-disabled', 'true');
    expect(optionFor('end', '16:00')).toHaveAttribute('aria-disabled', 'true');

    rerender(
      <TRP
        contiguous={false}
        defaultOpen
        defaultValue={{ start: t(14), end: null }}
        isTimeUnavailable={unavailable}
      />,
    );
    expect(optionFor('end', '15:00')).toHaveAttribute('aria-disabled', 'true');
    expect(optionFor('end', '16:00')).not.toHaveAttribute('aria-disabled');
  });

  it('refuses, in the start list, the times after a chosen end', () => {
    render(<TRP defaultOpen defaultValue={{ start: null, end: t(16) }} />);
    expect(optionFor('start', '16:15')).toHaveAttribute('aria-disabled', 'true');
    expect(optionFor('start', '15:45')).not.toHaveAttribute('aria-disabled');
  });

  it('hides refused rows when asked to', () => {
    render(
      <TRP defaultOpen defaultValue={{ start: t(14), end: null }} unavailableOptions="hide" />,
    );
    expect(optionFor('end', '13:00')).toBeUndefined();
    expect(optionFor('end', '14:00')).toBeDefined();
  });

  it('draws the empty state when an end has no time at all', () => {
    render(
      <TRP
        defaultOpen
        defaultValue={{ start: t(17), end: null }}
        messages={{ empty: 'Nada depois' }}
        max={t(17)}
        minLength={900}
        unavailableOptions="hide"
      />,
    );
    expect(panel('end').querySelector('[data-part="empty"]')).toHaveTextContent('Nada depois');
  });
});

describe('choosing a run', () => {
  it('holds the first press as work and moves to the other end', () => {
    const onValueChange = vi.fn();
    const onPositionChange = vi.fn();
    render(<TRP defaultOpen onPositionChange={onPositionChange} onValueChange={onValueChange} />);

    fireEvent.click(optionFor('start', '14:00'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onPositionChange).toHaveBeenLastCalledWith(
      'end',
      expect.objectContaining({ reason: 'select' }),
    );
    expect(tab('end')).toHaveAttribute('data-current');
    expect(tab('start')).toHaveTextContent('14:00');
    expect(part('panel')).toHaveAttribute('data-position', 'end');
    expect(optionFor('start', '14:00')).toHaveAttribute('data-selected');

    fireEvent.click(optionFor('end', '16:30'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: t(14), end: t(16, 30) },
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('closes when the press completes the work, and stays open when it changes a whole one', () => {
    const onOpenChange = vi.fn();
    render(
      <TRP defaultOpen defaultValue={{ start: t(14), end: null }} onOpenChange={onOpenChange} />,
    );
    fireEvent.click(optionFor('end', '16:00'));
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'select' }),
    );
    expect(document.activeElement).toBe(trigger());
  });

  it('keeps the panel open when a whole work is changed', () => {
    const onOpenChange = vi.fn();
    const onValueChange = vi.fn();
    render(
      <TRP
        defaultOpen
        defaultValue={RUN}
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(optionFor('end', '17:00'));
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: t(14), end: t(17) },
      expect.objectContaining({ reason: 'select' }),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes on any change when asked to, and never when asked not to', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <TRP closeOnSelect="always" defaultOpen defaultValue={RUN} onOpenChange={onOpenChange} />,
    );
    fireEvent.click(optionFor('end', '17:00'));
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    onOpenChange.mockClear();
    rerender(
      <TRP
        closeOnSelect="never"
        defaultOpen
        defaultValue={{ start: t(14), end: null }}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(optionFor('end', '17:00'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('refuses a press on a refused row', () => {
    const onValueChange = vi.fn();
    render(
      <TRP defaultOpen defaultValue={{ start: t(14), end: null }} onValueChange={onValueChange} />,
    );
    fireEvent.click(optionFor('end', '13:00'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('abandons the work on Escape and keeps the previous value', () => {
    const onValueChange = vi.fn();
    render(<TRP defaultOpen defaultValue={RUN} onValueChange={onValueChange} />);
    fireEvent.click(optionFor('start', '13:00'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    onValueChange.mockClear();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(root()).not.toHaveAttribute('data-open');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(part('summary')).toHaveTextContent('13:00 – 16:30');
  });

  it('writes now into the current end', () => {
    const onValueChange = vi.fn();
    render(
      <TRP
        defaultOpen
        defaultValue={{ start: t(9), end: null }}
        onValueChange={onValueChange}
        referenceTime={NOON}
      />,
    );
    panel('end');
    fireEvent.click(part('now'));
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: t(9), end: NOON },
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('writes a preset whole, marks it selected, and closes', () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <TRP
        defaultOpen
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
        presets={
          <>
            <TimeRangePickerPreset value={RUN}>Afternoon</TimeRangePickerPreset>
            <TimeRangePickerPreset value={() => ({ start: t(9), end: t(12) })}>
              Morning
            </TimeRangePickerPreset>
          </>
        }
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Afternoon' }));
    expect(onValueChange).toHaveBeenLastCalledWith(
      RUN,
      expect.objectContaining({ reason: 'select' }),
    );
    expect(screen.getByRole('button', { name: 'Afternoon' })).toHaveAttribute('data-selected');
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
  });

  it('closes from done, emitting a whole work first', () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <TRP
        closeOnSelect="never"
        defaultOpen
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(optionFor('start', '14:00'));
    fireEvent.click(optionFor('end', '16:00'));
    onValueChange.mockClear();
    fireEvent.click(part('done'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(document.activeElement).toBe(trigger());
  });

  it('empties both ends from the clear on the frame', () => {
    const onValueChange = vi.fn();
    render(<TRP clearable defaultValue={RUN} onValueChange={onValueChange} />);
    fireEvent.click(part('clear'));
    expect(onValueChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: 'clear' }),
    );
    expect(part('summary')).toHaveAttribute('data-placeholder');
  });
});

describe('typing in the band', () => {
  it('writes an end typed in a field as a value on its own', () => {
    const onValueChange = vi.fn();
    render(<TRP defaultOpen hourCycle={24} onValueChange={onValueChange} />);
    const [hour, minute] = segments('start');
    fireEvent.keyDown(hour as HTMLElement, { key: '1' });
    fireEvent.keyDown(hour as HTMLElement, { key: '4' });
    fireEvent.keyDown(minute as HTMLElement, { key: '3' });
    fireEvent.keyDown(minute as HTMLElement, { key: '0' });
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: t(14, 30), end: null },
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('names the end field invalid when it comes before the start, and swaps nothing', () => {
    render(<TRP defaultOpen defaultValue={{ start: t(22), end: t(6) }} />);
    expect(root()).toHaveAttribute('data-invalid');
    panel('end');
    expect(part('field').querySelector('[data-ui="time-field"]')).toHaveAttribute('data-invalid');
    panel('start');
    expect(part('field').querySelector('[data-ui="time-field"]')).not.toHaveAttribute(
      'data-invalid',
    );
    expect(part('summary')).toHaveTextContent('22:00 – 06:00');
  });

  it('moves the current end from the tabs, by a press and by the arrows', () => {
    const onPositionChange = vi.fn();
    render(<TRP defaultOpen onPositionChange={onPositionChange} />);
    fireEvent.click(tab('end'));
    expect(onPositionChange).toHaveBeenLastCalledWith(
      'end',
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(tab('end')).toHaveAttribute('aria-selected', 'true');
    expect(part('field')).toHaveAttribute('data-position', 'end');
    fireEvent.keyDown(tab('end'), { key: 'ArrowLeft' });
    expect(onPositionChange).toHaveBeenLastCalledWith(
      'start',
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(part('panel')).toHaveAttribute('data-position', 'start');
  });
});

describe('keys', () => {
  it("opens on Enter onto the current end's field, and on ArrowDown onto its list", async () => {
    vi.useFakeTimers();
    try {
      render(<TRP defaultValue={RUN} />);
      fireEvent.keyDown(trigger(), { key: 'Enter' });
      expect(surface()).not.toBeNull();
      await act(async () => {
        vi.runAllTimers();
      });
      expect(document.activeElement).toBe(segments('start')[0]);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(root()).not.toHaveAttribute('data-open');

      fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
      await act(async () => {
        vi.runAllTimers();
      });
      expect(document.activeElement).toBe(optionFor('start', '14:00'));
      expect(optionFor('start', '14:00')).toHaveAttribute('data-current');
    } finally {
      vi.useRealTimers();
    }
  });

  it('walks a list with the listbox keys and selects with Enter', () => {
    const onValueChange = vi.fn();
    const onHighlightedChange = vi.fn();
    render(
      <TRP
        defaultOpen
        defaultValue={{ start: t(14), end: null }}
        onHighlightedChange={onHighlightedChange}
        onValueChange={onValueChange}
      />,
    );
    const end = list('end');
    fireEvent.keyDown(end, { key: 'ArrowDown' });
    expect(onHighlightedChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ end: expect.anything() }),
      expect.objectContaining({ reason: 'keyboard' }),
    );
    fireEvent.keyDown(end, { key: 'PageDown' });
    fireEvent.keyDown(end, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    const [value] = onValueChange.mock.calls[0] as [TimeRange];
    expect(value.start).toEqual(t(14));
    expect(value.end).not.toBeNull();
  });

  it('exposes focus, open and close on the handle', () => {
    const handle = { current: null as TimeRangePickerHandle | null };
    const onOpenChange = vi.fn();
    render(<TRP onOpenChange={onOpenChange} ref={handle} />);
    act(() => handle.current?.open());
    expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());
    act(() => handle.current?.close());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
    act(() => handle.current?.focus());
    expect(document.activeElement).toBe(trigger());
  });
});

describe('ownership', () => {
  it('leaves a controlled value where the consumer put it', () => {
    const onValueChange = vi.fn();
    render(<TRP defaultOpen onValueChange={onValueChange} value={RUN} />);
    fireEvent.click(optionFor('end', '17:00'));
    expect(onValueChange).toHaveBeenCalled();
    expect(part('summary')).toHaveTextContent('14:00 – 16:30');
  });

  it('reads the defaults an application set once', () => {
    render(
      <TimeRangePickerDefaultsProvider step={1800}>
        <TRP defaultOpen />
      </TimeRangePickerDefaultsProvider>,
    );
    expect(optionFor('start', '00:15')).toBeUndefined();
    expect(optionFor('start', '00:30')).toBeDefined();
  });

  it('changes its words and its time format together with the language in force', () => {
    const inLocale = (locale: string) => (
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
        <TimeRangePicker defaultValue={RUN} />
      </SlottedProvider>
    );
    const { rerender } = render(inLocale('pt-BR'));

    // language: pt-BR
    expect(trigger().getAttribute('aria-label')).toMatch(/^Alterar período, /);
    // language: en-US
    expect(part('summary')).toHaveTextContent('14:00 – 16:30');

    rerender(inLocale('en-US'));
    expect(trigger().getAttribute('aria-label')).toMatch(/^Change range, /);
    expect(part('summary')).toHaveTextContent(/0?2:00\sPM – 0?4:30\sPM/);
  });

  it('names the limit in the language in force', () => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <TimeRangePicker defaultOpen maxLength={4 * 3600} minLength={1800} />
      </SlottedProvider>,
    );
    expect(part('limit')).toHaveTextContent(/^de 30 min a 4 h/);
  });

  it('mutes, locks and marks the frame', () => {
    const { rerender } = render(<TRP disabled />);
    expect(root()).toHaveAttribute('data-disabled');
    expect(trigger()).toBeDisabled();
    rerender(<TRP readOnly required />);
    expect(root()).toHaveAttribute('data-readonly');
    expect(root()).toHaveAttribute('data-required');
    expect(trigger()).toBeDisabled();
  });
});
