import { plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/date-range-picker/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { DateRangePicker, DateRangePickerDefaultsProvider, DateRangePickerPreset } from './index';
import type { DateRange, DateRangePickerHandle } from './index';

/** Focus moves into the surface in the frame after it opens. */
const nextFrame = () =>
  act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

const d = (day: number, month = 9) => plainDate(2026, month, day);
const SEVENTH = d(7);
const RUN: DateRange = { start: d(7), end: d(11) };

const root = () =>
  document.querySelector('[data-ui="date-range-picker"][data-part="root"]') as HTMLElement;
const part = (name: string) => document.querySelector(`[data-part="${name}"]`) as HTMLElement;
const trigger = () => part('trigger') as HTMLButtonElement;
const surface = () => document.querySelector('[data-part="content"]');
const dayFor = (number: number) =>
  [...document.querySelectorAll('[data-part="day"]')].find(
    (element) =>
      element.textContent === String(number) &&
      element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') === false,
  ) as HTMLElement;
const segments = () => screen.getAllByRole('spinbutton') as HTMLElement[];
const open = () => {
  fireEvent.click(trigger());
};

describe('what it is made of', () => {
  it('renders two fields and one calendar, each keeping its own identifier', () => {
    render(<DateRangePicker defaultOpen defaultValue={RUN} locale="pt-BR" />);

    expect(document.querySelectorAll('[data-ui="date-field"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-ui="calendar"]')).toHaveLength(1);
    expect(root()).toHaveAttribute('data-ui', contract.ui);
    expect(root()).toHaveAttribute('data-count', 'days');
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
      <DateRangePicker
        clearable
        defaultOpen
        defaultValue={RUN}
        footer={<button type="button">Aplicar</button>}
        locale="pt-BR"
        maxLength={7}
        presets={<DateRangePickerPreset value={RUN}>This week</DateRangePickerPreset>}
      />,
    );

    const present = new Set(
      [
        ...document.querySelectorAll(
          '[data-ui="date-range-picker"][data-part], [data-ui="date-range-picker"] [data-part]',
        ),
      ].map((element) => (element as HTMLElement).dataset['part']),
    );
    for (const name of contract.members.dateRangePicker.parts) {
      if (name === 'root') continue;
      expect(present, `${name} is not rendered`).toContain(name);
    }

    vi.unstubAllGlobals();
  });

  it('carries the dialog role and points the trigger at it while it is open', () => {
    render(<DateRangePicker defaultOpen defaultValue={RUN} locale="pt-BR" />);

    expect(surface()).toHaveAttribute('role', 'dialog');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger().getAttribute('aria-controls')).toBe(surface()?.id);
  });

  it('names the two fields and submits them under two names', () => {
    render(
      <DateRangePicker
        defaultValue={RUN}
        endName="fim"
        locale="pt-BR"
        messages={{ end: 'End', start: 'Start' }}
        startName="start"
      />,
    );
    expect(screen.getByRole('group', { name: /^Start/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /^End/ })).toBeInTheDocument();
    expect(document.querySelector('input[name="start"]')).toHaveValue('2026-09-07');
    expect(document.querySelector('input[name="fim"]')).toHaveValue('2026-09-11');
  });
});

describe('what the trigger says', () => {
  it('names itself for choosing while nothing is chosen', () => {
    render(<DateRangePicker locale="pt-BR" messages={{ choose: 'Choose a range' }} />);
    expect(trigger()).toHaveAttribute('aria-label', 'Choose a range');
  });

  /** Both ends and the length: the name is where the reader is told what was chosen. */
  it('carries both ends and the length once the run is whole', () => {
    render(
      <DateRangePicker
        count="nights"
        defaultValue={RUN}
        locale="pt-BR"
        messages={{ change: 'Change the range, {start} – {end}, {length}' }}
      />,
    );
    const name = trigger().getAttribute('aria-label') ?? '';
    expect(name).toContain('Change the range');
    expect(name).toMatch(/7 de setembro de 2026/);
    expect(name).toMatch(/11 de setembro de 2026/);
    expect(name).toContain('4 nights');
  });

  /** Both marks are `Glyph` elements inside an `Icon` box, never masks. */
  it('draws the calendar and the cross as glyph elements', () => {
    render(<DateRangePicker clearable defaultValue={RUN} locale="pt-BR" />);
    const glyph = (name: string) => part(name).querySelector("[data-ui='icon'] > svg[data-glyph]");
    expect(glyph('trigger')).toHaveAttribute('data-glyph', 'calendar');
    expect(glyph('clear')).toHaveAttribute('data-glyph', 'x');
  });
});

