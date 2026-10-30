import { plainDate, plainDateTime, plainTime, toISODateTime } from '@slotted/core/date';
import type { PlainDateTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { DateTimeField, DateTimeFieldDefaultsProvider } from './index';
import type { DateTimeFieldChangeRequest, DateTimeFieldHandle } from './index';

const TENTH = plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20));
/** Stated rather than read from the clock, so every assertion below is fixed. */
const REFERENCE = plainDateTime(plainDate(2026, 9, 10), plainTime(12, 0));

type Field_ = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'dayPeriod';

const segments = () => screen.getAllByRole('spinbutton');
const segmentFor = (field: Field_) =>
  segments().find((element) => element.dataset['field'] === field) as HTMLElement;

/**
 * Moving focus is what ends a run of typed digits, so it has to be flushed
 * before the next assertion: React batches the state a `focus` event produces,
 * and a bare `element.focus()` is outside anything that would flush it.
 */
const focusOn = (field: Field_) => {
  act(() => segmentFor(field).focus());
};

const text = () => segments().map((element) => element.textContent?.trim());

/** A key press on whatever holds focus, which is how a spin button is driven. */
const press = (key: string) => {
  const target = document.activeElement ?? document.body;
  fireEvent.keyDown(target, { key });
};

const typeDigits = (digits: string) => {
  for (const digit of digits) press(digit);
};

const root = () => document.querySelector('[data-ui="datetime-field"]') as HTMLElement;
const hidden = () =>
  document.querySelector('[data-part="hidden-input"]') as HTMLInputElement | null;

describe('anatomy', () => {
  /**
   * One frame, one group, seven spin buttons. The frame carries no role: the
   * APG's spin-button example names the group as the thing that tells a
   * screen-reader user that the buttons are one value.
   */
  it('draws one group holding every field the locale writes', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" value={TENTH} />);

    expect(root()).not.toHaveAttribute('role');
    expect(screen.getByRole('group')).toHaveAttribute('data-part', 'segments');
    expect(segments().map((element) => element.dataset['field'])).toEqual([
      'day',
      'month',
      'year',
      'hour',
      'minute',
    ]);
  });

  it('takes the order of the fields from the locale, both halves at once', () => {
    render(<DateTimeField aria-label="When" hourCycle={12} locale="en-US" value={TENTH} />);
    expect(segments().map((element) => element.dataset['field'])).toEqual([
      'month',
      'day',
      'year',
      'hour',
      'minute',
      'dayPeriod',
    ]);
  });

  /**
   * Each half is one box, and it is the only place the row is allowed to break.
   * Flexbox breaks a line between any two items and offers no way to forbid one
   * place, so the boundary has to be a box rather than a rule.
   */
  it('puts each half in its own box, with the boundary at the end of the first', () => {
    render(<DateTimeField aria-label="When" hourCycle={12} locale="en-US" value={TENTH} />);

    const halves = [...root().querySelectorAll('[data-part="half"]')];
    expect(halves.map((element) => element.getAttribute('data-half'))).toEqual(['date', 'time']);

    const boundary = root().querySelector('[data-part="literal"][data-boundary]');
    expect(boundary).not.toBeNull();
    expect(boundary?.textContent?.trim()).toBe(',');
    expect(boundary?.closest('[data-part="half"]')).toBe(halves[0]);
  });

  /**
   * A boundary the locale writes as whitespace alone is not drawn: the row's
   * own column gap already separates the halves, and a space beside that gap is
   * twice the distance the locale asked for.
   */
  it('draws no boundary where the locale writes only a space', () => {
    render(<DateTimeField aria-label="Quand" locale="fr-FR" value={TENTH} />);
    expect(root().querySelector('[data-part="literal"][data-boundary]')).toBeNull();
  });

  it('marks every segment with the half it belongs to', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" value={TENTH} />);
    const halves = segments().map((element) => element.dataset['half']);
    expect(halves).toEqual(['date', 'date', 'date', 'time', 'time']);
  });

  it('posts the whole value through a hidden input', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" name="quando" value={TENTH} />);
    expect(hidden()).toHaveValue(toISODateTime(TENTH));
  });
});

