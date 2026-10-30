import { plainDate, plainYearMonth, toISODate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/date-picker/contract.json';
import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { DatePicker, DatePickerDefaultsProvider } from './index';
import type { DatePickerHandle } from './index';

/** Focus moves into the surface in the frame after it opens. */
const nextFrame = () =>
  act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

const NINTH = plainDate(2026, 9, 9);

const root = () =>
  document.querySelector('[data-ui="date-picker"][data-part="root"]') as HTMLElement;
const trigger = () => document.querySelector('[data-part="trigger"]') as HTMLButtonElement;
const surface = () => document.querySelector('[data-part="content"]');
const dayFor = (number: number) =>
  [...document.querySelectorAll('[data-part="day"]')].find(
    (element) =>
      element.textContent === String(number) &&
      element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') === false,
  ) as HTMLElement;

const open = () => {
  fireEvent.click(trigger());
};

describe('what it is made of', () => {
  /**
   * It composes the other two families and redraws neither. A second segmented
   * field or a second month grid would be two places to fix one defect.
   */
  it('renders the field and the calendar, each keeping its own identifier', () => {
    render(<DatePicker defaultOpen defaultValue={NINTH} locale="pt-BR" />);

    expect(document.querySelector('[data-ui="date-field"]')).toBeInTheDocument();
    expect(document.querySelector('[data-ui="calendar"]')).toBeInTheDocument();
    expect(root()).toHaveAttribute('data-ui', contract.ui);
  });

  it('declares every part the contract names', () => {
    render(
      <DatePicker
        defaultOpen
        defaultValue={NINTH}
        footer={<button type="button">Apply</button>}
        locale="pt-BR"
        presets={<button type="button">Today</button>}
      />,
    );

    const present = [...document.querySelectorAll('[data-ui="date-picker"] [data-part]')].map(
      (element) => (element as HTMLElement).dataset['part'],
    );
    for (const part of ['control', 'trigger', 'content', 'presets', 'footer']) {
      expect(present).toContain(part);
    }
  });

  it('carries the dialog role and points the trigger at it while it is open', () => {
    render(<DatePicker defaultOpen defaultValue={NINTH} locale="pt-BR" />);

    expect(surface()).toHaveAttribute('role', 'dialog');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger().getAttribute('aria-controls')).toBe(surface()?.id);
  });
});

describe('what the trigger says', () => {
  /**
   * Focus returns here when the surface closes, so the name is where the reader
   * is told what was chosen. The APG names it as an accessibility feature.
   */
  it('names itself for choosing while nothing is chosen', () => {
    render(<DatePicker locale="pt-BR" messages={{ choose: 'Escolher uma data' }} />);
    expect(trigger()).toHaveAttribute('aria-label', 'Escolher uma data');
  });

  it('carries the chosen date in words once there is one', () => {
    render(
      <DatePicker
        defaultValue={NINTH}
        locale="pt-BR"
        messages={{ change: 'Alterar a data, {date}' }}
      />,
    );
    expect(trigger().getAttribute('aria-label')).toContain('Alterar a data, ');
    expect(trigger().getAttribute('aria-label')).toContain('setembro');
  });

  /** The mark is a `Glyph` element inside an `Icon` box, never a mask. */
  it('draws the calendar as a glyph element', () => {
    render(<DatePicker locale="pt-BR" />);
    const mark = trigger().querySelector("[data-ui='icon'] > svg[data-glyph]");
    expect(mark).toHaveAttribute('data-glyph', 'calendar');
  });
});

describe('opening and closing', () => {
  it('opens and closes from the trigger', () => {
    const onOpenChange = vi.fn();
    render(<DatePicker locale="pt-BR" onOpenChange={onOpenChange} />);

    expect(surface()).toBeNull();
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
  });

  /**
   * Angular Material records the platform note this inherits: ChromeOS turns
   * the chord into PageDown before the browser sees it, so the button is the
   * guaranteed path and this is only a shortcut.
   */
  it('opens from the field with the chord, and never depends on it', () => {
    render(<DatePicker locale="pt-BR" />);

    const segment = screen.getAllByRole('spinbutton')[0] as HTMLElement;
    fireEvent.keyDown(segment, { key: 'ArrowDown', altKey: true });
    expect(surface()).toBeInTheDocument();
    expect(trigger()).toBeInTheDocument();
  });

  it('marks the root while the surface is showing', () => {
    render(<DatePicker locale="pt-BR" />);
    expect(root()).not.toHaveAttribute('data-open');
    open();
    expect(root()).toHaveAttribute('data-open');
  });

  it('says which presentation the surface is in', () => {
    render(<DatePicker defaultOpen locale="pt-BR" />);
    expect(document.querySelector('[data-part="positioner"]')).toHaveAttribute(
      'data-presentation',
      'popover',
    );
  });
});