describe('the length, said while the run is drawn', () => {
  it('says the length of a whole value', () => {
    render(<DateRangePicker defaultOpen defaultValue={RUN} locale="pt-BR" />);
    expect(part('length')).toHaveTextContent('5 days');
    expect(part('length')).toHaveAttribute('aria-live', 'polite');
    expect(part('length')).not.toHaveAttribute('data-pending');
  });

  it('says the length the pending end would give, and marks it pending', () => {
    render(
      <DateRangePicker
        count="nights"
        defaultOpen
        defaultValue={{ start: SEVENTH, end: null }}
        locale="pt-BR"
      />,
    );

    fireEvent.pointerEnter(dayFor(11));
    expect(part('length')).toHaveTextContent('4 nights');
    expect(part('length')).toHaveAttribute('data-pending');
    expect(part('head-end')).toHaveAttribute('data-pending');
    expect(part('head-start')).not.toHaveAttribute('data-placeholder');
  });

  it('draws the missing end as a placeholder', () => {
    render(<DateRangePicker defaultOpen locale="pt-BR" />);
    expect(part('head-start')).toHaveAttribute('data-placeholder');
    expect(part('head-end')).toHaveAttribute('data-placeholder');
    expect(part('length')).toBeEmptyDOMElement();
  });

  it('counts the same day as one day or no nights', () => {
    const { rerender } = render(
      <DateRangePicker defaultOpen locale="pt-BR" value={{ start: SEVENTH, end: SEVENTH }} />,
    );
    expect(part('length')).toHaveTextContent('1 day');
    rerender(
      <DateRangePicker
        count="nights"
        defaultOpen
        locale="pt-BR"
        value={{ start: SEVENTH, end: SEVENTH }}
      />,
    );
    expect(part('length')).toHaveTextContent('0 nights');
  });

  it('names a limit while one is set', () => {
    render(
      <DateRangePicker count="nights" defaultOpen locale="pt-BR" maxLength={7} minLength={2} />,
    );
    expect(part('limit')).toHaveTextContent('2 to 7 nights');
  });
});

