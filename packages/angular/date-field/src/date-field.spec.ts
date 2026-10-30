import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { plainDate, toISODate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/date-field/contract.json';
import { SlDateField } from './date-field';
import type { DateFieldChangeRequest } from './date-field';
import { provideDateFieldDefaults } from './date-field-defaults';
import { SlDateFieldEnd, SlDateFieldStart } from './date-field-parts';

const NINTH = plainDate(2026, 9, 9);

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlDateField,
    SlDateFieldEnd,
    SlDateFieldStart,
    SlField,
    SlFieldLabel,
  ],
  template: `<div slDateField></div>`,
})
class Host {
  readonly value = signal<PlainDate | null | undefined>(undefined);
  readonly control = new FormControl<PlainDate | null>(NINTH);
  readonly requests: DateFieldChangeRequest[] = [];
  readonly unavailable = (date: PlainDate) => date.day === 9;
  readonly onRequest = vi.fn((request: DateFieldChangeRequest) => {
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
  fixture.nativeElement.querySelector('[data-ui="date-field"]') as HTMLElement;

const segments = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="segment"]')] as HTMLElement[];

const segmentFor = (fixture: Fixture, field: string) =>
  segments(fixture).find((element) => element.dataset['field'] === field) as HTMLElement;

const text = (fixture: Fixture) =>
  segments(fixture).map((element) => (element.textContent ?? '').trim());

const press = (fixture: Fixture, element: HTMLElement, key: string) => {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  fixture.detectChanges();
};

const typeDigits = (fixture: Fixture, digits: string) => {
  for (const digit of digits) {
    const active = (fixture.nativeElement.ownerDocument.activeElement ??
      segments(fixture)[0]) as HTMLElement;
    press(fixture, active, digit);
  }
};

describe('the shape the pattern asks for', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(
      `<div slDateField clearable locale="pt-BR" [defaultValue]="{ year: 2026, month: 9, day: 9 }">
         <span slDateFieldStart>de</span>
         <span slDateFieldEnd>UTC-3</span>
       </div>`,
    );

    const member = contract.members.dateField;
    const present = [...fixture.nativeElement.querySelectorAll('[data-part]')].map(
      (element: Element) => (element as HTMLElement).dataset['part'],
    );

    expect(root(fixture).getAttribute('data-ui')).toBe(contract.ui);
    for (const part of member.parts) expect(present).toContain(part);
  });

  /**
   * A static `aria-label` is read once from the host; a name that changes —
   * a range picker naming its two ends from an input — arrives as `label`, and
   * wins over the attribute it would otherwise erase.
   */
  it('takes its accessible name from a static attribute or from the label input', () => {
    const written = renderTemplate(`<div slDateField locale="pt-BR" aria-label="Data"></div>`);
    expect(
      written.nativeElement.querySelector('[data-part="segments"]').getAttribute('aria-label'),
    ).toBe('Data');

    const bound = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Date" [label]="'Start'"></div>`,
    );
    expect(
      bound.nativeElement.querySelector('[data-part="segments"]').getAttribute('aria-label'),
    ).toBe('Start');
  });

  it('wraps three spin buttons in a group', () => {
    const fixture = renderTemplate(`<div slDateField locale="pt-BR" aria-label="Data"></div>`);

    expect(segments(fixture)).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('[data-part="segments"]').getAttribute('role')).toBe(
      'group',
    );
  });

  it('orders and separates the fields the way the locale writes them', () => {
    const brazil = renderTemplate(`<div slDateField locale="pt-BR" aria-label="Data"></div>`);
    expect(segments(brazil).map((element) => element.dataset['field'])).toEqual([
      'day',
      'month',
      'year',
    ]);

    const states = renderTemplate(`<div slDateField locale="en-US" aria-label="Date"></div>`);
    expect(segments(states).map((element) => element.dataset['field'])).toEqual([
      'month',
      'day',
      'year',
    ]);
  });

  it('writes the placeholder in the reader’s own language', () => {
    const fixture = renderTemplate(`<div slDateField locale="pt-BR" aria-label="Data"></div>`);
    expect(text(fixture)).toEqual(['dd', 'mm', 'aaaa']);
  });

  it('announces a month by name rather than by number', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" [defaultValue]="{ year: 2026, month: 9, day: 9 }"></div>`,
    );
    expect(segmentFor(fixture, 'month').getAttribute('aria-valuetext')).toBe('setembro');
  });

  it('keeps one segment in the tab sequence', () => {
    const fixture = renderTemplate(`<div slDateField locale="pt-BR" aria-label="Data"></div>`);
    const inSequence = segments(fixture).filter((element) => element.tabIndex === 0);
    expect(inSequence).toHaveLength(1);
  });
});