describe('typing', () => {
  /**
   * A digit that fills the last date segment advances into the first time
   * segment. Two nested fields would both stop at the boundary, which is the
   * third reason this family draws one row.
   */
  it('runs a typed value across the boundary between the halves', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" referenceDateTime={REFERENCE} />);

    focusOn('day');
    typeDigits('10');
    typeDigits('09');
    typeDigits('2026');
    /* The run has reached the hour without a key that moves focus. */
    expect(document.activeElement).toBe(segmentFor('hour'));
    typeDigits('15');
    typeDigits('20');

    expect(text()).toEqual(['10', '09', '2026', '15', '20']);
  });

  it('walks the arrows across the same boundary', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" value={TENTH} />);
    focusOn('year');
    press('ArrowRight');
    expect(document.activeElement).toBe(segmentFor('hour'));
    press('ArrowLeft');
    expect(document.activeElement).toBe(segmentFor('year'));
  });

  it('pages each field the way its own half already pages it', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" value={TENTH} />);

    focusOn('day');
    press('PageUp');
    expect(segmentFor('day').textContent?.trim()).toBe('15');

    focusOn('minute');
    press('PageUp');
    expect(segmentFor('minute').textContent?.trim()).toBe('35');
  });

  it('steps and bounds one segment at a time', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" value={TENTH} />);

    focusOn('hour');
    press('ArrowUp');
    expect(segmentFor('hour').textContent?.trim()).toBe('16');
    press('Home');
    expect(segmentFor('hour').textContent?.trim()).toBe('00');
    press('End');
    expect(segmentFor('hour').textContent?.trim()).toBe('23');
  });

  /**
   * Every application that binds a bare key guards it with "is the target an
   * editable element", and that guard tests for input, textarea and
   * contenteditable. A `div` with `role="spinbutton"` is none of the three.
   */
  it('stops a key it acted on rather than only defaulting it', () => {
    const outside = vi.fn();
    render(
      <div onKeyDown={outside}>
        <DateTimeField aria-label="Quando" locale="pt-BR" value={TENTH} />
      </div>,
    );
    focusOn('hour');
    press('ArrowUp');
    expect(outside).not.toHaveBeenCalled();
  });
});

describe('the missing half', () => {
  /**
   * `value` is null until both halves are whole, which every surveyed
   * implementation reports. *Which* half is missing is what none of them says.
   */
  it('says which half is missing, and stays quiet on an empty field', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" referenceDateTime={REFERENCE} />);
    expect(root()).not.toHaveAttribute('data-incomplete');

    focusOn('day');
    typeDigits('10');
    typeDigits('09');
    typeDigits('2026');
    act(() => segmentFor('hour').blur());

    expect(root()).toHaveAttribute('data-incomplete', 'time');
    expect(hidden()).toHaveValue('');
  });

  /**
   * A request for a value equal to the current one is not emitted — the rule
   * `docs/state-and-events.md` states — so a run that leaves the value null
   * says nothing on this channel and says it on the other two: the root and,
   * in Angular, the validator. A run that *unmakes* a whole value does emit,
   * and that request is where the segments and the missing half travel.
   */
  it('carries the segments and the missing half on the request', () => {
    const onValueChange = vi.fn();
    render(
      <DateTimeField
        aria-label="Quando"
        defaultValue={TENTH}
        locale="pt-BR"
        onValueChange={onValueChange}
      />,
    );

    focusOn('hour');
    press('Backspace');

    const request = onValueChange.mock.calls.at(-1)?.[1] as DateTimeFieldChangeRequest;
    expect(request.value).toBeNull();
    expect(request.segments.day).toBe(10);
    expect(request.segments.hour).toBeNull();
    expect(request.incomplete).toBe('time');
    /* The flag `time-field` raises is spent here: the day exists, so a crossing
       is the value rather than a fact beside it. */
    expect(request).not.toHaveProperty('crossesMidnight');
  });
});