describe('choosing a run', () => {
  it('holds the first press as a draft and emits the whole run on the second', () => {
    const onValueChange = vi.fn();
    const onPositionChange = vi.fn();
    render(
      <DateRangePicker
        defaultOpen
        locale="pt-BR"
        onPositionChange={onPositionChange}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(dayFor(7));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onPositionChange).toHaveBeenLastCalledWith(
      'end',
      expect.objectContaining({ reason: 'select' }),
    );
    expect(part('end')).toHaveAttribute('data-current');
    expect(part('head-start')).toHaveTextContent('7');

    fireEvent.click(dayFor(11));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    /* The calendar opens on today's month, so the run is read by its days. */
    const [run, request] = onValueChange.mock.lastCall as [DateRange, { reason: string }];
    expect([run.start?.day, run.end?.day]).toEqual([7, 11]);
    expect(run.start?.month).toBe(run.end?.month);
    expect(request.reason).toBe('select');
    expect(onPositionChange).toHaveBeenLastCalledWith(
      'start',
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('closes when the run becomes whole and returns focus to the trigger', () => {
    const onOpenChange = vi.fn();
    render(<DateRangePicker defaultOpen locale="pt-BR" onOpenChange={onOpenChange} />);

    fireEvent.click(dayFor(7));
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.click(dayFor(11));
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'select' }),
    );
    expect(trigger()).toHaveFocus();
  });

  it('stays open when asked to never close, and closes on any press when asked to always', () => {
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <DateRangePicker
        closeOnSelect="never"
        defaultOpen
        locale="pt-BR"
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(dayFor(7));
    fireEvent.click(dayFor(11));
    expect(onOpenChange).not.toHaveBeenCalled();
    unmount();

    render(
      <DateRangePicker
        closeOnSelect="always"
        defaultOpen
        locale="pt-BR"
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(dayFor(7));
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'select' }),
    );
  });

  /** The gap no surveyed implementation closes well: a panel closed with one end chosen. */
  it('abandons the draft when the surface closes', async () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        defaultOpen
        defaultValue={RUN}
        locale="pt-BR"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(dayFor(20));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(document.querySelector('input[data-part="hidden-input"]')).toHaveValue('2026-09-07');

    open();

    await nextFrame();
    expect(part('head-start')).toHaveTextContent('7');
    expect(part('head-end')).toHaveTextContent('11');
  });

  /** With `position: 'end'` the next press writes the end instead of restarting. */
  it('writes the end when the end is the current position', () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        defaultOpen
        defaultValue={RUN}
        locale="pt-BR"
        onValueChange={onValueChange}
        position="end"
      />,
    );

    fireEvent.click(dayFor(20));
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: d(7), end: d(20) },
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('treats a typed open end as an open run', () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        defaultOpen
        defaultValue={{ start: SEVENTH, end: null }}
        locale="pt-BR"
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(dayFor(11));
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: d(7), end: d(11) },
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('writes a preset with the select reason, marks the one equal to the value, and closes', () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <DateRangePicker
        defaultOpen
        locale="pt-BR"
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
        presets={
          <>
            <DateRangePickerPreset value={RUN}>This week</DateRangePickerPreset>
            <DateRangePickerPreset value={() => ({ start: d(1), end: d(30) })}>
              This month
            </DateRangePickerPreset>
          </>
        }
        value={RUN}
      />,
    );

    const presets = document.querySelectorAll('[data-part="preset"]');
    expect(presets[0]).toHaveAttribute('data-selected');
    expect(presets[1]).not.toHaveAttribute('data-selected');

    fireEvent.click(presets[1] as HTMLElement);
    expect(onValueChange).toHaveBeenLastCalledWith(
      { start: d(1), end: d(30) },
      expect.objectContaining({ reason: 'select' }),
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('empties both ends from one clear', () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker clearable defaultValue={RUN} locale="pt-BR" onValueChange={onValueChange} />,
    );
    expect(document.querySelectorAll('[data-part="clear"]')).toHaveLength(1);
    fireEvent.click(part('clear'));
    expect(onValueChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: 'clear' }),
    );
  });

  it('returns to its default value when its form is reset', () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <form>
        <DateRangePicker
          clearable
          defaultValue={RUN}
          endName="fim"
          locale="pt-BR"
          onValueChange={onValueChange}
          startName="start"
        />
      </form>,
    );
    const input = (name: string) => container.querySelector<HTMLInputElement>(`[name="${name}"]`);

    fireEvent.click(part('clear'));
    expect(input('start')?.value).toBe('');

    act(() => container.querySelector('form')?.reset());

    expect(input('start')?.value).toBe('2026-09-07');
    expect(input('fim')?.value).toBe('2026-09-11');
    expect(onValueChange).toHaveBeenLastCalledWith(
      RUN,
      expect.objectContaining({ reason: 'programmatic' }),
    );
  });
});