describe('choosing a date', () => {
  it('writes the date into the field and closes, for one date', () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <DatePicker
        defaultOpen
        defaultValue={NINTH}
        locale="pt-BR"
        name="data"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(dayFor(17));

    expect(onValueChange).toHaveBeenLastCalledWith(
      plainDate(2026, 9, 17),
      expect.objectContaining({ reason: 'pointer' }),
    );
    /* The layer is allowed to animate out, so the state is the observable and
       the node is not. */
    expect(root()).not.toHaveAttribute('data-open');
    expect(container.querySelector<HTMLInputElement>('[data-part="hidden-input"]')?.value).toBe(
      toISODate(plainDate(2026, 9, 17)),
    );
  });

  /** Closing on the first press of a range is a trap: the second needs the same surface. */
  it('stays open for a range', () => {
    render(<DatePicker defaultOpen locale="pt-BR" selectionMode="range" />);

    fireEvent.click(dayFor(7));
    expect(surface()).toBeInTheDocument();

    fireEvent.click(dayFor(11));
    expect(surface()).toBeInTheDocument();
  });

  it('takes the axis over the default when a product asks', () => {
    render(<DatePicker closeOnSelect="never" defaultOpen defaultValue={NINTH} locale="pt-BR" />);

    fireEvent.click(dayFor(17));
    expect(surface()).toBeInTheDocument();
  });

  it('returns to its default value when its form is reset', () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <form>
        <DatePicker
          defaultOpen
          defaultValue={NINTH}
          locale="pt-BR"
          name="data"
          onValueChange={onValueChange}
        />
      </form>,
    );
    const hidden = () => container.querySelector<HTMLInputElement>('[data-part="hidden-input"]');

    fireEvent.click(dayFor(17));
    expect(hidden()?.value).toBe(toISODate(plainDate(2026, 9, 17)));

    act(() => container.querySelector('form')?.reset());

    expect(hidden()?.value).toBe(toISODate(NINTH));
    expect(onValueChange).toHaveBeenLastCalledWith(
      NINTH,
      expect.objectContaining({ reason: 'programmatic' }),
    );
  });
});

describe('the keyboard', () => {
  it('closes on Escape and returns focus to the trigger', () => {
    const onOpenChange = vi.fn();
    render(
      <DatePicker defaultOpen defaultValue={NINTH} locale="pt-BR" onOpenChange={onOpenChange} />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'escape' }),
    );
    expect(trigger()).toHaveFocus();
  });

  /**
   * `dismissable-layer` asks in the capture phase, so a handler inside the
   * surface is too late. The family decides there instead and simply does not
   * ask the layer to close.
   */
  it('walks the calendar down a view before it closes', () => {
    render(<DatePicker defaultOpen defaultValue={NINTH} defaultView="year" locale="pt-BR" />);
    const calendar = document.querySelector('[data-ui="calendar"]') as HTMLElement;

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(calendar).toHaveAttribute('data-view', 'month');
    expect(surface()).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(calendar).toHaveAttribute('data-view', 'day');
    expect(surface()).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(root()).not.toHaveAttribute('data-open');
  });
});

describe('what the field around it says', () => {
  it('takes the trigger out while it is disabled', () => {
    render(<DatePicker defaultValue={NINTH} disabled locale="pt-BR" />);
    expect(trigger()).toBeDisabled();
    expect(root()).toHaveAttribute('data-disabled');
  });

  it('takes the trigger out while it is read-only', () => {
    render(<DatePicker defaultValue={NINTH} locale="pt-BR" readOnly />);
    expect(trigger()).toBeDisabled();
    expect(root()).toHaveAttribute('data-readonly');
  });

  it('states its own invalidity when the value is outside the bounds', () => {
    render(<DatePicker defaultValue={plainDate(2026, 1, 1)} locale="pt-BR" min={NINTH} />);
    expect(root()).toHaveAttribute('data-invalid');
  });
});