describe('the relative expression', () => {
  const openExpression = () => {
    focusOn('day');
    press('+');
  };

  it('replaces the segments with one expression region', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" referenceDateTime={REFERENCE} />);
    openExpression();

    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
    expect(root()).toHaveAttribute('data-relative');
    expect(root().querySelector('[data-part="duration"]')).not.toBeNull();
  });

  /**
   * `+2d` moves the day, which is what it is for — and it is where
   * `time-field`'s `crossesMidnight` flag is finally spent.
   */
  it('resolves days and weeks, and says so when the day moved', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" referenceDateTime={REFERENCE} />);
    openExpression();

    const input = root().querySelector('[data-part="duration"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '+2d' } });

    const preview = root().querySelector('[data-part="preview"]') as HTMLElement;
    expect(preview).toHaveAttribute('data-resolved');
    expect(preview).toHaveAttribute('data-rolls-day');
    expect(preview.querySelector('[data-part="preview-date"]')).not.toBeNull();
    /* The chevron is the glyph element, marked to turn in a right-to-left context. */
    expect(preview.querySelector('[data-ui="icon"]')).toHaveAttribute('data-directional');
    expect(preview.querySelector('svg[data-glyph]')).toHaveAttribute('data-glyph', 'chevron-right');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(hidden()).toHaveValue('2026-09-12T12:00:00');
  });

  it('leaves the day alone when the duration stays inside it', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" referenceDateTime={REFERENCE} />);
    openExpression();

    const input = root().querySelector('[data-part="duration"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '+40m' } });
    expect(root().querySelector('[data-part="preview"]')).not.toHaveAttribute('data-rolls-day');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(hidden()).toHaveValue('2026-09-10T12:40:00');
  });

  it('abandons the expression whole on Escape', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" value={TENTH} />);
    openExpression();

    const input = root().querySelector('[data-part="duration"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '+2d' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(root()).not.toHaveAttribute('data-relative');
    expect(text()).toEqual(['10', '09', '2026', '15', '20']);
  });

  it('is removed by relative={false}', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" relative={false} value={TENTH} />);
    openExpression();
    expect(root()).not.toHaveAttribute('data-relative');
  });
});

describe('bounds', () => {
  /**
   * Both pairs apply at once, which MUI's own validation page records that it
   * cannot do: "you cannot use `maxDateTime` and `maxTime` together."
   */
  it('reports a value the whole-value bound refuses', () => {
    render(
      <DateTimeField
        aria-label="Quando"
        locale="pt-BR"
        min={plainDateTime(plainDate(2026, 9, 11), plainTime(9, 0))}
        value={TENTH}
      />,
    );
    expect(root()).toHaveAttribute('data-invalid');
  });

  it('reports a value the per-day window refuses, inside the range', () => {
    render(
      <DateTimeField
        aria-label="Quando"
        locale="pt-BR"
        max={plainDateTime(plainDate(2026, 9, 30), plainTime(23, 0))}
        maxTime={plainTime(14, 0)}
        min={plainDateTime(plainDate(2026, 9, 1), plainTime(0, 0))}
        value={TENTH}
      />,
    );
    expect(root()).toHaveAttribute('data-invalid');
  });

  it('accepts a value both pairs allow', () => {
    render(
      <DateTimeField
        aria-label="Quando"
        locale="pt-BR"
        max={plainDateTime(plainDate(2026, 9, 30), plainTime(23, 0))}
        maxTime={plainTime(18, 0)}
        min={plainDateTime(plainDate(2026, 9, 1), plainTime(0, 0))}
        minTime={plainTime(9, 0)}
        value={TENTH}
      />,
    );
    expect(root()).not.toHaveAttribute('data-invalid');
  });

  it('reports a day the predicate refuses', () => {
    render(
      <DateTimeField
        aria-label="Quando"
        isDateUnavailable={(date) => date.day === 10}
        locale="pt-BR"
        value={TENTH}
      />,
    );
    expect(root()).toHaveAttribute('data-invalid');
  });

  /* Two predicates rather than one: a day-level answer cannot be derived from a
     datetime-level predicate without probing every step of that day. */
  it('reports a time the predicate refuses on that day', () => {
    render(
      <DateTimeField
        aria-label="Quando"
        isTimeUnavailable={(time, date) => date.day === 10 && time.hour === 15}
        locale="pt-BR"
        value={TENTH}
      />,
    );
    expect(root()).toHaveAttribute('data-invalid');
  });
});

