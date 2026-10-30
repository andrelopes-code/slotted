import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { plainDate, plainDateTime, plainTime, toISODateTime } from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/datetime-field/contract.json';
import { SlDateTimeField } from './datetime-field';
import type { DateTimeFieldChangeRequest } from './datetime-field';
import { provideDateTimeFieldDefaults } from './datetime-field-defaults';
import { SlDateTimeFieldEnd, SlDateTimeFieldStart } from './datetime-field-parts';

const TENTH = plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20));
/** Stated rather than read from the clock, so every assertion below is fixed. */
const REFERENCE = plainDateTime(plainDate(2026, 9, 10), plainTime(12, 0));

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlField,
    SlFieldLabel,
    SlDateTimeField,
    SlDateTimeFieldEnd,
    SlDateTimeFieldStart,
  ],
  template: `<div slDateTimeField></div>`,
})
class Host {
  readonly value = signal<PlainDateTime | null | undefined>(undefined);
  readonly tenth = TENTH;
  readonly reference = REFERENCE;
  readonly control = new FormControl<PlainDateTime | null>(TENTH);
  readonly requests: DateTimeFieldChangeRequest[] = [];
  readonly unavailableDay = (date: PlainDate) => date.day === 10;
  readonly unavailableTime = (time: PlainTime, date: PlainDate) =>
    date.day === 10 && time.hour === 15;
  readonly onRequest = vi.fn((request: DateTimeFieldChangeRequest) => {
    this.requests.push(request);
  });
}

function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, { set: { template } });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

type Fixture = ReturnType<typeof renderTemplate>;

const root = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-ui="datetime-field"]') as HTMLElement;
const segments = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="segment"]')] as HTMLElement[];
const segmentFor = (fixture: Fixture, field: string) =>
  segments(fixture).find((element) => element.dataset['field'] === field) as HTMLElement;
const fields = (fixture: Fixture) => segments(fixture).map((element) => element.dataset['field']);
const text = (fixture: Fixture) =>
  segments(fixture).map((element) => (element.textContent ?? '').trim());
const group = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="segments"]') as HTMLElement;
const halves = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="half"]')] as HTMLElement[];
const hidden = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="hidden-input"]') as HTMLInputElement;
const durationInput = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="duration"]') as HTMLInputElement | null;
const preview = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="preview"]') as HTMLElement | null;

/** A key press on one segment, which is how a spin button is driven. */
const press = (fixture: Fixture, field: string, key: string, init: KeyboardEventInit = {}) => {
  segmentFor(fixture, field).dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, key, ...init }),
  );
  fixture.detectChanges();
};

/**
 * A run of digits, typed where the reader is.
 *
 * The first digit goes to the named segment; the rest follow focus, because a
 * digit that fills a field advances and the next one belongs to the field it
 * advanced to. Typing every digit at the named segment instead is what a test
 * does and a reader never could.
 */
const typeDigits = (fixture: Fixture, field: string, digits: string) => {
  let target = segmentFor(fixture, field);
  for (const digit of digits) {
    target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: digit }));
    fixture.detectChanges();
    /* A digit that fills a field moves focus, and the next digit belongs to the
       field it moved to. Anything else leaves the reader where they were. */
    const focused = document.activeElement as HTMLElement | null;
    if (focused?.dataset['part'] === 'segment') target = focused;
  }
};

const blur = (fixture: Fixture, field: string) => {
  segmentFor(fixture, field).dispatchEvent(new FocusEvent('blur', { bubbles: false }));
  fixture.detectChanges();
};