describe('what an application sets once', () => {
  it('takes the appearance from a provider and the locale from the language in force', () => {
    render(
      <SlottedProvider locale="ja-JP">
        <DatePickerDefaultsProvider size="lg">
          <DatePicker />
        </DatePickerDefaultsProvider>
      </SlottedProvider>,
    );

    expect(screen.getAllByRole('spinbutton').map((element) => element.dataset['field'])).toEqual([
      'year',
      'month',
      'day',
    ]);
    expect(root()).toHaveAttribute('data-size', 'lg');
    expect(trigger()).toHaveAttribute('aria-label', 'Choose date');
  });

  it('changes its words and its date together with the language in force', () => {
    const inLocale = (locale: string) => (
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
        <DatePicker defaultValue={NINTH} />
      </SlottedProvider>
    );
    const { rerender } = render(inLocale('pt-BR'));

    expect(trigger().getAttribute('aria-label')).toMatch(/^Alterar data, .*setembro de 2026/);

    rerender(inLocale('en-US'));
    expect(trigger().getAttribute('aria-label')).toMatch(/^Change date, .*September 9, 2026/);
  });
});

describe('the composition surface', () => {
  it('hands the consumer a handle for what a prop cannot express', () => {
    let handle: DatePickerHandle | null = null;
    render(
      <DatePicker
        defaultValue={NINTH}
        locale="pt-BR"
        ref={(instance) => {
          handle = instance;
        }}
      />,
    );

    act(() => (handle as DatePickerHandle | null)?.open());
    expect(surface()).toBeInTheDocument();

    act(() => (handle as DatePickerHandle | null)?.close());
    expect(root()).not.toHaveAttribute('data-open');

    act(() => (handle as DatePickerHandle | null)?.focus());
    expect(screen.getAllByRole('spinbutton')[0]).toHaveFocus();
  });

  it('substitutes the element the root renders', () => {
    const { container } = render(
      <DatePicker defaultValue={NINTH} locale="pt-BR" render={(props) => <section {...props} />} />,
    );
    expect(container.querySelector('section[data-ui="date-picker"]')).toBeInTheDocument();
  });

  it('takes the consumer’s own slots into the surface', () => {
    render(
      <DatePicker
        defaultOpen
        footer={<button type="button">Apply</button>}
        locale="pt-BR"
        presets={<button type="button">Today</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
  });
});

describe('where focus and the page go when it opens', () => {
  it('opens on the month of a controlled value', () => {
    render(<DatePicker defaultOpen locale="en-US" value={plainDate(2024, 3, 15)} />);

    expect(document.querySelector('[data-part="heading"]')?.textContent).toContain('March 2024');
  });

  it('moves focus to the chosen day when the trigger opens it', async () => {
    render(<DatePicker defaultValue={NINTH} locale="en-US" />);

    open();

    await nextFrame();

    expect(document.activeElement?.getAttribute('data-part')).toBe('day');
    expect(document.activeElement?.textContent).toBe('9');
  });

  it('leaves focus alone when it is rendered open', () => {
    render(<DatePicker defaultOpen defaultValue={NINTH} locale="en-US" />);

    expect(document.activeElement).toBe(document.body);
  });

  it('keeps Tab inside the surface while it is open', () => {
    render(
      <DatePicker
        defaultOpen
        defaultValue={NINTH}
        footer={<button type="button">Done</button>}
        locale="en-US"
        presets={<button type="button">Today</button>}
      />,
    );
    const first = screen.getByRole('button', { name: 'Today' });
    const last = screen.getByRole('button', { name: 'Done' });

    act(() => last.focus());
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();

    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });
});

describe('inside a field', () => {
  it('registers as the field’s control, so the field does not warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <Field>
        <FieldLabel>Ship date</FieldLabel>
        <DatePicker locale="en-US" />
      </Field>,
    );

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('without a control'));
    warn.mockRestore();
  });
});

/**
 * A card statement, a budget month: the form asks for a month and no day. The
 * calendar opens on the months of a year, a month cell is the choice, the
 * field shows only the month and the year, and the form submits "YYYY-MM".
 */