describe('the contract with the consumer', () => {
  it('holds the value itself when nobody else does', () => {
    render(<DateTimeField aria-label="Quando" defaultValue={TENTH} locale="pt-BR" name="quando" />);
    focusOn('hour');
    press('ArrowUp');
    expect(hidden()).toHaveValue('2026-09-10T16:20:00');
  });

  it('waits for the consumer when they own it', () => {
    const Controlled = () => {
      const [value, setValue] = useState<PlainDateTime | null>(TENTH);
      return (
        <DateTimeField
          aria-label="Quando"
          locale="pt-BR"
          name="quando"
          onValueChange={(next) => setValue(next)}
          value={value}
        />
      );
    };
    render(<Controlled />);
    focusOn('hour');
    press('ArrowUp');
    expect(hidden()).toHaveValue('2026-09-10T16:20:00');
  });

  /**
   * The segments always commit and the value is always a request: a consumer
   * who owns the value does not own the half of a value being typed, which is
   * the rule both sibling fields already carry. What a controlled consumer owns
   * is the answer — and the next value they hand back rewrites the segments.
   */
  it('asks before the value moves, and takes the consumer s answer', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <DateTimeField
        aria-label="Quando"
        locale="pt-BR"
        name="quando"
        onValueChange={onValueChange}
        value={TENTH}
      />,
    );

    focusOn('hour');
    press('ArrowUp');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(toISODateTime(onValueChange.mock.calls[0]?.[0] as PlainDateTime)).toBe(
      '2026-09-10T16:20:00',
    );

    /* The consumer answers with a different value, and the segments follow it
       rather than the key that asked. */
    const answered = plainDateTime(plainDate(2026, 9, 11), plainTime(9, 0));
    rerender(
      <DateTimeField
        aria-label="Quando"
        locale="pt-BR"
        name="quando"
        onValueChange={onValueChange}
        value={answered}
      />,
    );
    expect(hidden()).toHaveValue(toISODateTime(answered));
  });

  it('empties both halves at once', () => {
    render(
      <DateTimeField
        aria-label="Quando"
        clearable
        defaultValue={TENTH}
        locale="pt-BR"
        name="quando"
      />,
    );
    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear.querySelector('svg[data-glyph]')).toHaveAttribute('data-glyph', 'x');
    fireEvent.click(clear);
    expect(hidden()).toHaveValue('');
    expect(root()).not.toHaveAttribute('data-incomplete');
  });

  it('reaches the imperative actions through the ref', () => {
    const handle = { current: null as DateTimeFieldHandle | null };
    render(
      <DateTimeField
        aria-label="Quando"
        defaultValue={TENTH}
        locale="pt-BR"
        name="quando"
        ref={handle}
      />,
    );

    act(() => handle.current?.focus());
    expect(document.activeElement).toBe(segmentFor('day'));
    act(() => handle.current?.clear());
    expect(hidden()).toHaveValue('');
  });

  it('takes its defaults from a provider, and a prop still wins', () => {
    render(
      <SlottedProvider locale="en-US">
        <DateTimeFieldDefaultsProvider granularity="second">
          <DateTimeField aria-label="When" value={TENTH} />
        </DateTimeFieldDefaultsProvider>
      </SlottedProvider>,
    );
    /* `en-US` from the language in force: the month leads. */
    expect(segments().map((element) => element.dataset['field'])).toEqual([
      'month',
      'day',
      'year',
      'hour',
      'minute',
      'second',
      'dayPeriod',
    ]);
    expect(root()).toHaveAttribute('data-granularity', 'second');

    render(
      <SlottedProvider locale="en-US">
        <DateTimeFieldDefaultsProvider granularity="second">
          <DateTimeField aria-label="Quando" granularity="minute" locale="pt-BR" value={TENTH} />
        </DateTimeFieldDefaultsProvider>
      </SlottedProvider>,
    );
    const roots = [...document.querySelectorAll('[data-ui="datetime-field"]')];
    /* The control that states either of them itself still wins. */
    expect(roots.at(-1)).toHaveAttribute('data-granularity', 'minute');
  });

  it('changes its words and its order together with the language in force', () => {
    const inLocale = (locale: string) => (
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
        <DateTimeField aria-label="Quando" clearable defaultValue={TENTH} />
      </SlottedProvider>
    );
    const { rerender } = render(inLocale('pt-BR'));

    expect(screen.getByRole('button', { name: 'Limpar' })).toBeInTheDocument();
    expect(segments().map((element) => element.dataset['field'])).toEqual([
      'day',
      'month',
      'year',
      'hour',
      'minute',
    ]);

    rerender(inLocale('en-US'));
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(segments().map((element) => element.dataset['field'])).toEqual([
      'month',
      'day',
      'year',
      'hour',
      'minute',
      'dayPeriod',
    ]);
  });

  it('takes the field s wiring when it sits inside one', () => {
    render(
      <Field>
        <FieldLabel>Quando</FieldLabel>
        <DateTimeField locale="pt-BR" value={TENTH} />
      </Field>,
    );
    const group = screen.getByRole('group');
    expect(group.getAttribute('aria-labelledby')).toBeTruthy();
  });

  it('substitutes the rendered element and hands the ref back', () => {
    render(
      <DateTimeField
        aria-label="Quando"
        locale="pt-BR"
        render={(props) => <section {...props} />}
        value={TENTH}
      />,
    );
    expect(root().tagName).toBe('SECTION');
  });
});

