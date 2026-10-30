import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { plainTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/time-picker/contract.json';
import { SlTimePicker } from './time-picker';
import { provideTimePickerDefaults } from './time-picker-defaults';
import { SlTimePickerOption } from './time-picker-option';
import { SlTimePickerFooter, SlTimePickerPresets } from './time-picker-parts';

const TEN = plainTime(10, 0);
const NOON = plainTime(12, 0);

@Component({
  standalone: true,
  imports: [SlTimePicker, SlTimePickerFooter, SlTimePickerOption, SlTimePickerPresets],
  template: `<div slTimePicker></div>`,
})
class Host {
  readonly ten = TEN;
  readonly noon = NOON;
  readonly nine = plainTime(9, 0);
  readonly eleven = plainTime(11, 0);
  readonly clinic = [plainTime(9, 0), plainTime(9, 20), plainTime(13, 45)];
  readonly marks = [plainTime(0, 0, 15), plainTime(0, 0, 30)];
  readonly value = signal<PlainTime | null | undefined>(undefined);
  readonly refusesTen = (time: PlainTime) => time.hour === 10;
  readonly refusesAll = () => true;
  readonly requests: ChangeRequest<PlainTime | null>[] = [];
  readonly onRequest = vi.fn((request: ChangeRequest<PlainTime | null>) => {
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

const BOUNDS = `locale="pt-BR" [referenceTime]="noon" [min]="nine" [max]="eleven"`;

const root = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-ui="time-picker"][data-part="root"]') as HTMLElement;
const trigger = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="trigger"]') as HTMLButtonElement;
const content = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="content"]') as HTMLElement | null;
const options = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="option"]')] as HTMLElement[];
const labels = (fixture: Fixture) =>
  options(fixture).map((element) => (element.textContent ?? '').trim());
const optionFor = (fixture: Fixture, label: string) =>
  options(fixture).find((element) => (element.textContent ?? '').trim() === label) as HTMLElement;
const highlighted = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="option"][data-current]') as HTMLElement | null;

const pressList = (fixture: Fixture, key: string) => {
  fixture.nativeElement
    .querySelector('[data-part="list"]')
    ?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }));
  fixture.detectChanges();
};