describe('the shape the pattern asks for', () => {
  /**
   * One frame, one group, every field the locale writes. The frame carries no
   * role: the APG's spin-button example names the group as the thing that tells
   * a screen-reader user that the buttons are one value.
   */
  it('wraps every field in one group named by the whole value', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [defaultValue]="tenth"></div>`,
    );

    expect(group(fixture).getAttribute('role')).toBe('group');
    expect(root(fixture).dataset['ui']).toBe(contract.ui);
    expect(root(fixture).getAttribute('role')).toBeNull();
    expect(fields(fixture)).toEqual(['day', 'month', 'year', 'hour', 'minute']);
  });

  it('takes the order of both halves from one locale pattern', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="en-US" [hourCycle]="12" [defaultValue]="tenth"></div>`,
    );
    expect(fields(fixture)).toEqual(['month', 'day', 'year', 'hour', 'minute', 'dayPeriod']);
  });

  /**
   * Each half is one box, and it is the only place the row is allowed to break.
   * Flexbox breaks a line between any two items and offers no way to forbid one
   * place, so the boundary has to be a box rather than a rule.
   */
  it('puts each half in its own box, with the boundary at the end of the first', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="en-US" [hourCycle]="12" [defaultValue]="tenth"></div>`,
    );

    expect(halves(fixture).map((element) => element.dataset['half'])).toEqual(['date', 'time']);

    const boundary = fixture.nativeElement.querySelector(
      '[data-part="literal"][data-boundary]',
    ) as HTMLElement | null;
    expect(boundary?.textContent?.trim()).toBe(',');
    expect(boundary?.closest('[data-part="half"]')).toBe(halves(fixture)[0]);
  });

  it('draws no boundary where the locale writes only a space', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="fr-FR" [defaultValue]="tenth"></div>`,
    );
    expect(fixture.nativeElement.querySelector('[data-part="literal"][data-boundary]')).toBeNull();
  });

  it('marks every segment with the half it belongs to', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [defaultValue]="tenth"></div>`,
    );
    expect(segments(fixture).map((element) => element.dataset['half'])).toEqual([
      'date',
      'date',
      'date',
      'time',
      'time',
    ]);
  });

  it('names a month in words rather than as a number', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [defaultValue]="tenth"></div>`,
    );
    expect(segmentFor(fixture, 'month').getAttribute('aria-valuetext')).toBe('setembro');
  });

  it('posts the whole value through a hidden input', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" name="quando" [defaultValue]="tenth"></div>`,
    );
    expect(hidden(fixture).value).toBe(toISODateTime(TENTH));
  });
});

