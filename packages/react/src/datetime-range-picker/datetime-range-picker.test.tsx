import { plainDate, plainTime } from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/datetime-range-picker/contract.json';
import { SlottedProvider } from '../i18n';
import {
  DateTimeRangePicker,
  DateTimeRangePickerDefaultsProvider,
  DateTimeRangePickerPreset,
} from './index';
import type { DateTimeRange, DateTimeRangePickerHandle } from './index';

const d = (day: number) => plainDate(2026, 9, day);
const t = (hour: number, minute = 0) => plainTime(hour, minute);
const dt = (day: number, hour: number, minute = 0): PlainDateTime => ({
  date: d(day),
  time: t(hour, minute),
});
const RUN: DateTimeRange = { start: dt(12, 14), end: dt(16, 11) };
const SAME_DAY: DateTimeRange = { start: dt(12, 14), end: dt(12, 16, 30) };
const NOON = dt(14, 12);

/** Every scene writes 24-hour English times on the fourteenth, so a row can be found by its text. */
const DTRP = (props: ComponentProps<typeof DateTimeRangePicker>) => (
  <DateTimeRangePicker hourCycle={24} locale="en" referenceDateTime={NOON} {...props} />
);

const root = () =>
  document.querySelector('[data-ui="datetime-range-picker"][data-part="root"]') as HTMLElement;
const part = (name: string) => document.querySelector(`[data-part="${name}"]`) as HTMLElement;
const trigger = () => part('trigger') as HTMLButtonElement;
const surface = () => document.querySelector('[data-part="content"]');
const tab = (position: 'start' | 'end') =>
  document.querySelector(`[data-part="tab"][data-position="${position}"]`) as HTMLElement;
/** The one panel, which is the current end's; asking for the other end swaps the tab. */
const panel = (position: 'start' | 'end') => {
  if (!tab(position).hasAttribute('data-current')) fireEvent.click(tab(position));
  return document.querySelector(`[data-part="panel"][data-position="${position}"]`) as HTMLElement;
};
const list = (position: 'start' | 'end') =>
  panel(position).querySelector('[data-part="list"]') as HTMLElement;
const optionFor = (position: 'start' | 'end', text: string) =>
  [...list(position).querySelectorAll<HTMLElement>('[data-part="option"]')].find((row) =>
    row.textContent?.startsWith(text),
  ) as HTMLElement;
const dayFor = (number: number) =>
  screen
    .getAllByRole('button')
    .find(
      (element) =>
        element.textContent === String(number) &&
        element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') === false,
    ) as HTMLElement;
const hint = () => part('hint');