describe('what it is made of', () => {
  it('renders the field, and keeps its identifier separate from its own', () => {
    const fixture = renderTemplate(`<div slTimePicker ${BOUNDS} defaultOpen></div>`);

    expect(fixture.nativeElement.querySelector('[data-ui="time-field"]')).not.toBeNull();
    expect(root(fixture).dataset['ui']).toBe(contract.ui);
  });

  it('declares every part the contract names', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen>
         <div slTimePickerPresets><button type="button">Turno</button></div>
         <div slTimePickerFooter><button type="button">Aplicar</button></div>
       </div>`,
    );

    const present = [
      ...fixture.nativeElement.querySelectorAll('[data-ui="time-picker"] [data-part]'),
    ].map((element) => (element as HTMLElement).dataset['part']);
    for (const part of [
      'control',
      'trigger',
      'content',
      'head',
      'now',
      'presets',
      'list',
      'option',
      'footer',
    ]) {
      expect(present).toContain(part);
    }
  });

  /**
   * One shape, one role. A column per unit was drawn and withdrawn, so the
   * trigger says the same thing in every configuration the family has.
   */
  it('is a listbox, and the trigger says so', () => {
    const fixture = renderTemplate(`<div slTimePicker ${BOUNDS} defaultOpen></div>`);

    expect(content(fixture)?.getAttribute('role')).toBe('listbox');
    expect(trigger(fixture).getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('true');
  });

  it('draws a whole time on every row', () => {
    const fixture = renderTemplate(`<div slTimePicker ${BOUNDS} defaultOpen step="1800"></div>`);
    expect(labels(fixture)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
  });

  /** The mark is a `Glyph` element inside an `Icon` box, never a mask. */
  it('draws the clock on the trigger as a glyph element', () => {
    const fixture = renderTemplate(`<div slTimePicker ${BOUNDS}></div>`);
    const mark = trigger(fixture).querySelector("[data-ui='icon'] > svg[data-glyph]");
    expect(mark?.getAttribute('data-glyph')).toBe('clock');
  });
});

describe('the list the consumer configures', () => {
  /**
   * The half of the columns question a decline had to answer: no step describes
   * a clinic open at 09:00, 09:20 and 13:45.
   */
  it('offers exactly the times it was given, in the order it was given them', () => {
    const fixture = renderTemplate(
      `<div slTimePicker locale="pt-BR" [referenceTime]="noon" defaultOpen [options]="clinic"></div>`,
    );
    expect(labels(fixture)).toEqual(['09:00', '09:20', '13:45']);
  });

  it('offers seconds when the consumer states them', () => {
    const fixture = renderTemplate(
      `<div slTimePicker locale="pt-BR" [referenceTime]="noon" defaultOpen granularity="second" [options]="marks"></div>`,
    );
    expect(labels(fixture)).toEqual(['00:00:15', '00:00:30']);
  });

  it('cuts a list that would run past the cap, and says so in the DOM', () => {
    const fixture = renderTemplate(
      `<div slTimePicker locale="pt-BR" [referenceTime]="noon" defaultOpen step="1"></div>`,
    );

    expect(options(fixture)).toHaveLength(1440);
    expect(
      fixture.nativeElement.querySelector('[data-part="list"]').hasAttribute('data-truncated'),
    ).toBe(true);
    expect(content(fixture)?.hasAttribute('aria-description')).toBe(true);
  });

  it('marks what a bound or the predicate refuses, and can hide it instead', () => {
    const disabled = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen step="3600" [isTimeUnavailable]="refusesTen"></div>`,
    );
    expect(optionFor(disabled, '10:00').getAttribute('aria-disabled')).toBe('true');

    const hidden = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen step="3600" unavailableOptions="hide" [isTimeUnavailable]="refusesTen"></div>`,
    );
    expect(labels(hidden)).toEqual(['09:00', '11:00']);
  });

  it('says so when no time is available at all, rather than drawing an empty box', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen unavailableOptions="hide" [isTimeUnavailable]="refusesAll"></div>`,
    );

    expect(fixture.nativeElement.querySelector('[data-part="empty"]')).not.toBeNull();
    expect(options(fixture)).toHaveLength(0);
  });

  /** `NgTemplateOutlet`, because the row is re-rendered once per option. */
  it('lets the consumer draw the row without owning it', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen step="3600">
         <ng-template slTimePickerOption let-time let-label="label">
           <span data-testid="row">{{ label }} ·</span>
         </ng-template>
       </div>`,
    );

    const first = fixture.nativeElement.querySelector('[data-testid="row"]');
    expect((first.textContent ?? '').trim()).toBe('09:00 ·');
  });
});

describe('opening, choosing and closing', () => {
  it('opens on the chosen time', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen step="1800" [defaultValue]="ten"></div>`,
    );
    expect((highlighted(fixture)?.textContent ?? '').trim()).toBe('10:00');
  });

  it('chooses on a press and closes, because one press finished the value', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen step="3600" (valueChange)="onRequest($event)"></div>`,
    );

    optionFor(fixture, '10:00').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.requests[0]?.value).toEqual(TEN);
    expect(content(fixture)).toBeNull();
  });

  it('stays open when the consumer says never', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen step="3600" closeOnSelect="never"></div>`,
    );

    optionFor(fixture, '10:00').click();
    fixture.detectChanges();
    expect(content(fixture)).not.toBeNull();
  });

  it('refuses a press on a time a bound or the predicate refuses', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen step="3600" [isTimeUnavailable]="refusesTen" (valueChange)="onRequest($event)"></div>`,
    );

    optionFor(fixture, '10:00').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.onRequest).not.toHaveBeenCalled();
  });

  it('writes the current time from the control at the head', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen (valueChange)="onRequest($event)"></div>`,
    );

    (fixture.nativeElement.querySelector('[data-part="now"]') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.requests[0]?.value).toEqual(NOON);
  });

  it('names the trigger with the chosen time, which is where focus returns', () => {
    const fixture = renderTemplate(`<div slTimePicker ${BOUNDS} [defaultValue]="ten"></div>`);
    expect(trigger(fixture).getAttribute('aria-label')).toMatch(/10/);
  });
});

