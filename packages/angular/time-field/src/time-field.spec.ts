import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { plainTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/time-field/contract.json';
import { SlTimeField } from './time-field';
import type { TimeFieldChangeRequest } from './time-field';
import { provideTimeFieldDefaults } from './time-field-defaults';
import { SlTimeFieldEnd, SlTimeFieldStart } from './time-field-parts';

const HALF_PAST_TWO = plainTime(14, 30);
/** Stated rather than read from the clock, so every assertion below is fixed. */
const NOON = plainTime(12, 0);

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlField,
    SlFieldLabel,
    SlTimeField,
    SlTimeFieldEnd,
    SlTimeFieldStart,
  ],
  template: `<div slTimeField></div>`,
})
class Host {
  readonly value = signal<PlainTime | null | undefined>(undefined);
  readonly noon = NOON;
  readonly control = new FormControl<PlainTime | null>(HALF_PAST_TWO);
  readonly requests: TimeFieldChangeRequest[] = [];
  readonly unavailable = (time: PlainTime) => time.hour === 12;
  readonly onRequest = vi.fn((request: TimeFieldChangeRequest) => {
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
  fixture.nativeElement.querySelector('[data-ui="time-field"]') as HTMLElement;
const segments = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="segment"]')] as HTMLElement[];
const segmentFor = (fixture: Fixture, field: string) =>
  segments(fixture).find((element) => element.dataset['field'] === field) as HTMLElement;
const text = (fixture: Fixture) =>
  segments(fixture).map((element) => (element.textContent ?? '').trim());
const group = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="segments"]') as HTMLElement;
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

const typeDigits = (fixture: Fixture, field: string, digits: string) => {
  for (const digit of digits) press(fixture, field, digit);
};

describe('the shape the pattern asks for', () => {
  it('wraps the fields in a group named by the whole time', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="pt-BR" [defaultValue]="${'{'} hour: 14, minute: 30, second: 0 ${'}'}"></div>`,
    );

    expect(segments(fixture)).toHaveLength(2);
    expect(group(fixture).getAttribute('role')).toBe('group');
    expect(root(fixture).dataset['ui']).toBe(contract.ui);
  });

  it('takes the field order and the separators from the locale', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="pt-BR" [defaultValue]="control.value"></div>`,
    );
    expect(text(fixture)).toEqual(['14', '30']);
  });

  it('draws a day period where the locale writes one, and names it in words', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="en-US" [defaultValue]="control.value"></div>`,
    );

    expect(segments(fixture)).toHaveLength(3);
    const period = segmentFor(fixture, 'dayPeriod');
    expect(period.getAttribute('aria-valuenow')).toBe('1');
    expect(period.getAttribute('aria-valuetext')).toMatch(/PM/i);
  });

  it('draws the seconds only at second granularity', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="pt-BR" granularity="second" [defaultValue]="control.value"></div>`,
    );
    expect(segments(fixture)).toHaveLength(3);
  });

  it('posts the value a form can read, whatever the locale draws', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="en-US" name="t" [defaultValue]="control.value"></div>`,
    );
    const hidden = fixture.nativeElement.querySelector('[data-part="hidden-input"]');
    expect(hidden.value).toBe('14:30:00');
  });
});

describe('the keyboard the pattern lists', () => {
  const withValue = (extra = '') =>
    renderTemplate(
      `<div slTimeField locale="pt-BR" [referenceTime]="noon" [defaultValue]="control.value" ${extra}></div>`,
    );

  it('steps a segment and wraps inside it, never carrying into the next', () => {
    const fixture = withValue();
    press(fixture, 'minute', 'End');
    press(fixture, 'minute', 'ArrowUp');
    expect(text(fixture)).toEqual(['14', '00']);
  });

  it('pages by the step the contract states', () => {
    const fixture = withValue();
    press(fixture, 'minute', 'PageUp');
    expect(text(fixture)).toEqual(['14', '45']);
    press(fixture, 'hour', 'PageDown');
    expect(text(fixture)).toEqual(['11', '45']);
  });

  it('takes a segment to either edge of its own range', () => {
    const fixture = withValue();
    press(fixture, 'minute', 'Home');
    expect(text(fixture)).toEqual(['14', '00']);
    press(fixture, 'minute', 'End');
    expect(text(fixture)).toEqual(['14', '59']);
  });

  it('empties one field and leaves the rest alone', () => {
    const fixture = withValue();
    press(fixture, 'minute', 'Backspace');
    expect(text(fixture)).toEqual(['14', 'mm']);
  });

  it('takes the day period by the first letter of the locale name', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="en-US" [referenceTime]="noon" [defaultValue]="control.value"></div>`,
    );
    press(fixture, 'dayPeriod', 'a');
    expect(segmentFor(fixture, 'dayPeriod').getAttribute('aria-valuetext')).toMatch(/AM/i);
  });

  it('leaves Alt+ArrowDown for the picker above it', () => {
    const fixture = withValue();
    press(fixture, 'hour', 'ArrowDown', { altKey: true });
    expect(text(fixture)).toEqual(['14', '30']);
  });

  it('ends a run when no further digit fits under the maximum', () => {
    const fixture = renderTemplate(`<div slTimeField locale="pt-BR" [referenceTime]="noon"></div>`);
    typeDigits(fixture, 'hour', '23');
    expect(text(fixture)[0]).toBe('23');
  });
});