describe('states', () => {
  it('paints disabled, readonly and required on the frame and the group', () => {
    const { rerender } = render(
      <DateTimeField aria-label="Quando" disabled locale="pt-BR" value={TENTH} />,
    );
    expect(root()).toHaveAttribute('data-disabled');
    expect(screen.getByRole('group')).toHaveAttribute('aria-disabled', 'true');

    rerender(<DateTimeField aria-label="Quando" locale="pt-BR" readOnly value={TENTH} />);
    expect(root()).toHaveAttribute('data-readonly');
    expect(screen.getByRole('group')).toHaveAttribute('aria-readonly', 'true');

    rerender(<DateTimeField aria-label="Quando" locale="pt-BR" required value={TENTH} />);
    expect(root()).toHaveAttribute('data-required');
    expect(screen.getByRole('group')).toHaveAttribute('aria-required', 'true');
  });

  it('refuses to move while it is not editable', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" readOnly value={TENTH} />);
    focusOn('hour');
    press('ArrowUp');
    expect(segmentFor('hour').textContent?.trim()).toBe('15');
  });

  it('names the whole value in words for a screen reader', () => {
    render(<DateTimeField aria-label="Quando" locale="pt-BR" value={TENTH} />);
    const spoken = root().querySelector('[data-part="value-text"]')?.textContent ?? '';
    expect(spoken).toContain('setembro');
    expect(spoken).toContain('15:20');
  });
});

describe('inside a field', () => {
  it('registers as the field’s control, so the field does not warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <Field>
        <FieldLabel>Pickup</FieldLabel>
        <DateTimeField locale="en-US" />
      </Field>,
    );

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('without a control'));
    warn.mockRestore();
  });
});

/**
 * A segment is named for the unit it holds, in the language in force. The
 * placeholder is drawn and never spoken.
 */
describe('what each segment is called', () => {
  it.each([
    [
      'en-US',
      {
        day: 'day',
        month: 'month',
        year: 'year',
        hour: 'hour',
        minute: 'minute',
        second: 'second',
        dayPeriod: 'AM/PM',
      },
    ],
    [
      'pt-BR',
      {
        day: 'dia',
        // language: pt-BR
        month: 'mês',
        // language: en-US
        year: 'ano',
        hour: 'hora',
        minute: 'minuto',
        second: 'segundo',
        dayPeriod: 'AM/PM',
      },
    ],
  ] as const)('in %s', (locale, expected) => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
        <Field>
          <FieldLabel>Starts</FieldLabel>
          <DateTimeField defaultValue={TENTH} granularity="second" hourCycle={12} />
        </Field>
      </SlottedProvider>,
    );

    const names = Object.fromEntries(
      segments().map((segment) => [segment.dataset['field'], segment.getAttribute('aria-label')]),
    );
    expect(names).toEqual(expected);
    for (const segment of segments()) {
      expect(segment).toHaveAccessibleName(
        expected[segment.dataset['field'] as keyof typeof expected],
      );
    }
  });
});