describe('what it is made of', () => {
  it('renders a one-line frame, and two tabs, one field, one calendar and one list behind it', () => {
    render(<DTRP defaultOpen defaultValue={RUN} />);
    expect(root()).toHaveAttribute('data-ui', contract.ui);
    expect(part('control').querySelectorAll('[data-ui="datetime-field"]')).toHaveLength(0);
    expect(surface()?.querySelectorAll('[data-ui="datetime-field"]')).toHaveLength(1);
    expect(surface()?.querySelectorAll('[data-ui="calendar"]')).toHaveLength(1);
    expect(surface()?.querySelectorAll('[role="listbox"]')).toHaveLength(1);
    expect(surface()?.querySelectorAll('[role="tab"]')).toHaveLength(2);
    expect(part('summary').textContent).toMatch(/Sep 12.*14:00.*–.*Sep 16.*11:00/);
    expect(tab('start').textContent).toMatch(/Sep 12.*14:00/);
    expect(tab('end').textContent).toMatch(/Sep 16.*11:00/);
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
      <DTRP
        clearable
        defaultOpen
        defaultValue={{ start: dt(12, 17), end: dt(12, 17) }}
        footer={<button type="button">Aplicar</button>}
        maxLength={4 * 3600}
        maxTime={t(17)}
        minLength={900}
        presets={<DateTimeRangePickerPreset value={RUN}>Week</DateTimeRangePickerPreset>}
        unavailableOptions="hide"
      />,
    );
    /* One end at a time: the empty end and the list of the other are two tabs. */
    const collect = () =>
      [
        ...document.querySelectorAll(
          '[data-ui="datetime-range-picker"][data-part], [data-ui="datetime-range-picker"] [data-part]',
        ),
      ].map((element) => (element as HTMLElement).dataset['part']);
    const present = new Set(collect());
    fireEvent.click(tab('end'));
    for (const name of collect()) present.add(name);
    for (const name of contract.members.dateTimeRangePicker.parts) {
      if (name === 'root') continue;
      expect(present, `${name} is not rendered`).toContain(name);
    }

    vi.unstubAllGlobals();
  });

  it('shows one month by default and names the list by the current tab', () => {
    render(<DTRP defaultOpen defaultValue={RUN} messages={{ start: 'Pickup', end: 'Return' }} />);
    /* The calendar writes `data-months` only past one. */
    expect(document.querySelector('[data-ui="calendar"]')).not.toHaveAttribute('data-months');
    expect(document.querySelectorAll('[data-part="grid"]')).toHaveLength(1);
    expect(screen.getByRole('listbox', { name: /^Pickup/ })).toBe(list('start'));
    const end = list('end');
    expect(screen.getByRole('listbox', { name: /^Return/ })).toBe(end);
  });

  it('says which half to choose, with the day once there is one', () => {
    const empty = render(<DTRP defaultOpen messages={{ start: 'Pickup', end: 'Return' }} />);
    expect(hint()).toHaveTextContent('Pickup: choose a day');
    fireEvent.click(dayFor(12));
    expect(hint().textContent).toMatch(/Pickup: choose a time on .*12/);
    empty.unmount();

    render(<DTRP defaultOpen defaultValue={{ start: dt(16, 11), end: dt(12, 14) }} />);
    expect(hint()).toHaveTextContent('The end must come after the start');
    expect(hint()).toHaveAttribute('data-invalid');
  });

  it('submits two named values from the frame', () => {
    render(<DTRP defaultValue={RUN} endName="end" startName="start" />);
    expect(document.querySelector('input[name="start"]')).toHaveValue('2026-09-12T14:00:00');
    expect(document.querySelector('input[name="end"]')).toHaveValue('2026-09-16T11:00:00');
  });

  /** Both marks are `Glyph` elements inside an `Icon` box, never masks. */
  it('draws the calendar and the cross as glyph elements', () => {
    render(<DTRP clearable defaultValue={RUN} />);
    const glyph = (name: string) => part(name).querySelector("[data-ui='icon'] > svg[data-glyph]");
    expect(glyph('trigger')).toHaveAttribute('data-glyph', contract.triggerIcon);
    expect(glyph('clear')).toHaveAttribute('data-glyph', 'x');
  });
});

describe('the duration, said while the run is drawn', () => {
  it('says the duration of a whole value across days', () => {
    render(<DTRP defaultOpen defaultValue={RUN} />);
    expect(part('length')).toHaveTextContent('3 days 21 hr');
    expect(trigger().getAttribute('aria-label')).toContain('3 days 21 hr');
  });

  it('writes the duration beside the rows only while the two ends are on the same day', () => {
    const same = render(<DTRP defaultOpen defaultValue={SAME_DAY} />);
    expect(
      optionFor('end', '15:00').querySelector('[data-part="option-duration"]'),
    ).toHaveTextContent('1 hr');
    same.unmount();
    render(<DTRP defaultOpen defaultValue={RUN} />);
    expect(optionFor('end', '15:00').querySelector('[data-part="option-duration"]')).toBeNull();
  });

  it('says the duration a pending day would give, with the time the end holds', () => {
    render(<DTRP defaultOpen defaultValue={{ start: dt(12, 14), end: null }} />);
    fireEvent.pointerEnter(dayFor(13));
    expect(part('length')).toHaveTextContent('10 hr');
    expect(part('length')).toHaveAttribute('data-pending');
  });
});