/**
 * The entry no surveyed implementation has: a time written as a duration from
 * now, resolved in view before it is accepted.
 */
describe('the duration expression', () => {
  const open = (seed = '+') => {
    const fixture = renderTemplate(
      `<div slTimeField locale="pt-BR" [referenceTime]="noon" (valueChange)="onRequest($event)"></div>`,
    );
    press(fixture, 'hour', seed);
    return fixture;
  };

  const write = (fixture: Fixture, value: string) => {
    const input = durationInput(fixture) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };

  it('opens on +, - and =, in place of the segments', () => {
    const fixture = open();
    expect(durationInput(fixture)).not.toBeNull();
    expect(segments(fixture)).toHaveLength(0);
    expect(root(fixture).hasAttribute('data-relative')).toBe(true);
  });

  it('resolves as the reader types, before anything commits', () => {
    const fixture = open();
    write(fixture, '+40m');
    expect(preview(fixture)?.textContent?.trim()).toBe('12:40');
    /* The chevron is the glyph element, marked to turn in a right-to-left context. */
    expect(
      preview(fixture)?.querySelector('[data-ui="icon"]')?.hasAttribute('data-directional'),
    ).toBe(true);
    expect(preview(fixture)?.querySelector('svg[data-glyph]')?.getAttribute('data-glyph')).toBe(
      'chevron-right',
    );
    expect(fixture.componentInstance.onRequest).not.toHaveBeenCalled();
  });

  it('commits on Enter and brings the segments back holding it', () => {
    const fixture = open();
    write(fixture, '+40m');
    (durationInput(fixture) as HTMLInputElement).dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
    );
    fixture.detectChanges();

    expect(text(fixture)).toEqual(['12', '40']);
    expect(fixture.componentInstance.requests[0]?.value).toEqual(plainTime(12, 40));
  });

  it('abandons on Escape, and the segments come back as they were', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="pt-BR" [referenceTime]="noon" [defaultValue]="control.value" (valueChange)="onRequest($event)"></div>`,
    );
    press(fixture, 'hour', '+');
    write(fixture, '+40m');
    (durationInput(fixture) as HTMLInputElement).dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
    );
    fixture.detectChanges();

    expect(text(fixture)).toEqual(['14', '30']);
    expect(fixture.componentInstance.onRequest).not.toHaveBeenCalled();
  });

  it('says when the duration crossed midnight, and carries it in the request', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="pt-BR" [referenceTime]="${'{'} hour: 23, minute: 0, second: 0 ${'}'}" (valueChange)="onRequest($event)"></div>`,
    );
    press(fixture, 'hour', '+');
    write(fixture, '+90m');
    expect(preview(fixture)?.hasAttribute('data-crosses-midnight')).toBe(true);

    (durationInput(fixture) as HTMLInputElement).dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.requests[0]?.value).toEqual(plainTime(0, 30));
    expect(fixture.componentInstance.requests[0]?.crossesMidnight).toBe(true);
  });

  it('is removed whole by [relative]="false"', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="pt-BR" [relative]="false" [referenceTime]="noon"></div>`,
    );
    press(fixture, 'hour', '+');
    expect(durationInput(fixture)).toBeNull();
  });
});

/**
 * The integration point React has no equivalent of, and the asymmetry
 * `references/frameworks.md` asks to be recorded rather than levelled away.
 */
describe('the form it belongs in', () => {
  it('reads and writes a reactive control', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="pt-BR" [formControl]="control" [referenceTime]="noon"></div>`,
    );
    expect(text(fixture)).toEqual(['14', '30']);

    press(fixture, 'minute', 'ArrowUp');
    expect(fixture.componentInstance.control.value).toEqual(plainTime(14, 31));
  });

  it('reports the bounds and the predicate as validity no other validator sees', () => {
    const fixture = renderTemplate(
      `<div
         slTimeField
         locale="pt-BR"
         [formControl]="control"
         [referenceTime]="noon"
         [max]="${'{'} hour: 12, minute: 0, second: 0 ${'}'}"
       ></div>`,
    );

    expect(fixture.componentInstance.control.errors?.['slottedTimeRange']).toBeTruthy();
  });

  it('answers the disabled state a form sets', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="pt-BR" [formControl]="control"></div>`,
    );
    fixture.componentInstance.control.disable();
    fixture.detectChanges();

    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
  });
});

describe('what the field around it decides', () => {
  it('takes the states from the field', () => {
    const fixture = renderTemplate(
      `<div slField invalid>
         <label slFieldLabel>Start</label>
         <div slTimeField locale="pt-BR" [defaultValue]="control.value"></div>
       </div>`,
    );
    expect(group(fixture).getAttribute('aria-invalid')).toBe('true');
  });

  it('lets an application state the clock once, and takes the locale from the language in force', () => {
    const fixture = renderTemplate(`<div slTimeField [defaultValue]="control.value"></div>`, [
      provideSlotted({ locale: 'en-US' }),
      provideTimeFieldDefaults({ hourCycle: 12 }),
    ]);
    expect(segments(fixture)).toHaveLength(3);
  });

  it('lets the control outrank the language in force', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="pt-BR" [defaultValue]="control.value"></div>`,
      [provideSlotted({ locale: 'en-US' })],
    );
    expect(text(fixture)).toEqual(['14', '30']);
  });

  it('changes its words and its time format together with the language in force', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<div slTimeField clearable aria-label="Hora" [defaultValue]="control.value"></div>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );
    const clear = () =>
      fixture.nativeElement.querySelector('[data-part="clear"]').getAttribute('aria-label');

    expect(clear()).toBe('Limpar');
    expect(text(fixture)).toEqual(['14', '30']);

    locale.set('en-US');
    fixture.detectChanges();
    expect(clear()).toBe('Clear');
    expect(segments(fixture)).toHaveLength(3);
  });

  it('lays its own messages over the language in force', () => {
    const fixture = renderTemplate(
      `<div slTimeField clearable locale="pt-BR" [messages]="{ clear: 'Limpar a hora' }" [defaultValue]="control.value"></div>`,
    );
    expect(
      fixture.nativeElement.querySelector('[data-part="clear"]').getAttribute('aria-label'),
    ).toBe('Limpar a hora');
  });

  /** A static attribute the consumer wrote survives the host bindings. */
  it('keeps a consumer aria-label rather than writing over it', () => {
    const fixture = renderTemplate(
      `<div slTimeField aria-label="Start" locale="pt-BR" [defaultValue]="control.value"></div>`,
    );
    expect(group(fixture).getAttribute('aria-label')).toBe('Start');
  });
});

describe('the adornments and the clear control', () => {
  it('puts the consumer slots on either side of the value', () => {
    const fixture = renderTemplate(
      `<div slTimeField locale="pt-BR" [defaultValue]="control.value">
         <span slTimeFieldStart>de</span>
         <span slTimeFieldEnd>BRT</span>
       </div>`,
    );

    expect(fixture.nativeElement.querySelector('[data-part="start"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-part="end"]')).not.toBeNull();
  });

  it('draws the clear control only while there is something to clear', () => {
    const empty = renderTemplate(`<div slTimeField clearable locale="pt-BR"></div>`);
    expect(empty.nativeElement.querySelector('[data-part="clear"]')).toBeNull();

    const held = renderTemplate(
      `<div slTimeField clearable locale="pt-BR" [defaultValue]="control.value"></div>`,
    );
    expect(
      held.nativeElement
        .querySelector('[data-part="clear"] svg[data-glyph]')
        ?.getAttribute('data-glyph'),
    ).toBe('x');
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
    const fixture = renderTemplate(
      `<div slTimeField granularity="second" [hourCycle]="12" [defaultValue]="control.value"></div>`,
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
