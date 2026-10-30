import { plainTime, toISOTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { TimeField, TimeFieldDefaultsProvider } from './index';
import type { TimeFieldChangeRequest, TimeFieldHandle } from './index';

const HALF_PAST_TWO = plainTime(14, 30);
/** Stated rather than read from the clock, so every assertion below is fixed. */
const NOON = plainTime(12, 0);

type Field_ = 'hour' | 'minute' | 'second' | 'dayPeriod';

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

const paste = (value: string) => {
  fireEvent.paste(screen.getByRole('group'), { clipboardData: { getData: () => value } });
};

const expression = () => screen.getByRole('textbox');
const preview = () => screen.getByRole('status');

describe('the shape the pattern asks for', () => {
  /**
   * The APG's spin-button example: the fields inside a group whose name is the
   * whole time, so the reader perceives it without visiting every button.
   */
  it('wraps the fields in a group named by the whole time', () => {
    render(<TimeField aria-label="Start" defaultValue={HALF_PAST_TWO} locale="pt-BR" />);

    expect(segments()).toHaveLength(2);
    expect(screen.getByRole('group')).toBeInTheDocument();
    for (const element of segments()) {
      expect(element).toHaveAttribute('aria-valuemin');
      expect(element).toHaveAttribute('aria-valuemax');
    }
  });

  it('takes the field order and the separators from the locale', () => {
    render(<TimeField defaultValue={HALF_PAST_TWO} locale="pt-BR" />);
    expect(text()).toEqual(['14', '30']);
  });

  it('draws a day period where the locale writes one, and names it in words', () => {
    render(<TimeField defaultValue={HALF_PAST_TWO} locale="en-US" />);

    expect(segments()).toHaveLength(3);
    const period = segmentFor('dayPeriod');
    expect(period).toHaveAttribute('aria-valuenow', '1');
    expect(period.getAttribute('aria-valuetext')).toMatch(/PM/i);
  });

  it('draws the seconds only at second granularity', () => {
    const { rerender } = render(<TimeField defaultValue={HALF_PAST_TWO} locale="pt-BR" />);
    expect(segments()).toHaveLength(2);

    rerender(<TimeField defaultValue={HALF_PAST_TWO} granularity="second" locale="pt-BR" />);
    expect(segments()).toHaveLength(3);
  });

  it('posts the value a form can read, whatever the locale draws', () => {
    const { container } = render(
      <TimeField defaultValue={HALF_PAST_TWO} locale="en-US" name="t" />,
    );
    expect(container.querySelector('[data-part="hidden-input"]')).toHaveValue('14:30:00');
  });
});

describe('the keyboard the pattern lists', () => {
  it('steps a segment and wraps inside it, never carrying into the next', () => {
    render(<TimeField defaultValue={plainTime(23, 59)} locale="pt-BR" />);

    focusOn('minute');
    press('ArrowUp');
    expect(text()).toEqual(['23', '00']);
  });

  it('pages by the step the contract states', () => {
    render(<TimeField defaultValue={plainTime(10, 0)} locale="pt-BR" />);

    focusOn('minute');
    press('PageUp');
    expect(text()).toEqual(['10', '15']);

    focusOn('hour');
    press('PageDown');
    expect(text()).toEqual(['07', '15']);
  });

  it('takes a segment to either edge of its own range', () => {
    render(<TimeField defaultValue={plainTime(10, 30)} locale="pt-BR" />);

    focusOn('minute');
    press('End');
    expect(text()).toEqual(['10', '59']);
    press('Home');
    expect(text()).toEqual(['10', '00']);
  });

  it('moves between fields along the writing direction', () => {
    render(<TimeField defaultValue={HALF_PAST_TWO} locale="pt-BR" />);

    focusOn('hour');
    press('ArrowRight');
    expect(document.activeElement).toBe(segmentFor('minute'));
    press('ArrowLeft');
    expect(document.activeElement).toBe(segmentFor('hour'));
  });

  it('empties one field and leaves the rest alone', () => {
    render(<TimeField defaultValue={HALF_PAST_TWO} locale="pt-BR" />);

    focusOn('minute');
    press('Backspace');
    expect(text()).toEqual(['14', 'mm']);
  });

  it('takes the day period by the first letter of the locale name', () => {
    render(<TimeField defaultValue={plainTime(9, 0)} locale="en-US" />);

    focusOn('dayPeriod');
    press('p');
    expect(segmentFor('dayPeriod').getAttribute('aria-valuetext')).toMatch(/PM/i);
    press('a');
    expect(segmentFor('dayPeriod').getAttribute('aria-valuetext')).toMatch(/AM/i);
  });

  /**
   * A `div` with `role="spinbutton"` is invisible to every "is the target
   * editable" guard an application writes, so a key the field acts on has to
   * stop rather than only lose its default.
   */
  it('stops the keys it acts on rather than only defaulting them', () => {
    const above = vi.fn();
    render(
      <div onKeyDown={above}>
        <TimeField defaultValue={HALF_PAST_TWO} locale="pt-BR" />
      </div>,
    );

    focusOn('hour');
    press('1');
    press('ArrowUp');
    expect(above).not.toHaveBeenCalled();
  });

  it('leaves Alt+ArrowDown for the picker above it', () => {
    render(<TimeField defaultValue={HALF_PAST_TWO} locale="pt-BR" />);

    focusOn('hour');
    fireEvent.keyDown(segmentFor('hour'), { altKey: true, key: 'ArrowDown' });
    expect(text()).toEqual(['14', '30']);
  });
});

describe('the entry model', () => {
  it('ends a run when no further digit fits under the maximum', () => {
    render(<TimeField locale="pt-BR" referenceTime={NOON} />);

    focusOn('hour');
    typeDigits('2');
    expect(text()[0]).toBe('2');
    typeDigits('3');
    expect(text()[0]).toBe('23');
    expect(document.activeElement).toBe(segmentFor('minute'));
  });

  /**
   * The gap the inventory names: an hour with no minute is a state every
   * surveyed implementation cannot hold, and the value derived from it is
   * `null` rather than a time nobody typed.
   *
   * No request is emitted for it, and that is `docs/state-and-events.md`
   * speaking rather than an omission: a request for a value equal to the
   * current one has nothing to decide and nothing to cancel. The half-typed
   * time is what the control shows; the request carries the segments on the
   * keystroke that does move the value.
   */
  it('holds a half-typed time, and reports no value for it', () => {
    const onValueChange = vi.fn();
    render(<TimeField locale="pt-BR" onValueChange={onValueChange} referenceTime={NOON} />);

    focusOn('hour');
    typeDigits('09');
    expect(text()).toEqual(['09', 'mm']);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('moves the display on every digit and the value only when a run ends', () => {
    const onValueChange = vi.fn();
    render(
      <TimeField
        defaultValue={plainTime(9, 0)}
        locale="pt-BR"
        onValueChange={onValueChange}
        referenceTime={NOON}
      />,
    );

    focusOn('minute');
    typeDigits('4');
    expect(onValueChange).not.toHaveBeenCalled();
    typeDigits('5');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(plainTime(9, 45));
  });

  it('carries the segments beside the value, so a draft can be saved', () => {
    const onValueChange =
      vi.fn<(value: PlainTime | null, request: TimeFieldChangeRequest) => void>();
    render(
      <TimeField
        defaultValue={HALF_PAST_TWO}
        locale="pt-BR"
        onValueChange={onValueChange}
        referenceTime={NOON}
      />,
    );

    /* Emptying the minute takes a whole time to a half-typed one: the value
       moves to null and the request carries the segments that produced it. */
    focusOn('minute');
    press('Backspace');

    const request = onValueChange.mock.calls[0]?.[1];
    expect(onValueChange.mock.calls[0]?.[0]).toBeNull();
    expect(request?.segments.hour).toBe(14);
    expect(request?.segments.minute).toBeNull();
  });

  it('reads a whole time from a paste, in the locale shape and in ISO', () => {
    render(<TimeField locale="pt-BR" referenceTime={NOON} />);

    paste('09:45');
    expect(text()).toEqual(['09', '45']);
  });

  it('steps an empty segment from the reference rather than from a minimum', () => {
    render(<TimeField locale="pt-BR" referenceTime={plainTime(9, 0)} />);

    focusOn('hour');
    press('ArrowDown');
    expect(text()[0]).toBe('09');
  });
});

/**
 * The entry no surveyed implementation has: a time written as a duration from
 * now, resolved in view before it is accepted.
 */
describe('the duration expression', () => {
  const openExpression = (seed = '+') => {
    focusOn('hour');
    press(seed);
  };

  it('opens on +, - and =, in place of the segments', () => {
    render(<TimeField locale="pt-BR" referenceTime={plainTime(14, 40)} />);

    openExpression();
    expect(expression()).toHaveValue('+');
    expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
  });

  it('resolves as the reader types, before anything commits', () => {
    const onValueChange = vi.fn();
    render(
      <TimeField locale="pt-BR" onValueChange={onValueChange} referenceTime={plainTime(14, 40)} />,
    );

    openExpression();
    fireEvent.change(expression(), { target: { value: '+40m' } });
    expect(preview()).toHaveTextContent('15:20');
    /* The chevron is the glyph element, marked to turn in a right-to-left context. */
    expect(preview().querySelector('[data-ui="icon"]')).toHaveAttribute('data-directional');
    expect(preview().querySelector('svg[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'chevron-right',
    );
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('commits on Enter and brings the segments back holding it', () => {
    const onValueChange = vi.fn();
    render(
      <TimeField locale="pt-BR" onValueChange={onValueChange} referenceTime={plainTime(14, 40)} />,
    );

    openExpression();
    fireEvent.change(expression(), { target: { value: '+40m' } });
    fireEvent.keyDown(expression(), { key: 'Enter' });

    expect(onValueChange.mock.calls[0]?.[0]).toEqual(plainTime(15, 20));
    expect(text()).toEqual(['15', '20']);
  });

  it('abandons on Escape, and the segments come back as they were', () => {
    const onValueChange = vi.fn();
    render(
      <TimeField
        defaultValue={HALF_PAST_TWO}
        locale="pt-BR"
        onValueChange={onValueChange}
        referenceTime={plainTime(14, 40)}
      />,
    );

    openExpression();
    fireEvent.change(expression(), { target: { value: '+40m' } });
    fireEvent.keyDown(expression(), { key: 'Escape' });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(text()).toEqual(['14', '30']);
  });

  /**
   * A duration that runs past midnight lands on a different day, and this
   * library holds no day beside a time — so it says so rather than answering
   * 00:30 quietly.
   */
  it('says when the duration crossed midnight, and carries it in the request', () => {
    const onValueChange =
      vi.fn<(value: PlainTime | null, request: TimeFieldChangeRequest) => void>();
    render(
      <TimeField locale="pt-BR" onValueChange={onValueChange} referenceTime={plainTime(23, 0)} />,
    );

    openExpression();
    fireEvent.change(expression(), { target: { value: '+90m' } });
    expect(preview()).toHaveAttribute('data-crosses-midnight');

    fireEvent.keyDown(expression(), { key: 'Enter' });
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(plainTime(0, 30));
    expect(onValueChange.mock.calls[0]?.[1].crossesMidnight).toBe(true);
  });

  it('shows nothing while the expression says nothing, and refuses Enter', () => {
    const onValueChange = vi.fn();
    render(
      <TimeField locale="pt-BR" onValueChange={onValueChange} referenceTime={plainTime(14, 40)} />,
    );

    openExpression();
    fireEvent.change(expression(), { target: { value: '1h30x' } });
    expect(preview()).not.toHaveAttribute('data-resolved');

    fireEvent.keyDown(expression(), { key: 'Enter' });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('opens from a pasted duration, so pasting does what typing does', () => {
    render(<TimeField locale="pt-BR" referenceTime={plainTime(14, 40)} />);

    paste('+40m');
    expect(expression()).toHaveValue('+40m');
  });

  it('is removed whole by relative={false}', () => {
    render(<TimeField locale="pt-BR" referenceTime={NOON} relative={false} />);

    focusOn('hour');
    press('+');
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});

describe('the controlled and uncontrolled pair', () => {
  it('holds its own value and asks before moving it', () => {
    const onValueChange = vi.fn();
    render(
      <TimeField
        defaultValue={plainTime(9, 0)}
        locale="pt-BR"
        onValueChange={onValueChange}
        referenceTime={NOON}
      />,
    );

    focusOn('hour');
    press('ArrowUp');
    expect(text()[0]).toBe('10');
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(plainTime(10, 0));
  });

  it('waits for the consumer value when the consumer owns it', () => {
    const onValueChange = vi.fn();
    render(
      <TimeField
        locale="pt-BR"
        onValueChange={onValueChange}
        referenceTime={NOON}
        value={plainTime(9, 0)}
      />,
    );

    focusOn('hour');
    press('ArrowUp');
    expect(onValueChange).toHaveBeenCalled();
    /* The segments move — they are what the control is showing — and the value
       the consumer owns has not, so the next render puts it back. */
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('follows a consumer value that names a different time', () => {
    function Owned() {
      const [value, setValue] = useState<PlainTime | null>(plainTime(9, 0));
      return (
        <>
          <button onClick={() => setValue(plainTime(18, 45))} type="button">
            set
          </button>
          <TimeField locale="pt-BR" onValueChange={setValue} value={value} />
        </>
      );
    }

    render(<Owned />);
    fireEvent.click(screen.getByRole('button', { name: 'set' }));
    expect(text()).toEqual(['18', '45']);
  });
});

describe('what the field around it decides', () => {
  it('takes the label, the description and the states from the field', () => {
    render(
      <Field invalid>
        <FieldLabel>Start</FieldLabel>
        <TimeField defaultValue={HALF_PAST_TWO} locale="pt-BR" />
      </Field>,
    );

    expect(screen.getByRole('group')).toHaveAttribute('aria-invalid', 'true');
  });

  it('lets an application state the clock once, and takes the locale from the language in force', () => {
    render(
      <SlottedProvider locale="en-US">
        <TimeFieldDefaultsProvider hourCycle={12}>
          <TimeField defaultValue={HALF_PAST_TWO} />
        </TimeFieldDefaultsProvider>
      </SlottedProvider>,
    );

    expect(segments()).toHaveLength(3);
    expect(text()).toContain('02');
  });

  it('lets the control outrank the language in force', () => {
    render(
      <SlottedProvider locale="en-US">
        <TimeField defaultValue={HALF_PAST_TWO} locale="pt-BR" />
      </SlottedProvider>,
    );

    expect(text()).toEqual(['14', '30']);
  });

  it('changes its words and its time format together with the language in force', () => {
    const inLocale = (locale: string) => (
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
        <TimeField aria-label="Hora" clearable defaultValue={HALF_PAST_TWO} />
      </SlottedProvider>
    );
    const { rerender } = render(inLocale('pt-BR'));

    expect(screen.getByRole('button', { name: 'Limpar' })).toBeInTheDocument();
    expect(text()).toEqual(['14', '30']);

    rerender(inLocale('en-US'));
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(segments()).toHaveLength(3);
  });

  it('lays its own messages over the language in force', () => {
    render(
      <TimeField
        aria-label="Hora"
        clearable
        defaultValue={HALF_PAST_TWO}
        locale="pt-BR"
        messages={{ clear: 'Limpar a hora' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Limpar a hora' })).toBeInTheDocument();
  });
});

describe('validity the control owns', () => {
  it('reports a time outside the bounds, whatever the field says', () => {
    render(
      <TimeField
        defaultValue={plainTime(20, 0)}
        locale="pt-BR"
        max={plainTime(18, 0)}
        min={plainTime(9, 0)}
      />,
    );

    expect(screen.getByRole('group')).toHaveAttribute('aria-invalid', 'true');
  });

  it('reports a time the predicate refuses', () => {
    render(
      <TimeField
        defaultValue={plainTime(12, 30)}
        isTimeUnavailable={(time) => time.hour === 12}
        locale="pt-BR"
      />,
    );

    expect(screen.getByRole('group')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('the escape hatches', () => {
  it('focuses and clears through the handle', () => {
    const onValueChange = vi.fn();
    function Held() {
      const [handle, setHandle] = useState<TimeFieldHandle | null>(null);
      return (
        <>
          <button onClick={() => handle?.clear()} type="button">
            clear
          </button>
          <TimeField
            defaultValue={HALF_PAST_TWO}
            locale="pt-BR"
            onValueChange={onValueChange}
            ref={setHandle}
          />
        </>
      );
    }

    render(<Held />);
    fireEvent.click(screen.getByRole('button', { name: 'clear' }));
    expect(text()).toEqual(['hh', 'mm']);
    expect(onValueChange).toHaveBeenLastCalledWith(null, expect.anything());
  });

  it('substitutes the frame through render, and keeps the ref', () => {
    render(
      <TimeField
        defaultValue={HALF_PAST_TWO}
        locale="pt-BR"
        render={(props) => <section {...props} />}
      />,
    );

    expect(document.querySelector('section[data-ui="time-field"]')).not.toBeNull();
  });

  it('draws the clear control only while there is something to clear', () => {
    const { unmount } = render(<TimeField clearable locale="pt-BR" />);
    expect(screen.queryByRole('button')).toBeNull();
    unmount();

    render(<TimeField clearable defaultValue={HALF_PAST_TWO} locale="pt-BR" />);
    expect(screen.getByRole('button').querySelector('svg[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'x',
    );
  });
});

describe('what a reader is told', () => {
  it('names the group with the whole time in words', () => {
    render(<TimeField defaultValue={HALF_PAST_TWO} locale="pt-BR" />);
    expect(screen.getByRole('group')).toHaveAccessibleName(/14/);
  });

  it('says which fields are still empty, in the reader own language', () => {
    render(<TimeField locale="pt-BR" />);
    expect(text()).toEqual(['hh', 'mm']);
  });

  it('posts nothing while the time is incomplete', () => {
    const { container } = render(<TimeField locale="pt-BR" name="t" referenceTime={NOON} />);

    focusOn('hour');
    typeDigits('09');
    expect(container.querySelector('[data-part="hidden-input"]')).toHaveValue('');
    expect(toISOTime(plainTime(9, 0))).toBe('09:00:00');
  });
});

/**
 * A segment is named for the unit it holds, in the language in force. The
 * placeholder is drawn and never spoken.
 */
describe('what each segment is called', () => {
  it.each([
    ['en-US', { hour: 'hour', minute: 'minute', second: 'second', dayPeriod: 'AM/PM' }],
    ['pt-BR', { hour: 'hora', minute: 'minuto', second: 'segundo', dayPeriod: 'AM/PM' }],
  ] as const)('in %s', (locale, expected) => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale={locale}>
        <Field>
          <FieldLabel>Time</FieldLabel>
          <TimeField defaultValue={HALF_PAST_TWO} granularity="second" hourCycle={12} />
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