describe('what each list refuses', () => {
  it('runs each list on the day of its own end, inside the day window', () => {
    render(<DTRP defaultOpen defaultValue={RUN} maxTime={t(18)} minTime={t(8)} />);
    expect(optionFor('start', '07:45')).toBeUndefined();
    expect(optionFor('start', '08:00')).toBeDefined();
    expect(optionFor('end', '18:00')).toBeDefined();
    expect(optionFor('end', '18:15')).toBeUndefined();
  });

  it('refuses, on the same day, the times before the start', () => {
    render(<DTRP defaultOpen defaultValue={{ start: dt(12, 14), end: dt(12, 16) }} />);
    expect(optionFor('end', '13:45')).toHaveAttribute('aria-disabled', 'true');
    expect(optionFor('end', '14:00')).not.toHaveAttribute('aria-disabled');
  });

  it('applies the duration limits across days', () => {
    render(
      <DTRP
        defaultOpen
        defaultValue={{ start: dt(12, 14), end: dt(13, 8) }}
        maxLength={12 * 3600}
      />,
    );
    /* On the thirteenth, 02:00 is exactly twelve hours; 02:15 is past it. */
    expect(optionFor('end', '02:00')).not.toHaveAttribute('aria-disabled');
    expect(optionFor('end', '02:15')).toHaveAttribute('aria-disabled', 'true');
  });

  it("runs a list on the grid's focused day while the end has no date", () => {
    render(<DTRP defaultOpen minTime={t(8)} />);
    /* The fourteenth is today; the list runs there, inside the day window. */
    expect(optionFor('start', '08:00')).toBeDefined();
    expect(optionFor('start', '07:45')).toBeUndefined();
    expect(tab('start')).toHaveAttribute('data-placeholder');
  });

  it('empties a list on a closed day', () => {
    render(
      <DTRP
        defaultOpen
        defaultValue={{ start: dt(17, 9), end: null }}
        messages={{ empty: 'Fechado' }}
        isDateUnavailable={(date: PlainDate) => date.day === 19}
      />,
    );
    fireEvent.click(dayFor(19));
    expect(panel('end').querySelector('[data-part="empty"]')).toBeNull();
  });
});

