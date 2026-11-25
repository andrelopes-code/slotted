import { plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/date-range-picker/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { DateRangePicker, DateRangePickerDefaultsProvider } from './index';
import type { DateRange, DateRangePickerHandle, DateRangePickerProps } from './index';

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

describe('choosing a run', () => {
  /** The gap no surveyed implementation closes well: a panel closed with one end chosen. */
  /** With `position: 'end'` the next press writes the end instead of restarting. */
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
});

describe('where it opens with nothing chosen', () => {
  const now = new Date();
  const thisMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    now,
  );

  it('starts its two months on today’s month', () => {
    render(<DateRangePicker locale="en-US" />);

    open();

    expect(document.querySelector('[data-part="heading"]')).toHaveTextContent(thisMonth);
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

describe('the head of the panel', () => {
  it('declares every part the contract names, and opens the shared panel', () => {
    draw({ clearable: true, defaultOpen: true, defaultValue: RUN });

    for (const name of contract.members.dateRangePicker.parts) {
      expect(part(name), name).toBeInTheDocument();
    }
    expect(document.querySelector('[data-ui="picker-panel"][data-part="root"]')).toHaveAttribute(
      'data-kind',
      'date-range',
    );
  });

  it('writes each end in words, and the length between them', () => {
    draw({ defaultOpen: true, defaultValue: RUN });

    expect(halves()).toEqual(['Mon, Sep 7', 'Fri, Sep 11']);
    expect(span()).toBe('5 days');
  });

  it('says the length the pending end would give', () => {
    draw({ defaultOpen: true, defaultValue: { start: d(21), end: d(22) } });

    fireEvent.click(dayFor(7));
    fireEvent.pointerEnter(dayFor(9));
    expect(span()).toBe('3 days');
    expect(halves()).toEqual(['Mon, Sep 7', 'Choose a day']);
  });

  it('counts nights when asked, and the same day as none', () => {
    const { unmount } = render(
      <DateRangePicker {...base} count="nights" defaultOpen defaultValue={RUN} />,
    );
    expect(span()).toBe('4 nights');
    unmount();

    draw({ count: 'nights', defaultOpen: true, defaultValue: { start: d(7), end: d(7) } });
    expect(span()).toBe('0 nights');
  });

  it('marks the end the next press writes, and follows the press on the other', () => {
    draw({ defaultOpen: true, defaultValue: RUN });
    expect(currentHalf()).toBe('Start');

    fireEvent.click(screen.getByRole('button', { name: 'Fri, Sep 11' }));
    expect(currentHalf()).toBe('End');
  });

  it('lengthens and shortens the run inside its limits', () => {
    draw({
      count: 'nights',
      defaultOpen: true,
      defaultValue: RUN,
      maxLength: 5,
      minLength: 4,
    });
    const [shorter, longer] = ['Shorten', 'Lengthen'].map((name) =>
      screen.getByRole('button', { name }),
    );
    expect(shorter).toBeDisabled();

    fireEvent.click(longer!);
    expect(span()).toBe('5 nights');
    expect(longer).toBeDisabled();
    expect(shorter).toBeEnabled();
  });
});

describe('the draft', () => {
  it('opens on the first press, closes on the second, and reaches the value on Apply', () => {
    const change = draw({ defaultOpen: true, defaultValue: RUN });

    fireEvent.click(dayFor(14));
    expect(halves()).toEqual(['Mon, Sep 14', 'Choose a day']);
    expect(apply()).toBeDisabled();

    fireEvent.click(dayFor(18));
    expect(halves()).toEqual(['Mon, Sep 14', 'Fri, Sep 18']);
    expect(change).not.toHaveBeenCalled();

    fireEvent.click(apply());
    expect(change.mock.lastCall?.[0]).toEqual({ start: d(14), end: d(18) });
    expect(change.mock.lastCall?.[1].reason).toBe('select');
    expect(trigger()).toHaveFocus();
  });

  it('orders the two ends whichever is pressed first', () => {
    const change = draw({ defaultOpen: true, defaultValue: RUN });

    fireEvent.click(dayFor(18));
    fireEvent.click(dayFor(14));
    fireEvent.click(apply());
    expect(change.mock.lastCall?.[0]).toEqual({ start: d(14), end: d(18) });
  });

  it('is abandoned when the panel closes', () => {
    const change = draw({ defaultOpen: true, defaultValue: RUN });

    fireEvent.click(dayFor(14));
    fireEvent.keyDown(document, { key: 'Escape' });
    open();
    expect(halves()).toEqual(['Mon, Sep 7', 'Fri, Sep 11']);
    expect(change).not.toHaveBeenCalled();
  });

  it('writes the end when the end is the current position', () => {
    const change = draw({ defaultOpen: true, defaultPosition: 'end', defaultValue: RUN });

    fireEvent.click(dayFor(18));
    fireEvent.click(apply());
    expect(change.mock.lastCall?.[0]).toEqual({ start: d(7), end: d(18) });
  });

  it('treats a typed open end as an open run', () => {
    const change = draw({ defaultOpen: true, defaultValue: { start: d(7), end: null } });

    fireEvent.click(screen.getByRole('button', { name: 'Choose a day' }));
    fireEvent.click(dayFor(11));
    fireEvent.click(apply());
    expect(change.mock.lastCall?.[0]).toEqual(RUN);
  });

  it('is written by the press that closes the run, without a confirmation', () => {
    const change = draw({ confirm: false, defaultOpen: true, defaultValue: RUN });

    fireEvent.click(dayFor(14));
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(dayFor(18));
    expect(change.mock.lastCall?.[0]).toEqual({ start: d(14), end: d(18) });
    expect(document.querySelector('[data-part="positioner"][data-open]')).toBeNull();
  });

  it('is emptied by Clear, and Apply writes the empty value', () => {
    const change = draw({ defaultOpen: true, defaultValue: RUN });

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    fireEvent.click(apply());
    expect(change.mock.lastCall?.[0]).toBeNull();
  });
});

describe('the rules of a run', () => {
  it('say the limit, and refuse the days beyond it while a start is chosen', () => {
    draw({ count: 'nights', defaultOpen: true, defaultValue: RUN, maxLength: 3, minLength: 2 });
    fireEvent.click(dayFor(14));

    expect(dayFor(17)).not.toHaveAttribute('aria-disabled');
    expect(dayFor(18)).toHaveAttribute('aria-disabled', 'true');
    expect(hint()).toBe('2 to 3 nights');
  });

  it('say by how much a run is over, and mark its days past the limit', () => {
    draw({
      count: 'nights',
      defaultOpen: true,
      defaultValue: { start: d(7), end: d(12) },
      maxLength: 3,
    });

    expect(hint()).toBe('2 nights over the limit');
    expect(apply()).toBeDisabled();
    expect(
      [...document.querySelectorAll('[data-part="cell"][data-over]')].map((x) => x.textContent),
    ).toEqual(['11', '12']);
  });

  it('say an end before its start, and an unavailable day inside', () => {
    const { unmount } = render(
      <DateRangePicker {...base} defaultOpen defaultValue={{ start: d(11), end: d(7) }} />,
    );
    expect(hint()).toBe('The end must come after the start');
    unmount();

    draw({ defaultOpen: true, defaultValue: RUN, isDateUnavailable: (date) => date.day === 9 });
    expect(hint()).toBe('Crosses an unavailable day');
  });
});

describe('the shortcuts', () => {
  const week: DateRange = { start: d(14), end: d(18) };

  it('say the run they write, and mark the one the draft is', () => {
    const change = draw({
      defaultOpen: true,
      presets: [{ label: 'Next week', value: () => week }],
    });
    const preset = screen.getByRole('button', { name: /^Next week/ });
    expect(preset).toHaveTextContent('Sep 14');

    fireEvent.click(preset);
    expect(preset).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(apply());
    expect(change.mock.lastCall?.[0]).toEqual(week);
  });

  it('are off when the rules refuse them', () => {
    draw({ defaultOpen: true, maxLength: 3, presets: [{ label: 'Next week', value: week }] });

    expect(screen.getByRole('button', { name: /^Next week/ })).toBeDisabled();
  });
});

describe('what the application states once', () => {
  it('is the unit, the months and the confirmation', () => {
    render(
      <DateRangePickerDefaultsProvider confirm={false} count="nights" months={1}>
        <DateRangePicker {...base} defaultOpen defaultValue={RUN} />
      </DateRangePickerDefaultsProvider>,
    );

    expect(span()).toBe('4 nights');
    expect(document.querySelectorAll('[data-part="month"]')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Apply' })).toBeNull();
  });

  it('is laid over by its own messages, a counting phrase included', () => {
    draw({
      defaultOpen: true,
      defaultValue: RUN,
      messages: { days: { length: '{count} working days' }, start: 'Pickup' },
    });

    expect(span()).toBe('5 working days');
    expect(currentHalf()).toBe('Pickup');
  });

  it('is in the language in force', () => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <DateRangePicker count="nights" defaultOpen defaultValue={RUN} />
      </SlottedProvider>,
    );

    // language: pt-BR
    expect(span()).toBe('4 noites');
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument();
    // language: en-US
  });
});

const base = { locale: 'en-US' } as const;

type Change = NonNullable<DateRangePickerProps['onValueChange']>;

function draw(props: Partial<DateRangePickerProps> = {}) {
  const change = vi.fn<Change>();
  render(<DateRangePicker {...base} onValueChange={change} {...props} />);

  return change;
}

const apply = () => screen.getByRole('button', { name: 'Apply' });
const span = () => part('span-text').textContent;
const hint = () => part('hint').textContent;
const halves = () =>
  [...document.querySelectorAll('[data-part="half-day"]')].map((half) => half.textContent);
const currentHalf = () =>
  document.querySelector('[data-part="half"][data-current] [data-part="half-label"]')?.textContent;