describe('typing', () => {
  /**
   * A digit that fills the last date segment advances into the first time
   * segment. Two nested fields would both stop at the boundary, which is the
   * third reason this family draws one row.
   */
  it('runs a typed value across the boundary between the halves', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [referenceDateTime]="reference"></div>`,
    );

    typeDigits(fixture, 'day', '10');
    typeDigits(fixture, 'month', '09');
    typeDigits(fixture, 'year', '2026');
    typeDigits(fixture, 'hour', '15');
    typeDigits(fixture, 'minute', '20');

    expect(text(fixture)).toEqual(['10', '09', '2026', '15', '20']);
    expect(hidden(fixture).value).toBe(toISODateTime(TENTH));
  });

  it('walks the arrows across the same boundary', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [defaultValue]="tenth"></div>`,
    );
    press(fixture, 'year', 'ArrowRight');
    expect(document.activeElement).toBe(segmentFor(fixture, 'hour'));
    press(fixture, 'hour', 'ArrowLeft');
    expect(document.activeElement).toBe(segmentFor(fixture, 'year'));
  });

  it('pages each field the way its own half already pages it', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [defaultValue]="tenth"></div>`,
    );

    press(fixture, 'day', 'PageUp');
    expect(segmentFor(fixture, 'day').textContent?.trim()).toBe('15');

    press(fixture, 'minute', 'PageUp');
    expect(segmentFor(fixture, 'minute').textContent?.trim()).toBe('35');
  });

  it('steps and bounds one segment at a time', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [defaultValue]="tenth"></div>`,
    );

    press(fixture, 'hour', 'ArrowUp');
    expect(segmentFor(fixture, 'hour').textContent?.trim()).toBe('16');
    press(fixture, 'hour', 'Home');
    expect(segmentFor(fixture, 'hour').textContent?.trim()).toBe('00');
    press(fixture, 'hour', 'End');
    expect(segmentFor(fixture, 'hour').textContent?.trim()).toBe('23');
  });

  /**
   * The behavior no surveyed implementation has, inherited whole from
   * `date-field`: 31 January stepped forward is 28 February, and stepped
   * forward again it is 31 March rather than the 28th. The engine runs it only
   * when the changed field is a date field, so a stepped hour never touches it.
   */
  it('gives back the day a short month could not hold', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [defaultValue]="{ date: { year: 2026, month: 1, day: 31 }, time: { hour: 15, minute: 20, second: 0 } }"></div>`,
    );

    press(fixture, 'month', 'ArrowUp');
    expect(text(fixture)).toEqual(['28', '02', '2026', '15', '20']);

    press(fixture, 'month', 'ArrowUp');
    expect(text(fixture)).toEqual(['31', '03', '2026', '15', '20']);
  });
});

describe('the missing half', () => {
  it('says which half is missing, and stays quiet on an empty field', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [referenceDateTime]="reference"></div>`,
    );
    expect(root(fixture).dataset['incomplete']).toBeUndefined();

    typeDigits(fixture, 'day', '10');
    typeDigits(fixture, 'month', '09');
    typeDigits(fixture, 'year', '2026');
    blur(fixture, 'year');

    expect(root(fixture).dataset['incomplete']).toBe('time');
    expect(hidden(fixture).value).toBe('');
  });

  /**
   * `dateTimeIncomplete` is the rule no surveyed implementation reports: a
   * reader who wrote a day and left is not an empty control, and a form that
   * says "required" there is answering a different question.
   */
  it('reports the missing half to a Reactive Form', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [formControl]="control" [referenceDateTime]="reference"></div>`,
    );
    const host = fixture.componentInstance as Host;

    press(fixture, 'hour', 'Backspace');
    expect(host.control.value).toBeNull();
    expect(host.control.errors?.['slottedDateTimeIncomplete']).toEqual({ missing: 'time' });
  });

  it('carries the segments and the missing half on the request', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [defaultValue]="tenth" (valueChange)="onRequest($event)"></div>`,
    );
    const host = fixture.componentInstance as Host;

    press(fixture, 'hour', 'Backspace');

    const request = host.requests.at(-1) as DateTimeFieldChangeRequest;
    expect(request.value).toBeNull();
    expect(request.segments.day).toBe(10);
    expect(request.incomplete).toBe('time');
    /* The flag `time-field` raises is spent here: the day exists, so a crossing
       is the value rather than a fact beside it. */
    expect(request).not.toHaveProperty('crossesMidnight');
  });
});

describe('the relative expression', () => {
  it('replaces the segments with one expression region', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [referenceDateTime]="reference"></div>`,
    );
    press(fixture, 'day', '+');

    expect(segments(fixture)).toHaveLength(0);
    expect(root(fixture).dataset['relative']).toBe('');
    expect(durationInput(fixture)).not.toBeNull();
  });

  /**
   * `+2d` moves the day, which is what it is for — and it is where
   * `time-field`'s `crossesMidnight` flag is finally spent.
   */
  it('resolves days and weeks, and says so when the day moved', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" name="quando" [referenceDateTime]="reference"></div>`,
    );
    press(fixture, 'day', '+');

    const input = durationInput(fixture) as HTMLInputElement;
    input.value = '+2d';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(preview(fixture)?.dataset['resolved']).toBe('');
    expect(preview(fixture)?.dataset['rollsDay']).toBe('');
    expect(preview(fixture)?.querySelector('[data-part="preview-date"]')).not.toBeNull();
    /* The chevron is the glyph element, marked to turn in a right-to-left context. */
    expect(
      preview(fixture)?.querySelector('[data-ui="icon"]')?.hasAttribute('data-directional'),
    ).toBe(true);
    expect(preview(fixture)?.querySelector('svg[data-glyph]')?.getAttribute('data-glyph')).toBe(
      'chevron-right',
    );

    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    fixture.detectChanges();
    expect(hidden(fixture).value).toBe('2026-09-12T12:00:00');
  });

  it('leaves the day alone when the duration stays inside it', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" name="quando" [referenceDateTime]="reference"></div>`,
    );
    press(fixture, 'day', '+');

    const input = durationInput(fixture) as HTMLInputElement;
    input.value = '+40m';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(preview(fixture)?.dataset['rollsDay']).toBeUndefined();

    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    fixture.detectChanges();
    expect(hidden(fixture).value).toBe('2026-09-10T12:40:00');
  });

  it('abandons the expression whole on Escape', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [defaultValue]="tenth"></div>`,
    );
    press(fixture, 'day', '+');

    const input = durationInput(fixture) as HTMLInputElement;
    input.value = '+2d';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    fixture.detectChanges();

    expect(root(fixture).dataset['relative']).toBeUndefined();
    expect(text(fixture)).toEqual(['10', '09', '2026', '15', '20']);
  });

  it('is removed by [relative]="false"', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [relative]="false" [defaultValue]="tenth"></div>`,
    );
    press(fixture, 'day', '+');
    expect(root(fixture).dataset['relative']).toBeUndefined();
  });
});