describe('choosing a run', () => {
  it('walks the reader through the four halves and closes on the last', () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    const onPositionChange = vi.fn();
    render(
      <DTRP
        defaultOpen
        onOpenChange={onOpenChange}
        onPositionChange={onPositionChange}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(dayFor(12));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(tab('start').textContent).toMatch(/12/);
    /* The start is still the current end: its time is what is missing. */
    expect(onPositionChange).not.toHaveBeenCalled();

    fireEvent.click(optionFor('start', '14:00'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onPositionChange).toHaveBeenLastCalledWith('end', expect.anything());
    expect(tab('end')).toHaveAttribute('data-current');

    fireEvent.click(dayFor(16));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(tab('end').textContent).toMatch(/16/);

    fireEvent.click(optionFor('end', '11:00'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: dt(12, 14), end: dt(16, 11) },
      expect.objectContaining({ reason: 'select' }),
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('keeps the hours with their ends when the grid orders the dates', () => {
    const onValueChange = vi.fn();
    render(
      <DTRP
        defaultOpen
        defaultPosition="end"
        defaultValue={{ start: dt(16, 14), end: null }}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(dayFor(12));
    fireEvent.click(optionFor('end', '11:00'));
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: dt(12, 14), end: dt(16, 11) },
      expect.anything(),
    );
  });

  it('keeps the panel open when a whole work is changed', () => {
    const onOpenChange = vi.fn();
    const onValueChange = vi.fn();
    render(
      <DTRP
        defaultOpen
        defaultValue={RUN}
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(optionFor('end', '12:00'));
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: dt(12, 14), end: dt(16, 12) },
      expect.anything(),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('abandons the work on Escape, walking the calendar down a view first', () => {
    const onValueChange = vi.fn();
    render(<DTRP defaultOpen defaultValue={RUN} onValueChange={onValueChange} />);
    fireEvent.click(document.querySelector('[data-part="heading"]') as HTMLElement);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(root()).toHaveAttribute('data-open');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(root()).not.toHaveAttribute('data-open');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('writes now, both halves, into the current end', () => {
    const onValueChange = vi.fn();
    render(
      <DTRP
        defaultOpen
        defaultValue={{ start: dt(12, 9), end: null }}
        onValueChange={onValueChange}
      />,
    );
    panel('end');
    fireEvent.click(part('now'));
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: dt(12, 9), end: NOON },
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('writes a preset whole and marks it selected', () => {
    const onValueChange = vi.fn();
    render(
      <DTRP
        defaultOpen
        onValueChange={onValueChange}
        presets={<DateTimeRangePickerPreset value={RUN}>Estadia</DateTimeRangePickerPreset>}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Estadia' }));
    expect(onValueChange).toHaveBeenLastCalledWith(
      RUN,
      expect.objectContaining({ reason: 'select' }),
    );
    expect(screen.getByRole('button', { name: 'Estadia' })).toHaveAttribute('data-selected');
  });

  it('empties both ends from the clear on the frame', () => {
    const onValueChange = vi.fn();
    render(<DTRP clearable defaultValue={RUN} onValueChange={onValueChange} />);
    fireEvent.click(part('clear'));
    expect(onValueChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: 'clear' }),
    );
  });
});

describe('validity', () => {
  it('names the end field invalid when it comes before the start, and swaps nothing', () => {
    render(<DTRP defaultOpen defaultValue={{ start: dt(16, 11), end: dt(12, 14) }} />);
    expect(root()).toHaveAttribute('data-invalid');
    panel('end');
    expect(part('field').querySelector('[data-ui="datetime-field"]')).toHaveAttribute(
      'data-invalid',
    );
  });

  it('reports a value outside the day window', () => {
    render(<DTRP defaultValue={{ start: dt(12, 7), end: dt(12, 9) }} minTime={t(8)} />);
    expect(root()).toHaveAttribute('data-invalid');
  });
});

describe('keys and ownership', () => {
  it('opens on ArrowDown onto the cell of the current end', async () => {
    vi.useFakeTimers();
    try {
      render(<DTRP defaultValue={RUN} />);
      fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
      await act(async () => {
        vi.runAllTimers();
      });
      expect(document.activeElement).toBe(dayFor(12));
    } finally {
      vi.useRealTimers();
    }
  });

  it('exposes focus, open and close on the handle', () => {
    const handle = { current: null as DateTimeRangePickerHandle | null };
    const onOpenChange = vi.fn();
    render(<DTRP onOpenChange={onOpenChange} ref={handle} />);
    act(() => handle.current?.open());
    expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());
    act(() => handle.current?.focus());
    expect(document.activeElement).toBe(trigger());
  });

  it('reads the defaults an application set once', () => {
    render(
      <DateTimeRangePickerDefaultsProvider months={2}>
        <DTRP defaultOpen />
      </DateTimeRangePickerDefaultsProvider>,
    );
    expect(document.querySelector('[data-ui="calendar"]')).toHaveAttribute('data-months', '2');
  });

  it('changes its words and its date and time format together with the language in force', () => {
    const inLocale = (locale: string) => (
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
        <DateTimeRangePicker defaultValue={RUN} referenceDateTime={NOON} />
      </SlottedProvider>
    );
    const { rerender } = render(inLocale('pt-BR'));

    // language: pt-BR
    expect(trigger().getAttribute('aria-label')).toMatch(/^Alterar período, /);
    // language: en-US
    expect(part('summary').textContent).toMatch(/12 de set.*14:00/);

    rerender(inLocale('en-US'));
    expect(trigger().getAttribute('aria-label')).toMatch(/^Change range, /);
    expect(part('summary').textContent).toMatch(/Sep 12.*2:00\sPM/);
  });

  it('names the limit in the language in force', () => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <DateTimeRangePicker defaultOpen maxLength={7 * 86400} minLength={86400} />
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(part('limit')).toHaveTextContent(/^de 1 dia a 7 dias$/);
    // language: en-US
  });

  it('refuses a time unavailable on its day, and only there', () => {
    const closed = (time: PlainTime, date: PlainDate) => date.day === 12 && time.hour === 15;
    render(<DTRP defaultOpen defaultValue={RUN} isTimeUnavailable={closed} />);
    expect(optionFor('start', '15:00')).toHaveAttribute('aria-disabled', 'true');
    expect(optionFor('end', '15:00')).not.toHaveAttribute('aria-disabled');
  });
});