describe('month granularity', () => {
  it('chooses a month cell and reports the month, and submits YYYY-MM', () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <form>
        <DatePicker
          defaultValue={plainYearMonth(2026, 10)}
          granularity="month"
          locale="en-US"
          name="statement"
          onValueChange={onValueChange}
        />
      </form>,
    );

    const segments = [...container.querySelectorAll('[data-part="segment"]')].map((segment) =>
      segment.getAttribute('data-field'),
    );
    expect(segments).toEqual(['month', 'year']);
    const hidden = () =>
      container.querySelector<HTMLInputElement>('[data-part="hidden-input"]')?.value;
    expect(hidden()).toBe('2026-10');

    open();
    expect(document.querySelector('[data-ui="calendar"]')).toHaveAttribute('data-view', 'month');
    expect(document.querySelector('[data-part="grid"]')).toBeNull();
    const november = screen.getByRole('button', { name: 'November 2026' });
    expect(screen.getByRole('button', { name: 'October 2026' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    fireEvent.click(november);

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]?.[0]).toEqual({ year: 2026, month: 11 });
    expect(hidden()).toBe('2026-11');
    expect(root()).not.toHaveAttribute('data-open');
  });

  it('refuses a month outside min and max, which are months', () => {
    render(
      <DatePicker
        defaultOpen
        defaultValue={plainYearMonth(2026, 10)}
        granularity="month"
        locale="en-US"
        max={plainYearMonth(2026, 11)}
        min={plainYearMonth(2026, 3)}
      />,
    );

    expect(screen.getByRole('button', { name: 'February 2026' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'November 2026' })).not.toHaveAttribute(
      'aria-disabled',
    );
    expect(screen.getByRole('button', { name: 'December 2026' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('moves the month with the arrow keys and chooses it with Enter', async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        defaultValue={plainYearMonth(2026, 10)}
        granularity="month"
        locale="en-US"
        onValueChange={onValueChange}
      />,
    );
    open();
    await nextFrame();
    const october = screen.getByRole('button', { name: 'October 2026' });
    expect(document.activeElement).toBe(october);

    fireEvent.keyDown(october, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'November 2026' }));
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowDown' });
    fireEvent.keyDown(document.activeElement as Element, { key: 'Enter' });

    expect(onValueChange.mock.calls[0]?.[0]).toEqual({ year: 2027, month: 3 });
  });

  it('names the paging buttons for the year they step, and pages a year back', () => {
    render(
      <DatePicker
        defaultOpen
        defaultValue={plainYearMonth(2026, 10)}
        granularity="month"
        locale="en-US"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Previous month' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Next year' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous year' }));

    expect(screen.getByRole('button', { name: 'October 2025' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'October 2026' })).toBeNull();
  });
});

/**
 * A segment is named for the unit it holds, in the language in force. The
 * placeholder ("mm", "dd", "yyyy") is drawn and never spoken: "mm, October"
 * was what a screen reader announced.
 */
describe('what each segment is called', () => {
  const names = () =>
    screen.getAllByRole('spinbutton').map((segment) => segment.getAttribute('aria-label'));
  const inLocale = (locale: string, granularity: 'day' | 'month') => (
    <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
      <Field>
        <FieldLabel>Date</FieldLabel>
        {granularity === 'month' ? (
          <DatePicker defaultValue={plainYearMonth(2026, 10)} granularity="month" />
        ) : (
          <DatePicker defaultValue={plainDate(2026, 10, 3)} />
        )}
      </Field>
    </SlottedProvider>
  );

  it.each([
    ['en-US', 'day', ['month', 'day', 'year']],
    ['en-US', 'month', ['month', 'year']],
    // language: pt-BR
    ['pt-BR', 'day', ['dia', 'mês', 'ano']],
    ['pt-BR', 'month', ['mês', 'ano']],
    // language: en-US
  ] as const)('in %s at %s granularity', (locale, granularity, expected) => {
    render(inLocale(locale, granularity));

    expect(names()).toEqual(expected);
    for (const [index, segment] of screen.getAllByRole('spinbutton').entries()) {
      expect(segment).toHaveAccessibleName(expected[index]);
    }
  });
});