describe('the keyboard the pattern lists', () => {
  it('steps a segment and wraps inside it, without carrying', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" [defaultValue]="{ year: 2026, month: 12, day: 9 }"></div>`,
    );

    press(fixture, segmentFor(fixture, 'month'), 'ArrowUp');
    expect(text(fixture)).toEqual(['09', '01', '2026']);
  });

  it('pages the day by five and the year by ten', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" [defaultValue]="{ year: 2026, month: 9, day: 9 }"></div>`,
    );

    press(fixture, segmentFor(fixture, 'day'), 'PageUp');
    expect(segmentFor(fixture, 'day').textContent?.trim()).toBe('14');

    press(fixture, segmentFor(fixture, 'year'), 'PageUp');
    expect(segmentFor(fixture, 'year').textContent?.trim()).toBe('2036');
  });

  it('goes to the ends of a segment, and the day knows its own month', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" [defaultValue]="{ year: 2026, month: 2, day: 9 }"></div>`,
    );

    press(fixture, segmentFor(fixture, 'day'), 'End');
    expect(segmentFor(fixture, 'day').textContent?.trim()).toBe('28');

    press(fixture, segmentFor(fixture, 'day'), 'Home');
    expect(segmentFor(fixture, 'day').textContent?.trim()).toBe('01');
  });

  it('walks between segments in the writing order', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" [defaultValue]="{ year: 2026, month: 9, day: 9 }"></div>`,
    );

    press(fixture, segmentFor(fixture, 'day'), 'ArrowRight');
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(segmentFor(fixture, 'month'));
  });

  it('empties one segment without touching the others', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" [defaultValue]="{ year: 2026, month: 9, day: 9 }"></div>`,
    );

    press(fixture, segmentFor(fixture, 'month'), 'Backspace');
    expect(text(fixture)).toEqual(['09', 'mm', '2026']);
  });

  /**
   * The behavior no surveyed implementation has: 31 January stepped forward is
   * 28 February, and stepped forward again it is 31 March rather than the 28th.
   */
  it('gives back the day a short month could not hold', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" [defaultValue]="{ year: 2026, month: 1, day: 31 }"></div>`,
    );

    press(fixture, segmentFor(fixture, 'month'), 'ArrowUp');
    expect(text(fixture)).toEqual(['28', '02', '2026']);

    press(fixture, segmentFor(fixture, 'month'), 'ArrowUp');
    expect(text(fixture)).toEqual(['31', '03', '2026']);
  });

  it('does not answer keys while it is read-only, and still walks', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" readOnly [defaultValue]="{ year: 2026, month: 9, day: 9 }"></div>`,
    );

    press(fixture, segmentFor(fixture, 'day'), 'ArrowUp');
    expect(segmentFor(fixture, 'day').textContent?.trim()).toBe('09');

    press(fixture, segmentFor(fixture, 'day'), 'ArrowRight');
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(segmentFor(fixture, 'month'));
  });
});

describe('the value the segments make', () => {
  it('posts the ISO string a plain form reads', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" name="vencimento" [defaultValue]="{ year: 2026, month: 9, day: 9 }"></div>`,
    );

    const hidden = fixture.nativeElement.querySelector(
      '[data-part="hidden-input"]',
    ) as HTMLInputElement;
    expect(hidden.value).toBe(toISODate(NINTH));
    expect(hidden.name).toBe('vencimento');
  });

  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the segments, the reason and `cancel()`. A `[(value)]` has one slot and
   * could carry none of them.
   */
  it('emits one request carrying the reason and the segments', () => {
    const fixture = renderTemplate(
      `<div
         slDateField
         locale="pt-BR"
         aria-label="Data"
         [defaultValue]="{ year: 2026, month: 9, day: 9 }"
         (valueChange)="onRequest($event)"
       ></div>`,
    );

    press(fixture, segmentFor(fixture, 'day'), 'ArrowUp');

    const request = fixture.componentInstance.requests[0];
    expect(request?.reason).toBe('keyboard');
    expect(request?.segments.day).toBe(10);
    expect(request?.previous).toEqual(NINTH);
  });

  it('lets the consumer refuse a change before it commits', () => {
    const fixture = renderTemplate(
      `<div
         slDateField
         locale="pt-BR"
         aria-label="Data"
         [defaultValue]="{ year: 2026, month: 9, day: 9 }"
         (valueChange)="$event.cancel()"
         [formControl]="control"
       ></div>`,
    );

    press(fixture, segmentFor(fixture, 'day'), 'ArrowUp');
    /* The form never heard about it, which is what a cancelled request means. */
    expect(fixture.componentInstance.control.value).toEqual(NINTH);
  });

  it('moves the display on every digit and the value only when a run ends', () => {
    const fixture = renderTemplate(
      `<div
         slDateField
         locale="pt-BR"
         aria-label="Data"
         (valueChange)="onRequest($event)"
       ></div>`,
    );

    segmentFor(fixture, 'day').focus();
    typeDigits(fixture, '09092026');

    expect(fixture.componentInstance.requests).toHaveLength(1);
    expect(fixture.componentInstance.requests[0]?.value).toEqual(NINTH);
  });
});