describe('the keyboard the pattern lists', () => {
  it('moves the highlight without moving the value', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen step="1800" [defaultValue]="ten" (valueChange)="onRequest($event)"></div>`,
    );

    pressList(fixture, 'ArrowDown');
    expect((highlighted(fixture)?.textContent ?? '').trim()).toBe('10:30');
    expect(fixture.componentInstance.onRequest).not.toHaveBeenCalled();
  });

  it('takes the highlight to either end', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen step="1800" [defaultValue]="ten"></div>`,
    );

    pressList(fixture, 'End');
    expect((highlighted(fixture)?.textContent ?? '').trim()).toBe('11:00');
    pressList(fixture, 'Home');
    expect((highlighted(fixture)?.textContent ?? '').trim()).toBe('09:00');
  });

  /** The coarse axis, without spending a row of the list on a heading. */
  it('pages one hour boundary at a time', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen step="900" [defaultValue]="ten"></div>`,
    );

    pressList(fixture, 'PageUp');
    expect((highlighted(fixture)?.textContent ?? '').trim()).toBe('09:00');
    pressList(fixture, 'PageDown');
    expect((highlighted(fixture)?.textContent ?? '').trim()).toBe('10:00');
  });

  it('chooses on Enter', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen step="1800" [defaultValue]="ten" (valueChange)="onRequest($event)"></div>`,
    );

    pressList(fixture, 'ArrowDown');
    pressList(fixture, 'Enter');
    expect(fixture.componentInstance.requests[0]?.value).toEqual(plainTime(10, 30));
  });

  /**
   * The panel complements the typing and does not replace it, which is what
   * `docs/component-features.md` §6 asks for.
   */
  it('opens from the field and leaves focus in it', () => {
    const fixture = renderTemplate(`<div slTimePicker ${BOUNDS} [defaultValue]="ten"></div>`);

    const segment = fixture.nativeElement.querySelector('[data-part="segment"]') as HTMLElement;
    segment.focus();
    segment.dispatchEvent(
      new KeyboardEvent('keydown', { altKey: true, bubbles: true, key: 'ArrowDown' }),
    );
    fixture.detectChanges();

    expect(content(fixture)).not.toBeNull();
    expect(document.activeElement).toBe(segment);
  });
});

describe('what the consumer sets once', () => {
  it('lets an application state the step once', () => {
    const fixture = renderTemplate(`<div slTimePicker ${BOUNDS} defaultOpen></div>`, [
      provideTimePickerDefaults({ step: 3600 }),
    ]);

    expect(labels(fixture)).toEqual(['09:00', '10:00', '11:00']);
  });

  it('changes its words and its time format together with the language in force', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<div slTimePicker [referenceTime]="noon" [min]="nine" [max]="eleven" [defaultValue]="ten"></div>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );
    const name = () => trigger(fixture).getAttribute('aria-label') ?? '';

    // language: pt-BR
    expect(name()).toMatch(/^Alterar horário, /);
    // language: en-US
    expect(name()).toContain('10:00');

    locale.set('en-US');
    fixture.detectChanges();
    expect(name()).toMatch(/^Change time, /);
    expect(name()).toMatch(/10:00\sAM/);
  });

  it('lays its own messages over the language in force', () => {
    const fixture = renderTemplate(
      `<div slTimePicker ${BOUNDS} defaultOpen [messages]="{ now: 'Agora' }"></div>`,
    );

    expect(
      (fixture.nativeElement.querySelector('[data-part="now"]').textContent ?? '').trim(),
    ).toBe('Agora');
  });

  it('lets the picker outrank the provider', () => {
    const fixture = renderTemplate(`<div slTimePicker ${BOUNDS} defaultOpen step="1800"></div>`, [
      provideTimePickerDefaults({ step: 3600 }),
    ]);
    expect(labels(fixture)).toHaveLength(5);
  });
});

describe('the escape hatches', () => {
  it('opens and closes through the instance a template can reach', () => {
    const fixture = renderTemplate(
      `<div slTimePicker #picker="slTimePicker" ${BOUNDS}></div>
       <button type="button" (click)="picker.openSurface()">open</button>`,
    );

    (fixture.nativeElement.querySelector('button:not([data-part])') as HTMLElement).click();
    fixture.detectChanges();
    expect(content(fixture)).not.toBeNull();
  });

  it('answers no press at all while it is disabled', () => {
    const fixture = renderTemplate(`<div slTimePicker ${BOUNDS} disabled></div>`);
    expect(trigger(fixture).disabled).toBe(true);
  });
});