describe('the limits', () => {
  it('refuses the days beyond the limit while a start is chosen, and explains it', () => {
    render(
      <DateRangePicker
        count="nights"
        defaultOpen
        defaultValue={{ start: SEVENTH, end: null }}
        locale="pt-BR"
        maxLength={7}
        minLength={2}
      />,
    );
    expect(dayFor(8).closest('[data-part="cell"]')).toHaveAttribute('data-unavailable');
    expect(dayFor(9).closest('[data-part="cell"]')).not.toHaveAttribute('data-unavailable');
    expect(dayFor(14).closest('[data-part="cell"]')).not.toHaveAttribute('data-unavailable');
    expect(dayFor(15).closest('[data-part="cell"]')).toHaveAttribute('data-unavailable');
    expect(part('limit')).toHaveTextContent('2 to 7 nights');
  });

  it('refuses the days beyond an unavailable one while the run must be contiguous', () => {
    const { rerender } = render(
      <DateRangePicker
        defaultOpen
        defaultValue={{ start: SEVENTH, end: null }}
        isDateUnavailable={(date: PlainDate) => date.day === 15}
        locale="pt-BR"
      />,
    );
    expect(dayFor(14).closest('[data-part="cell"]')).not.toHaveAttribute('data-unavailable');
    expect(dayFor(20).closest('[data-part="cell"]')).toHaveAttribute('data-unavailable');

    rerender(
      <DateRangePicker
        contiguous={false}
        defaultOpen
        defaultValue={{ start: SEVENTH, end: null }}
        isDateUnavailable={(date: PlainDate) => date.day === 15}
        locale="pt-BR"
      />,
    );
    expect(dayFor(20).closest('[data-part="cell"]')).not.toHaveAttribute('data-unavailable');
  });

  it('hands the bounds to the fields and to the frame', () => {
    render(<DateRangePicker locale="pt-BR" min={d(9)} value={RUN} />);
    const fields = document.querySelectorAll('[data-ui="date-field"]');
    expect(fields[0]).toHaveAttribute('data-invalid');
    expect(fields[1]).not.toHaveAttribute('data-invalid');
    expect(root()).toHaveAttribute('data-invalid');
  });
});

describe('what the frame says', () => {
  it('states its own invalidity for an end before its start, and swaps nothing', () => {
    render(<DateRangePicker locale="pt-BR" value={{ start: d(11), end: d(7) }} />);
    expect(root()).toHaveAttribute('data-invalid');
    const fields = document.querySelectorAll('[data-ui="date-field"]');
    expect(fields[0]).not.toHaveAttribute('data-invalid');
    expect(fields[1]).toHaveAttribute('data-invalid');
    expect(document.querySelectorAll('[data-part="hidden-input"]')[0]).toHaveValue('2026-09-11');
  });

  it('states its own invalidity for a run outside the limits or over an unavailable day', () => {
    const { rerender } = render(
      <DateRangePicker count="nights" locale="pt-BR" maxLength={2} value={RUN} />,
    );
    expect(root()).toHaveAttribute('data-invalid');
    rerender(
      <DateRangePicker isDateUnavailable={(date) => date.day === 9} locale="pt-BR" value={RUN} />,
    );
    expect(root()).toHaveAttribute('data-invalid');
    rerender(<DateRangePicker locale="pt-BR" value={RUN} />);
    expect(root()).not.toHaveAttribute('data-invalid');
  });

  it('follows the field the reader focuses', () => {
    const onPositionChange = vi.fn();
    render(<DateRangePicker locale="pt-BR" onPositionChange={onPositionChange} />);
    expect(part('start')).toHaveAttribute('data-current');

    act(() => {
      (segments()[3] as HTMLElement).focus();
    });
    expect(onPositionChange).toHaveBeenLastCalledWith(
      'end',
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(part('end')).toHaveAttribute('data-current');
    expect(part('start')).not.toHaveAttribute('data-current');
  });

  it('takes the two buttons out while it is disabled or read-only', () => {
    const { rerender } = render(
      <DateRangePicker clearable defaultValue={RUN} disabled locale="pt-BR" />,
    );
    expect(trigger()).toBeDisabled();
    expect(part('clear')).toBeDisabled();
    expect(root()).toHaveAttribute('data-disabled');
    rerender(<DateRangePicker clearable defaultValue={RUN} locale="pt-BR" readOnly />);
    expect(trigger()).toBeDisabled();
    expect(root()).toHaveAttribute('data-readonly');
  });
});

describe('opening and closing', () => {
  it('opens and closes from the trigger, and opens from either field with the chord', () => {
    const onOpenChange = vi.fn();
    render(<DateRangePicker locale="pt-BR" onOpenChange={onOpenChange} />);

    open();
    expect(surface()).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: 'pointer' }),
    );
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'pointer' }),
    );

    fireEvent.keyDown(segments()[4] as HTMLElement, { key: 'ArrowDown', altKey: true });
    expect(surface()).toBeInTheDocument();
  });

  it('closes on Escape, walking the calendar down a view first', () => {
    const onOpenChange = vi.fn();
    render(
      <DateRangePicker defaultOpen defaultValue={RUN} locale="pt-BR" onOpenChange={onOpenChange} />,
    );
    const calendar = document.querySelector('[data-ui="calendar"]') as HTMLElement;
    fireEvent.click(document.querySelector('[data-part="heading"]') as HTMLElement);
    expect(calendar).toHaveAttribute('data-view', 'month');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(calendar).toHaveAttribute('data-view', 'day');
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'escape' }),
    );
    expect(trigger()).toHaveFocus();
  });

  it('opens on the cell of the current end', () => {
    render(<DateRangePicker defaultPosition="end" defaultValue={RUN} locale="pt-BR" />);
    open();
    expect(document.querySelector('[data-part="day"][tabindex="0"]')).toHaveTextContent('11');
  });
});