describe('the form', () => {
  it('writes a Reactive Form control and reads it back', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [formControl]="control"></div>`,
    );
    const host = fixture.componentInstance as Host;

    expect(text(fixture)).toEqual(['10', '09', '2026', '15', '20']);
    press(fixture, 'hour', 'ArrowUp');
    expect(toISODateTime(host.control.value as PlainDateTime)).toBe('2026-09-10T16:20:00');
  });

  /**
   * Both pairs of bounds apply at once, which MUI's own validation page records
   * that it cannot do.
   */
  it('reports a value the whole-value bound refuses', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [formControl]="control" [min]="{ date: { year: 2026, month: 9, day: 11 }, time: { hour: 9, minute: 0, second: 0 } }"></div>`,
    );
    const host = fixture.componentInstance as Host;
    expect(host.control.errors?.['slottedDateTimeRange']).toBeTruthy();
    expect(root(fixture).dataset['invalid']).toBe('');
  });

  it('reports a value the per-day window refuses, inside the range', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [formControl]="control"
        [min]="{ date: { year: 2026, month: 9, day: 1 }, time: { hour: 0, minute: 0, second: 0 } }"
        [max]="{ date: { year: 2026, month: 9, day: 30 }, time: { hour: 23, minute: 0, second: 0 } }"
        [maxTime]="{ hour: 14, minute: 0, second: 0 }"></div>`,
    );
    const host = fixture.componentInstance as Host;
    expect(host.control.errors?.['slottedDateTimeWindow']).toBeTruthy();
  });

  it('reports a day and a time the two predicates refuse', () => {
    const day = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [formControl]="control" [isDateUnavailable]="unavailableDay"></div>`,
    );
    expect(
      (day.componentInstance as Host).control.errors?.['slottedDateTimeUnavailable'],
    ).toBeTruthy();

    const time = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [formControl]="control" [isTimeUnavailable]="unavailableTime"></div>`,
    );
    expect(
      (time.componentInstance as Host).control.errors?.['slottedDateTimeUnavailable'],
    ).toBeTruthy();
  });

  it('takes the disabled state a form sets', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [formControl]="control"></div>`,
    );
    const host = fixture.componentInstance as Host;
    host.control.disable();
    fixture.detectChanges();
    expect(root(fixture).dataset['disabled']).toBe('');
  });
});