describe('the form it belongs in', () => {
  /**
   * The asymmetry `frameworks.md` asks to be recorded rather than levelled
   * away: Angular has `ControlValueAccessor` and `Validator` and React has no
   * equivalent, so the Angular binding uses both.
   */
  it('reads and writes a reactive form control', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" [formControl]="control"></div>`,
    );

    expect(text(fixture)).toEqual(['09', '09', '2026']);

    press(fixture, segmentFor(fixture, 'day'), 'ArrowUp');
    expect(fixture.componentInstance.control.value).toEqual(plainDate(2026, 9, 10));
  });

  it('answers a form disabled from the model', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" [formControl]="control"></div>`,
    );

    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
  });

  /** The rules no other validator can see, reported as form errors. */
  it('reports a date outside the bounds as a form error', () => {
    const fixture = renderTemplate(
      `<div
         slDateField
         locale="pt-BR"
         aria-label="Data"
         [formControl]="control"
         [min]="{ year: 2026, month: 10, day: 1 }"
       ></div>`,
    );

    expect(fixture.componentInstance.control.errors).toMatchObject({ slottedDateRange: {} });
  });

  it('reports a refused date as a form error', () => {
    const fixture = renderTemplate(
      `<div
         slDateField
         locale="pt-BR"
         aria-label="Data"
         [formControl]="control"
         [isDateUnavailable]="unavailable"
       ></div>`,
    );

    expect(fixture.componentInstance.control.errors).toMatchObject({ slottedDateUnavailable: {} });
  });
});

describe('the pointer', () => {
  const press = (fixture: Fixture, element: HTMLElement) => {
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  /**
   * A press that landed on the frame's own padding did nothing at all, and the
   * pointer over it was an arrow — the reader saw a control that looked like a
   * text field and answered like a picture.
   */
  it('takes a press on the frame to the first field still waiting', () => {
    const fixture = renderTemplate(`<div slDateField locale="pt-BR" aria-label="Data"></div>`);

    press(fixture, root(fixture));
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(segmentFor(fixture, 'day'));
  });

  it('takes it to the first empty field when the others are filled', () => {
    const fixture = renderTemplate(`<div slDateField locale="pt-BR" aria-label="Data"></div>`);

    segmentFor(fixture, 'day').focus();
    typeDigits(fixture, '0909');
    press(fixture, fixture.nativeElement.querySelector('[data-part="segments"]') as HTMLElement);
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(segmentFor(fixture, 'year'));
  });

  it('leaves a press on the clear button to the clear button', () => {
    const fixture = renderTemplate(
      `<div slDateField clearable locale="pt-BR" aria-label="Data" [defaultValue]="{ year: 2026, month: 9, day: 9 }"></div>`,
    );

    press(fixture, fixture.nativeElement.querySelector('[data-part="clear"]') as HTMLElement);
    expect(fixture.nativeElement.ownerDocument.activeElement).not.toBe(segmentFor(fixture, 'day'));
  });

  it('takes a press on one field to that field', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" [defaultValue]="{ year: 2026, month: 9, day: 9 }"></div>`,
    );

    press(fixture, segmentFor(fixture, 'year'));
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(segmentFor(fixture, 'year'));
  });
});