describe('what an application sets once', () => {
  it('takes the unit and the months from a provider, and its words from the language in force', () => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <DateRangePickerDefaultsProvider count="nights" months={1}>
          <DateRangePicker defaultOpen defaultValue={RUN} />
        </DateRangePickerDefaultsProvider>
      </SlottedProvider>,
    );
    expect(root()).toHaveAttribute('data-count', 'nights');
    expect(part('length')).toHaveTextContent('4 noites');
    // language: pt-BR
    expect(trigger().getAttribute('aria-label')).toContain('Alterar período');
    // language: en-US
    expect(document.querySelectorAll('[data-part="grid"]')).toHaveLength(1);
  });

  it('lays its own messages over the catalog, a counting phrase included', () => {
    render(
      <DateRangePicker
        count="nights"
        defaultOpen
        defaultValue={RUN}
        messages={{
          nights: { length: '{count, plural, one {# room-night} other {# room-nights}}' },
        }}
      />,
    );
    expect(part('length')).toHaveTextContent('4 room-nights');
    expect(trigger().getAttribute('aria-label')).toContain('Change range');
  });

  it('changes its words and its dates together with the language in force', () => {
    const inLocale = (locale: string) => (
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
        <DateRangePicker count="nights" defaultValue={RUN} />
      </SlottedProvider>
    );
    const { rerender } = render(inLocale('pt-BR'));

    expect(trigger().getAttribute('aria-label')).toMatch(
      // language: pt-BR
      /^Alterar período, .*7 de setembro de 2026 – .*11 de setembro de 2026, 4 noites$/,
      // language: en-US
    );

    rerender(inLocale('en-US'));
    expect(trigger().getAttribute('aria-label')).toMatch(
      /^Change range, .*September 7, 2026 – .*September 11, 2026, 4 nights$/,
    );
  });
});