describe('the contract with the consumer', () => {
  it('takes its defaults from a provider, and an input still wins', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField [defaultValue]="tenth"></div>
       <div slDateTimeField locale="pt-BR" [defaultValue]="tenth"></div>`,
      [
        provideSlotted({ locale: 'en-US' }),
        provideDateTimeFieldDefaults({ granularity: 'second' }),
      ],
    );

    const roots = [
      ...fixture.nativeElement.querySelectorAll('[data-ui="datetime-field"]'),
    ] as HTMLElement[];
    expect(roots[0]?.dataset['granularity']).toBe('second');
    expect(
      [...(roots[1]?.querySelectorAll('[data-part="segment"]') ?? [])].map(
        (element) => (element as HTMLElement).dataset['field'],
      ),
    ).toEqual(['day', 'month', 'year', 'hour', 'minute', 'second']);
  });

  it('changes its words and its order together with the language in force', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<div slDateTimeField clearable aria-label="Quando" [defaultValue]="tenth"></div>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );
    const clear = () =>
      fixture.nativeElement.querySelector('[data-part="clear"]').getAttribute('aria-label');
    const order = () =>
      [...fixture.nativeElement.querySelectorAll('[data-part="segment"]')].map(
        (element) => (element as HTMLElement).dataset['field'],
      );

    expect(clear()).toBe('Limpar');
    expect(order()).toEqual(['day', 'month', 'year', 'hour', 'minute']);

    locale.set('en-US');
    fixture.detectChanges();
    expect(clear()).toBe('Clear');
    expect(order()).toEqual(['month', 'day', 'year', 'hour', 'minute', 'dayPeriod']);
  });

  it('takes the field s wiring when it sits inside one', () => {
    const fixture = renderTemplate(
      `<div slField>
         <label slFieldLabel>Quando</label>
         <div slDateTimeField locale="pt-BR" [defaultValue]="tenth"></div>
       </div>`,
    );
    expect(group(fixture).getAttribute('aria-labelledby')).toBeTruthy();
  });

  it('keeps a static attribute the consumer wrote', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField aria-label="Quando" locale="pt-BR" [defaultValue]="tenth"></div>`,
    );
    expect(group(fixture).getAttribute('aria-label')).toBe('Quando');
    expect(group(fixture).getAttribute('aria-labelledby')).toBeNull();
  });

  it('empties both halves at once', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField clearable locale="pt-BR" name="quando" [defaultValue]="tenth"></div>`,
    );
    const clear = fixture.nativeElement.querySelector('[data-part="clear"]') as HTMLButtonElement;
    expect(clear.querySelector('svg[data-glyph]')?.getAttribute('data-glyph')).toBe('x');
    clear.click();
    fixture.detectChanges();

    expect(hidden(fixture).value).toBe('');
    expect(root(fixture).dataset['incomplete']).toBeUndefined();
  });

  it('paints the four states on the frame and the group', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField disabled locale="pt-BR" [defaultValue]="tenth"></div>
       <div slDateTimeField readOnly locale="pt-BR" [defaultValue]="tenth"></div>
       <div slDateTimeField required locale="pt-BR" [defaultValue]="tenth"></div>
       <div slDateTimeField invalid locale="pt-BR" [defaultValue]="tenth"></div>`,
    );
    const roots = [
      ...fixture.nativeElement.querySelectorAll('[data-ui="datetime-field"]'),
    ] as HTMLElement[];
    expect(roots[0]?.dataset['disabled']).toBe('');
    expect(roots[1]?.dataset['readonly']).toBe('');
    expect(roots[2]?.dataset['required']).toBe('');
    expect(roots[3]?.dataset['invalid']).toBe('');
  });

  it('refuses to move while it is not editable', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField readOnly locale="pt-BR" [defaultValue]="tenth"></div>`,
    );
    press(fixture, 'hour', 'ArrowUp');
    expect(segmentFor(fixture, 'hour').textContent?.trim()).toBe('15');
  });

  it('takes the consumer s own slots', () => {
    const fixture = renderTemplate(
      `<div slDateTimeField locale="pt-BR" [defaultValue]="tenth">
         <span slDateTimeFieldStart>UTC</span>
         <span slDateTimeFieldEnd>-3</span>
       </div>`,
    );
    expect(fixture.nativeElement.querySelector('[data-part="start"]')?.textContent).toBe('UTC');
    expect(fixture.nativeElement.querySelector('[data-part="end"]')?.textContent).toBe('-3');
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
    const fixture = renderTemplate(
      `<div slDateTimeField granularity="second" [hourCycle]="12" [defaultValue]="tenth"></div>`,
      [provideSlotted({ locale: signal(locale), catalogs: { 'pt-BR': PT_BR } })],
    );
    const names = Object.fromEntries(
      [...fixture.nativeElement.querySelectorAll('[role="spinbutton"]')].map((segment: Element) => [
        segment.getAttribute('data-field'),
        segment.getAttribute('aria-label'),
      ]),
    );
    expect(names).toEqual(expected);
  });
});
