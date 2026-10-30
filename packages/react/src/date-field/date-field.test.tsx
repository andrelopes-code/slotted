import { plainDate, toISODate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { DateField, DateFieldDefaultsProvider } from './index';
import type { DateFieldChangeRequest, DateFieldHandle } from './index';

const NINTH = plainDate(2026, 9, 9);

const segments = () => screen.getAllByRole('spinbutton');
const segmentFor = (field: 'day' | 'month' | 'year') =>
  segments().find((element) => element.dataset['field'] === field) as HTMLElement;

/**
 * Moving focus is what ends a run of typed digits, so it has to be flushed
 * before the next assertion: React batches the state a `focus` event produces,
 * and a bare `element.focus()` is outside anything that would flush it.
 */
const focusOn = (field: 'day' | 'month' | 'year') => {
  act(() => segmentFor(field).focus());
};

const text = () => segments().map((element) => element.textContent);

/** A key press on whatever holds focus, which is how a spin button is driven. */
const press = (key: string) => {
  const target = document.activeElement ?? document.body;
  fireEvent.keyDown(target, { key });
};

/** A run of digits, one key at a time, so the advance between them is real. */
const typeDigits = (digits: string) => {
  for (const digit of digits) press(digit);
};

const paste = (value: string) => {
  fireEvent.paste(screen.getByRole('group'), {
    clipboardData: { getData: () => value },
  });
};

describe('the shape the pattern asks for', () => {
  /**
   * The APG's spin-button example: three buttons inside a group whose name is
   * the whole date, so the reader perceives it without visiting all three.
   */
  it('wraps three spin buttons in a group named by the whole date', () => {
    render(<DateField aria-label="Vencimento" defaultValue={NINTH} locale="pt-BR" />);

    expect(segments()).toHaveLength(3);
    expect(screen.getByRole('group')).toBeInTheDocument();
    for (const element of segments()) {
      expect(element).toHaveAttribute('aria-valuemin');
      expect(element).toHaveAttribute('aria-valuemax');
    }
  });

  it('announces a month by name rather than by number', () => {
    render(<DateField aria-label="Vencimento" defaultValue={NINTH} locale="pt-BR" />);
    expect(segmentFor('month')).toHaveAttribute('aria-valuetext', 'setembro');
    expect(segmentFor('day')).toHaveAttribute('aria-valuetext', '9');
  });

  /**
   * The field order is the locale's, taken from `Intl`, not a constant. Two of
   * the seven surveyed implementations get this from a format string the
   * consumer writes; here nobody writes one.
   */
  it('orders and separates the fields the way the locale writes them', () => {
    const { unmount } = render(<DateField aria-label="Data" defaultValue={NINTH} locale="pt-BR" />);
    expect(segments().map((element) => element.dataset['field'])).toEqual(['day', 'month', 'year']);
    unmount();

    render(<DateField aria-label="Date" defaultValue={NINTH} locale="en-US" />);
    expect(segments().map((element) => element.dataset['field'])).toEqual(['month', 'day', 'year']);
  });

  it('writes the placeholder in the reader’s own language', () => {
    render(<DateField aria-label="Data" locale="pt-BR" />);
    expect(text()).toEqual(['dd', 'mm', 'aaaa']);
  });

  /** Exactly one segment is in the tab sequence, which is the roving model. */
  it('keeps one segment in the tab sequence', () => {
    render(<DateField aria-label="Data" defaultValue={NINTH} locale="pt-BR" />);
    const inSequence = segments().filter((element) => element.tabIndex === 0);
    expect(inSequence).toHaveLength(1);
  });
});

describe('the keyboard the pattern lists', () => {
  it('steps a segment and wraps inside it, without carrying', () => {
    render(<DateField aria-label="Data" defaultValue={plainDate(2026, 12, 9)} locale="pt-BR" />);

    focusOn('month');
    press('ArrowUp');

    expect(segmentFor('month').textContent).toBe('01');
    expect(segmentFor('year').textContent).toBe('2026');
  });

  it('pages the day and the month by five, and the year by ten', () => {
    render(<DateField aria-label="Data" defaultValue={NINTH} locale="pt-BR" />);

    focusOn('day');
    press('PageUp');
    expect(segmentFor('day').textContent).toBe('14');

    focusOn('year');
    press('PageUp');
    expect(segmentFor('year').textContent).toBe('2036');
  });

  it('goes to the ends of a segment, and the day knows its own month', () => {
    render(<DateField aria-label="Data" defaultValue={plainDate(2026, 2, 9)} locale="pt-BR" />);

    focusOn('day');
    press('End');
    expect(segmentFor('day').textContent).toBe('28');

    press('Home');
    expect(segmentFor('day').textContent).toBe('01');
  });

  it('walks between segments in the writing order', () => {
    render(<DateField aria-label="Data" defaultValue={NINTH} locale="pt-BR" />);

    focusOn('day');
    press('ArrowRight');
    expect(segmentFor('month')).toHaveFocus();

    press('ArrowLeft');
    expect(segmentFor('day')).toHaveFocus();
  });

  /**
   * `03` needs no wait and `30` is not a month, so the run ends as soon as no
   * further digit could fit under the maximum — and focus goes on.
   */
  it('advances when the segment can hold no further digit', () => {
    render(<DateField aria-label="Data" locale="pt-BR" />);

    /* `3` in a month can only be March: `30` is not a month, so the run ends
       on one digit and focus goes on. */
    focusOn('month');
    typeDigits('3');
    expect(segmentFor('month').textContent).toBe('03');
    expect(segmentFor('year')).toHaveFocus();
  });

  /**
   * The same digit in a day waits, because `30` and `31` are both still
   * reachable. The rule is arithmetic rather than a table, and this is the
   * pair that shows it.
   */
  it('waits in a day where it advances in a month', () => {
    render(<DateField aria-label="Data" locale="pt-BR" />);

    focusOn('day');
    typeDigits('3');
    /* One digit typed, so one digit shown: a run is not padded until it ends,
       because a year on its way to 2026 read `0002` when it was. */
    expect(segmentFor('day').textContent).toBe('3');
    expect(segmentFor('day')).toHaveFocus();

    /* `30` fits the month the empty field is measured against; `31` would not,
       and would start a new run — which is the same arithmetic, one day over. */
    typeDigits('0');
    expect(segmentFor('day').textContent).toBe('30');
  });

  it('pads a field once its run has ended', () => {
    render(<DateField aria-label="Data" locale="pt-BR" />);

    focusOn('day');
    typeDigits('3');
    expect(segmentFor('day').textContent).toBe('3');

    /* Leaving the field ends the run, and the column takes its place back. */
    focusOn('month');
    expect(segmentFor('day').textContent).toBe('03');
  });

  it('takes two digits when the first one leaves room', () => {
    render(<DateField aria-label="Data" locale="pt-BR" />);

    focusOn('day');
    typeDigits('12');
    expect(segmentFor('day').textContent).toBe('12');
    expect(segmentFor('month')).toHaveFocus();
  });

  it('empties one segment without touching the others', () => {
    render(<DateField aria-label="Data" defaultValue={NINTH} locale="pt-BR" />);

    focusOn('month');
    press('Backspace');

    expect(text()).toEqual(['09', 'mm', '2026']);
  });
});

describe('the value the segments make', () => {
  /**
   * The gap the inventory names. Every surveyed segmented field holds a whole
   * date or nothing, so a day and a month with no year is a state none of them
   * can express — and the request carries the segments so a consumer can.
   */
  it('is null until every segment is filled, and says so with the segments', () => {
    const onValueChange =
      vi.fn<(value: PlainDate | null, request: DateFieldChangeRequest) => void>();
    render(<DateField aria-label="Data" locale="pt-BR" onValueChange={onValueChange} />);

    focusOn('day');
    typeDigits('09');
    expect(onValueChange).not.toHaveBeenCalled();

    typeDigits('092026');
    /* One request, at the end of the run that filled the year: the value
       passed through the years 2, 20 and 202 and told nobody. */
    expect(onValueChange).toHaveBeenCalledTimes(1);
    const [value, request] = onValueChange.mock.calls[0] as [
      PlainDate | null,
      DateFieldChangeRequest,
    ];
    expect(value).toEqual(NINTH);
    expect(request.segments.day).toBe(9);
    expect(request.reason).toBe('keyboard');
  });

  it('posts the ISO string a plain form reads', () => {
    const { container } = render(<DateField aria-label="Data" locale="pt-BR" name="vencimento" />);
    const hidden = container.querySelector<HTMLInputElement>('[data-part="hidden-input"]');

    expect(hidden?.value).toBe('');
    focusOn('day');
    typeDigits('09092026');
    expect(hidden?.value).toBe(toISODate(NINTH));
    expect(hidden?.name).toBe('vencimento');
  });

  it('lets the consumer refuse a change before it commits', () => {
    render(
      <DateField
        aria-label="Data"
        defaultValue={NINTH}
        locale="pt-BR"
        onValueChange={(_value, request) => request.cancel()}
      />,
    );

    focusOn('day');
    press('ArrowUp');
    /* The segment still shows what the reader typed — the control is not
       lying about its own display — and the value did not move. */
    expect(segmentFor('day').textContent).toBe('10');
  });

  it('follows a controlled value and never moves it itself', () => {
    function Controlled() {
      const [value] = useState<PlainDate | null>(NINTH);
      return <DateField aria-label="Data" locale="pt-BR" value={value} />;
    }

    render(<Controlled />);
    focusOn('day');
    press('ArrowUp');
    /* The consumer never wrote a new value back, so the date is unchanged the
       next time it is read. */
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  /**
   * The behavior no surveyed implementation has: 31 January stepped forward
   * is 28 February, and stepped forward again it is 31 March rather than the
   * 28th.
   */
  it('gives back the day a short month could not hold', () => {
    render(<DateField aria-label="Data" defaultValue={plainDate(2026, 1, 31)} locale="pt-BR" />);

    focusOn('month');
    press('ArrowUp');
    expect(text()).toEqual(['28', '02', '2026']);

    press('ArrowUp');
    expect(text()).toEqual(['31', '03', '2026']);
  });

  it('reads a pasted date in the locale shape, then in ISO 8601', () => {
    render(<DateField aria-label="Data" locale="pt-BR" />);

    focusOn('day');
    paste('09/09/2026');
    expect(text()).toEqual(['09', '09', '2026']);

    press('Backspace');
    paste('2026-12-25');
    expect(text()).toEqual(['25', '12', '2026']);
  });

  it('resolves a two-digit year through the stated pivot', () => {
    render(<DateField aria-label="Data" locale="pt-BR" />);

    focusOn('day');
    typeDigits('0909');
    focusOn('year');
    typeDigits('26');
    focusOn('day');

    expect(segmentFor('year').textContent).toBe('2026');
  });
});

describe('the pointer', () => {
  /**
   * A press that landed on the frame's own padding did nothing at all, and the
   * pointer over it was an arrow — the reader saw a control that looked like a
   * text field and answered like a picture.
   */
  it('takes a press on the frame to the first field still waiting', () => {
    const { container } = render(<DateField aria-label="Data" locale="pt-BR" />);
    const root = container.querySelector('[data-ui="date-field"]') as HTMLElement;

    fireEvent.mouseDown(root);
    expect(segmentFor('day')).toHaveFocus();
  });

  it('takes it to the first empty field when the others are filled', () => {
    render(<DateField aria-label="Data" locale="pt-BR" />);

    focusOn('day');
    typeDigits('0909');
    /* The day and the month are filled; the year is the one still waiting. */
    fireEvent.mouseDown(screen.getByRole('group'));
    expect(segmentFor('year')).toHaveFocus();
  });

  it('leaves a press on the clear button to the clear button', () => {
    render(
      <DateField
        aria-label="Data"
        clearable
        messages={{ clear: 'Limpar' }}
        defaultValue={NINTH}
        locale="pt-BR"
      />,
    );

    const button = screen.getByRole('button', { name: 'Limpar' });
    expect(button.querySelector('svg[data-glyph]')).toHaveAttribute('data-glyph', 'x');
    fireEvent.mouseDown(button);
    expect(segmentFor('day')).not.toHaveFocus();
  });

  it('takes a press on one field to that field', () => {
    render(<DateField aria-label="Data" defaultValue={NINTH} locale="pt-BR" />);

    fireEvent.mouseDown(segmentFor('year'));
    expect(segmentFor('year')).toHaveFocus();
  });
});

describe('what the field around it says', () => {
  it('takes disabled, readonly, invalid and required from the field', () => {
    const { container } = render(
      <Field disabled invalid required>
        <FieldLabel>Vencimento</FieldLabel>
        <DateField locale="pt-BR" />
      </Field>,
    );

    const root = container.querySelector('[data-ui="date-field"]');
    expect(root).toHaveAttribute('data-disabled');
    expect(root).toHaveAttribute('data-invalid');
    expect(root).toHaveAttribute('data-required');
  });

  it('states its own invalidity when the value is outside the bounds', () => {
    const { container } = render(
      <DateField
        aria-label="Data"
        defaultValue={plainDate(2026, 1, 1)}
        locale="pt-BR"
        min={NINTH}
      />,
    );
    expect(container.querySelector('[data-ui="date-field"]')).toHaveAttribute('data-invalid');
  });

  it('states its own invalidity when the predicate refuses the date', () => {
    const { container } = render(
      <DateField
        aria-label="Data"
        defaultValue={NINTH}
        isDateUnavailable={(date) => date.day === 9}
        locale="pt-BR"
      />,
    );
    expect(container.querySelector('[data-ui="date-field"]')).toHaveAttribute('data-invalid');
  });
});

describe('what an application sets once', () => {
  it('takes the appearance from a provider and the locale from the language in force', () => {
    const { container } = render(
      <SlottedProvider locale="ja-JP">
        <DateFieldDefaultsProvider size="lg" variant="subtle">
          <DateField aria-label="Date" defaultValue={NINTH} />
        </DateFieldDefaultsProvider>
      </SlottedProvider>,
    );

    expect(segments().map((element) => element.dataset['field'])).toEqual(['year', 'month', 'day']);
    const root = container.querySelector('[data-ui="date-field"]');
    expect(root).toHaveAttribute('data-size', 'lg');
    expect(root).toHaveAttribute('data-variant', 'subtle');
  });

  it('lets one control outrank the language in force', () => {
    const { container } = render(
      <SlottedProvider locale="ja-JP">
        <DateField aria-label="Data" defaultValue={NINTH} locale="pt-BR" />
      </SlottedProvider>,
    );

    expect(segments().map((element) => element.dataset['field'])).toEqual(['day', 'month', 'year']);
    expect(container.querySelector('[data-ui="date-field"]')).toBeInTheDocument();
  });

  it('changes its words and its date order together with the language in force', () => {
    const inLocale = (locale: string) => (
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
        <DateField aria-label="Data" clearable defaultValue={NINTH} />
      </SlottedProvider>
    );
    const { rerender } = render(inLocale('pt-BR'));

    expect(screen.getByRole('button', { name: 'Limpar' })).toBeInTheDocument();
    expect(segments().map((element) => element.dataset['field'])).toEqual(['day', 'month', 'year']);

    rerender(inLocale('en-US'));
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(segments().map((element) => element.dataset['field'])).toEqual(['month', 'day', 'year']);
  });
});

describe('the composition surface', () => {
  it('clears from the button and from the handle, with the clear reason', () => {
    const onValueChange = vi.fn();
    render(
      <DateField
        aria-label="Data"
        clearable
        messages={{ clear: 'Limpar' }}
        defaultValue={NINTH}
        locale="pt-BR"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));
    expect(text()).toEqual(['dd', 'mm', 'aaaa']);
    expect(onValueChange).toHaveBeenCalledWith(null, expect.objectContaining({ reason: 'clear' }));
  });

  it('hands the consumer a handle for what a prop cannot express', () => {
    let handle: DateFieldHandle | null = null;
    render(
      <DateField
        aria-label="Data"
        defaultValue={NINTH}
        locale="pt-BR"
        ref={(instance) => {
          handle = instance;
        }}
      />,
    );

    act(() => (handle as DateFieldHandle | null)?.focus());
    expect(segmentFor('day')).toHaveFocus();

    act(() => (handle as DateFieldHandle | null)?.clear());
    expect(text()).toEqual(['dd', 'mm', 'aaaa']);
  });

  it('runs the consumer’s own key handler as well as its own', () => {
    const onKeyDown = vi.fn();
    render(
      <DateField aria-label="Data" defaultValue={NINTH} locale="pt-BR" onKeyDown={onKeyDown} />,
    );

    focusOn('day');
    press('ArrowUp');

    expect(onKeyDown).toHaveBeenCalled();
    expect(segmentFor('day').textContent).toBe('10');
  });

  it('lets the consumer stop the family from acting at all', () => {
    render(
      <DateField
        aria-label="Data"
        defaultValue={NINTH}
        locale="pt-BR"
        onKeyDown={(event) => event.preventDefault()}
      />,
    );

    focusOn('day');
    press('ArrowUp');
    expect(segmentFor('day').textContent).toBe('09');
  });

  it('substitutes the element the frame renders', () => {
    const { container } = render(
      <DateField
        aria-label="Data"
        defaultValue={NINTH}
        locale="pt-BR"
        render={(props) => <section {...props} />}
      />,
    );

    expect(container.querySelector('section[data-ui="date-field"]')).toBeInTheDocument();
  });

  it('passes a native attribute through to the element that owns it', () => {
    const { container } = render(
      <DateField aria-label="Data" data-testid="vencimento" defaultValue={NINTH} locale="pt-BR" />,
    );
    expect(container.querySelector('[data-testid="vencimento"]')).toHaveAttribute(
      'data-ui',
      'date-field',
    );
  });
});

describe('what a reader who cannot see it is told', () => {
  it('does not answer keys while it is read-only', () => {
    render(<DateField aria-label="Data" defaultValue={NINTH} locale="pt-BR" readOnly />);

    focusOn('day');
    press('ArrowUp');
    expect(segmentFor('day').textContent).toBe('09');
  });

  it('still walks between segments while it is read-only', () => {
    render(<DateField aria-label="Data" defaultValue={NINTH} locale="pt-BR" readOnly />);

    focusOn('day');
    press('ArrowRight');
    expect(segmentFor('month')).toHaveFocus();
  });

  it('takes every segment out of the tab sequence when it is disabled', () => {
    render(<DateField aria-label="Data" defaultValue={NINTH} disabled locale="pt-BR" />);
    for (const element of segments()) expect(element.tabIndex).toBe(-1);
  });
});