describe('the composition surface', () => {
  it('hands the consumer a handle for what a prop cannot express', () => {
    const handle = { current: null as DateRangePickerHandle | null };
    render(<DateRangePicker locale="pt-BR" ref={handle} />);

    act(() => handle.current?.open());
    expect(surface()).toBeInTheDocument();
    act(() => handle.current?.close());
    expect(root()).not.toHaveAttribute('data-open');
    act(() => handle.current?.focus('end'));
    expect(segments()[3]).toHaveFocus();
  });

  it('substitutes the element the root renders', () => {
    render(<DateRangePicker locale="pt-BR" render={(props) => <section {...props} />} />);
    expect(root().tagName).toBe('SECTION');
  });

  it('lets the consumer’s own handlers run first', () => {
    const onClick = vi.fn();
    render(
      <DateRangePicker
        defaultOpen
        locale="pt-BR"
        presets={
          <DateRangePickerPreset onClick={onClick} value={RUN}>
            This week
          </DateRangePickerPreset>
        }
      />,
    );
    fireEvent.click(part('preset'));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('where focus goes when it opens', () => {
  it('moves focus to the cell of the current end when the trigger opens it', async () => {
    render(<DateRangePicker defaultPosition="end" defaultValue={RUN} locale="en-US" />);

    open();

    await nextFrame();

    expect(document.activeElement?.getAttribute('data-part')).toBe('day');
    expect(document.activeElement?.textContent).toBe('11');
  });

  it('moves focus into the calendar when the handle opens it', async () => {
    const handle = { current: null as DateRangePickerHandle | null };
    render(<DateRangePicker defaultValue={RUN} locale="en-US" ref={handle} />);

    act(() => handle.current?.open());

    await nextFrame();

    expect(document.activeElement?.getAttribute('data-part')).toBe('day');
    expect(document.activeElement?.textContent).toBe('7');
  });

  it('leaves focus in the field when the chord opens it', () => {
    render(<DateRangePicker defaultValue={RUN} locale="en-US" />);
    const segment = segments()[0] as HTMLElement;
    act(() => segment.focus());

    fireEvent.keyDown(segment, { key: 'ArrowDown', altKey: true });

    expect(surface()).toBeInTheDocument();
    expect(segment).toHaveFocus();
  });

  it('leaves focus alone when it is rendered open', () => {
    render(<DateRangePicker defaultOpen defaultValue={RUN} locale="en-US" />);

    expect(document.activeElement).toBe(document.body);
  });

  it('keeps Tab inside the surface while it is open', () => {
    render(
      <DateRangePicker
        defaultOpen
        defaultValue={RUN}
        footer={<button type="button">Apply</button>}
        locale="en-US"
        presets={<DateRangePickerPreset value={RUN}>This week</DateRangePickerPreset>}
      />,
    );
    const first = screen.getByRole('button', { name: 'This week' });
    const last = screen.getByRole('button', { name: 'Apply' });

    act(() => last.focus());
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();

    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });
});

describe('where it opens with nothing chosen', () => {
  const now = new Date();
  const thisMonth = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
    now,
  );

  it('starts its two months on today’s month', () => {
    render(<DateRangePicker locale="en-US" />);

    open();

    expect(document.querySelector('[data-part="heading"]')?.textContent).toMatch(
      new RegExp(`^${thisMonth} – `),
    );
  });

  it('moves focus to today when the trigger opens it', async () => {
    render(<DateRangePicker locale="en-US" />);

    open();

    await nextFrame();

    expect(document.activeElement?.getAttribute('data-part')).toBe('day');
    expect(document.activeElement?.textContent).toBe(String(now.getDate()));
  });
});

describe('inside a field', () => {
  it('names the frame after the field’s label and gives each end its own identifier', () => {
    render(
      <Field>
        <FieldLabel>Stay</FieldLabel>
        <DateRangePicker locale="en-US" />
      </Field>,
    );

    const frame = screen.getByRole('group', { name: 'Stay' });
    expect(frame).toHaveAttribute('data-part', 'control');
    expect(screen.getByText('Stay')).toHaveAttribute('for', frame.id);
    const ends = [
      screen.getByRole('group', { name: 'Start' }),
      screen.getByRole('group', { name: 'End' }),
    ];
    expect(ends.every((end) => frame.contains(end))).toBe(true);
    const ids = [frame.id, ...ends.map((end) => end.id)];
    expect(new Set(ids).size).toBe(3);
  });
});