describe('what the field around it says', () => {
  it('takes disabled, invalid and required from the field', () => {
    const fixture = renderTemplate(
      `<div slField disabled invalid required>
         <label slFieldLabel>Vencimento</label>
         <div slDateField locale="pt-BR"></div>
       </div>`,
    );

    const element = root(fixture);
    expect(element.hasAttribute('data-disabled')).toBe(true);
    expect(element.hasAttribute('data-invalid')).toBe(true);
    expect(element.hasAttribute('data-required')).toBe(true);
  });

  it('states its own invalidity when the value is outside the bounds', () => {
    const fixture = renderTemplate(
      `<div
         slDateField
         locale="pt-BR"
         aria-label="Data"
         [defaultValue]="{ year: 2026, month: 1, day: 1 }"
         [min]="{ year: 2026, month: 9, day: 9 }"
       ></div>`,
    );
    expect(root(fixture).hasAttribute('data-invalid')).toBe(true);
  });
});

describe('what an application sets once', () => {
  it('takes the appearance from a provider and the locale from the language in force', () => {
    const fixture = renderTemplate(
      `<div slDateField aria-label="Date" [defaultValue]="{ year: 2026, month: 9, day: 9 }"></div>`,
      [
        provideSlotted({ locale: 'ja-JP' }),
        provideDateFieldDefaults({ size: 'lg', variant: 'subtle' }),
      ],
    );

    expect(segments(fixture).map((element) => element.dataset['field'])).toEqual([
      'year',
      'month',
      'day',
    ]);
    expect(root(fixture).getAttribute('data-size')).toBe('lg');
    expect(root(fixture).getAttribute('data-variant')).toBe('subtle');
  });

  it('lets one control outrank the language in force', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data" [defaultValue]="{ year: 2026, month: 9, day: 9 }"></div>`,
      [provideSlotted({ locale: 'ja-JP' })],
    );

    expect(segments(fixture).map((element) => element.dataset['field'])).toEqual([
      'day',
      'month',
      'year',
    ]);
  });

  it('changes its words and its date order together with the language in force', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<div slDateField clearable aria-label="Data" [defaultValue]="{ year: 2026, month: 9, day: 9 }"></div>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );
    const clear = () =>
      fixture.nativeElement.querySelector('[data-part="clear"]').getAttribute('aria-label');
    const order = () => segments(fixture).map((element) => element.dataset['field']);

    expect(clear()).toBe('Limpar');
    expect(order()).toEqual(['day', 'month', 'year']);

    locale.set('en-US');
    fixture.detectChanges();
    expect(clear()).toBe('Clear');
    expect(order()).toEqual(['month', 'day', 'year']);
  });
});

describe('the composition surface', () => {
  it('clears from the button, with the clear reason', () => {
    const fixture = renderTemplate(
      `<div
         slDateField
         clearable
         locale="pt-BR"
         aria-label="Data"
         [defaultValue]="{ year: 2026, month: 9, day: 9 }"
         (valueChange)="onRequest($event)"
       ></div>`,
    );

    const clear = fixture.nativeElement.querySelector('[data-part="clear"]') as HTMLButtonElement;
    expect(clear.querySelector('svg[data-glyph]')?.getAttribute('data-glyph')).toBe('x');
    clear.click();
    fixture.detectChanges();

    expect(text(fixture)).toEqual(['dd', 'mm', 'aaaa']);
    expect(fixture.componentInstance.requests[0]?.reason).toBe('clear');
  });

  /** A template reaches the instance, which is what `exportAs` is for. */
  it('hands a template the instance and its imperative actions', () => {
    const fixture = renderTemplate(
      `<div
         slDateField
         #picker="slDateField"
         locale="pt-BR"
         aria-label="Data"
         [defaultValue]="{ year: 2026, month: 9, day: 9 }"
       ></div>
       <button type="button" (click)="picker.clear()">Limpar</button>`,
    );

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(text(fixture)).toEqual(['dd', 'mm', 'aaaa']);
  });

  /**
   * A static attribute the consumer wrote is read before the host binding
   * computes, so the binding never writes over it — the rule the briefing
   * records for every Angular directive in this library.
   */
  it('keeps a label the consumer wrote on the host', () => {
    const fixture = renderTemplate(
      `<div slDateField locale="pt-BR" aria-label="Data de vencimento"></div>`,
    );

    expect(
      fixture.nativeElement.querySelector('[data-part="segments"]').getAttribute('aria-label'),
    ).toBe('Data de vencimento');
  });
});
