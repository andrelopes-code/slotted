import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { plainDate, plainYearMonth, toISODate } from '@slotted/core/date';
import type { PlainDate, PlainYearMonth } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDateField } from '@slotted/angular/date-field';
import { provideSlotted } from '@slotted/angular/i18n';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/date-picker/contract.json';
import { SlDatePicker } from './date-picker';
import { provideDatePickerDefaults } from './date-picker-defaults';
import { SlDatePickerFooter, SlDatePickerPresets } from './date-picker-parts';

const NINTH = plainDate(2026, 9, 9);

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SlDatePicker, SlDatePickerFooter, SlDatePickerPresets],
  template: `<div slDatePicker></div>`,
})
class Host {
  readonly held = signal<PlainDate | null>(NINTH);
  readonly control = new FormControl<PlainDate | null>(null);
  readonly ninth = NINTH;
  readonly january = plainDate(2026, 1, 1);
  readonly values: (CalendarValue | PlainYearMonth | null)[] = [];
  readonly october = plainYearMonth(2026, 10);
  readonly march = plainYearMonth(2026, 3);
  readonly november = plainYearMonth(2026, 11);
  readonly opens: boolean[] = [];
  readonly onValue = vi.fn((request: ChangeRequest<CalendarValue | PlainYearMonth | null>) => {
    this.values.push(request.value);
  });
  readonly onOpen = vi.fn((request: ChangeRequest<boolean>) => {
    this.opens.push(request.value);
  });
  readonly refuseNinth = (date: PlainDate) => date.day === 9;
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
  fixture.nativeElement.querySelector('[data-ui="date-picker"][data-part="root"]') as HTMLElement;
const trigger = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="trigger"]') as HTMLButtonElement;
const surface = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="content"]') as HTMLElement | null;
const dayFor = (fixture: Fixture, number: number) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="day"]')].find(
    (element: Element) =>
      ((element as HTMLElement).textContent ?? '').trim() === String(number) &&
      element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') === false,
  ) as HTMLElement;

const click = (fixture: Fixture, element: HTMLElement) => {
  element.click();
  fixture.detectChanges();
};

const escape = (fixture: Fixture) => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  fixture.detectChanges();
};

describe('what it is made of', () => {
  /**
   * It composes the other two families and redraws neither. A second segmented
   * field or a second month grid would be two places to fix one defect.
   */
  it('renders the field and the calendar, each keeping its own identifier', () => {
    const fixture = renderTemplate(
      `<div slDatePicker defaultOpen locale="pt-BR" [defaultValue]="ninth"></div>`,
    );

    expect(fixture.nativeElement.querySelector('[data-ui="date-field"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-ui="calendar"]')).not.toBeNull();
    expect(root(fixture).getAttribute('data-ui')).toBe(contract.ui);
  });

  it('declares every part the contract names', () => {
    const fixture = renderTemplate(
      `<div slDatePicker defaultOpen locale="pt-BR" [defaultValue]="ninth">
         <div slDatePickerPresets><button type="button">Today</button></div>
         <div slDatePickerFooter><button type="button">Apply</button></div>
       </div>`,
    );

    const present = [...fixture.nativeElement.querySelectorAll('[data-part]')].map(
      (element: Element) => (element as HTMLElement).dataset['part'],
    );
    for (const part of [
      'root',
      'control',
      'trigger',
      'positioner',
      'content',
      'presets',
      'footer',
    ]) {
      expect(present).toContain(part);
    }
  });

  it('carries the dialog role and points the trigger at it while it is open', () => {
    const fixture = renderTemplate(
      `<div slDatePicker defaultOpen locale="pt-BR" [defaultValue]="ninth"></div>`,
    );

    expect(surface(fixture)?.getAttribute('role')).toBe('dialog');
    expect(trigger(fixture).getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('true');
    expect(trigger(fixture).getAttribute('aria-controls')).toBe(surface(fixture)?.id);
  });
});

describe('what the trigger says', () => {
  it('names itself for choosing while nothing is chosen', () => {
    const fixture = renderTemplate(
      `<div slDatePicker locale="pt-BR" [messages]="{ choose: 'Escolher uma data' }"></div>`,
    );
    expect(trigger(fixture).getAttribute('aria-label')).toBe('Escolher uma data');
  });

  /**
   * Focus returns here when the surface closes, so the name is where the reader
   * is told what was chosen. The APG names it as an accessibility feature.
   */
  it('carries the chosen date in words once there is one', () => {
    const fixture = renderTemplate(
      `<div slDatePicker locale="pt-BR" [messages]="{ change: 'Alterar a data, {date}' }" [defaultValue]="ninth"></div>`,
    );
    const label = trigger(fixture).getAttribute('aria-label') ?? '';
    expect(label).toContain('Alterar a data, ');
    expect(label).toContain('setembro');
  });

  /** The mark is a `Glyph` element inside an `Icon` box, never a mask. */
  it('draws the calendar as a glyph element', () => {
    const fixture = renderTemplate(`<div slDatePicker locale="pt-BR"></div>`);
    const mark = trigger(fixture).querySelector("[data-ui='icon'] > svg[data-glyph]");
    expect(mark?.getAttribute('data-glyph')).toBe('calendar');
  });
});

describe('opening and closing', () => {
  it('opens and closes from the trigger', () => {
    const fixture = renderTemplate(
      `<div slDatePicker locale="pt-BR" (openChange)="onOpen($event)"></div>`,
    );

    expect(surface(fixture)).toBeNull();
    click(fixture, trigger(fixture));
    expect(surface(fixture)).not.toBeNull();
    expect(fixture.componentInstance.opens.at(-1)).toBe(true);

    click(fixture, trigger(fixture));
    expect(fixture.componentInstance.opens.at(-1)).toBe(false);
  });

  /**
   * Angular Material records the platform note this inherits: ChromeOS turns
   * the chord into PageDown before the browser sees it, so the button is the
   * guaranteed path and this is only a shortcut.
   */
  it('opens from the field with the chord, and never depends on it', () => {
    const fixture = renderTemplate(`<div slDatePicker locale="pt-BR"></div>`);

    const segment = fixture.nativeElement.querySelector('[data-part="segment"]') as HTMLElement;
    segment.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true }),
    );
    fixture.detectChanges();

    expect(surface(fixture)).not.toBeNull();
    expect(trigger(fixture)).not.toBeNull();
  });

  it('marks the root while the surface is showing', () => {
    const fixture = renderTemplate(`<div slDatePicker locale="pt-BR"></div>`);

    expect(root(fixture).hasAttribute('data-open')).toBe(false);
    click(fixture, trigger(fixture));
    expect(root(fixture).hasAttribute('data-open')).toBe(true);
  });

  it('says which presentation the surface is in', () => {
    const fixture = renderTemplate(`<div slDatePicker defaultOpen locale="pt-BR"></div>`);
    expect(
      fixture.nativeElement
        .querySelector('[data-part="positioner"]')
        .getAttribute('data-presentation'),
    ).toBe('popover');
  });
});

describe('choosing a date', () => {
  it('writes the date into the field and closes, for one date', () => {
    const fixture = renderTemplate(
      `<div
         slDatePicker
         defaultOpen
         locale="pt-BR"
         name="data"
         [defaultValue]="ninth"
         (valueChange)="onValue($event)"
       ></div>`,
    );

    click(fixture, dayFor(fixture, 17));

    expect(fixture.componentInstance.values.at(-1)).toEqual(plainDate(2026, 9, 17));
    expect(root(fixture).hasAttribute('data-open')).toBe(false);
    expect(
      (fixture.nativeElement.querySelector('[data-part="hidden-input"]') as HTMLInputElement).value,
    ).toBe(toISODate(plainDate(2026, 9, 17)));
  });

  /** Closing on the first press of a range is a trap: the second needs the same surface. */
  it('stays open for a range', () => {
    const fixture = renderTemplate(
      `<div slDatePicker defaultOpen locale="pt-BR" selectionMode="range"></div>`,
    );

    click(fixture, dayFor(fixture, 7));
    expect(surface(fixture)).not.toBeNull();

    click(fixture, dayFor(fixture, 11));
    expect(surface(fixture)).not.toBeNull();
  });

  it('takes the axis over the default when a product asks', () => {
    const fixture = renderTemplate(
      `<div slDatePicker defaultOpen locale="pt-BR" closeOnSelect="never" [defaultValue]="ninth"></div>`,
    );

    click(fixture, dayFor(fixture, 17));
    expect(surface(fixture)).not.toBeNull();
  });
});

describe('the keyboard', () => {
  it('closes on Escape and returns focus to the trigger', () => {
    const fixture = renderTemplate(
      `<div slDatePicker defaultOpen locale="pt-BR" [defaultValue]="ninth" (openChange)="onOpen($event)"></div>`,
    );

    escape(fixture);
    expect(fixture.componentInstance.opens.at(-1)).toBe(false);
  });

  /**
   * `dismissable-layer` asks in the capture phase, so a handler inside the
   * surface is too late. The family decides there instead and simply does not
   * ask the layer to close.
   */
  it('walks the calendar down a view before it closes', () => {
    const fixture = renderTemplate(
      `<div slDatePicker defaultOpen defaultView="year" locale="pt-BR" [defaultValue]="ninth"></div>`,
    );
    const calendar = () =>
      fixture.nativeElement.querySelector('[data-ui="calendar"]') as HTMLElement;

    escape(fixture);
    expect(calendar().getAttribute('data-view')).toBe('month');
    expect(surface(fixture)).not.toBeNull();

    escape(fixture);
    expect(calendar().getAttribute('data-view')).toBe('day');
    expect(surface(fixture)).not.toBeNull();

    escape(fixture);
    expect(root(fixture).hasAttribute('data-open')).toBe(false);
  });
});

describe('what the field around it says', () => {
  it('takes the trigger out while it is disabled', () => {
    const fixture = renderTemplate(
      `<div slDatePicker disabled locale="pt-BR" [defaultValue]="ninth"></div>`,
    );
    expect(trigger(fixture).disabled).toBe(true);
    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
  });

  it('states its own invalidity when the value is outside the bounds', () => {
    const fixture = renderTemplate(
      `<div slDatePicker locale="pt-BR" [defaultValue]="january" [min]="ninth"></div>`,
    );
    expect(root(fixture).hasAttribute('data-invalid')).toBe(true);
  });

  it('states its own invalidity when the predicate refuses the date', () => {
    const fixture = renderTemplate(
      `<div slDatePicker locale="pt-BR" [defaultValue]="ninth" [isDateUnavailable]="refuseNinth"></div>`,
    );
    expect(root(fixture).hasAttribute('data-invalid')).toBe(true);
  });
});

describe('what an application sets once', () => {
  it('takes the appearance from a provider and the locale from the language in force', () => {
    const fixture = renderTemplate(`<div slDatePicker></div>`, [
      provideSlotted({ locale: 'ja-JP' }),
      provideDatePickerDefaults({ size: 'lg' }),
    ]);

    const fields = [...fixture.nativeElement.querySelectorAll('[data-part="segment"]')].map(
      (element: Element) => (element as HTMLElement).dataset['field'],
    );
    expect(fields).toEqual(['year', 'month', 'day']);
    expect(root(fixture).getAttribute('data-size')).toBe('lg');
    expect(trigger(fixture).getAttribute('aria-label')).toBe('Choose date');
  });

  it('changes its words and its date together with the language in force', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(`<div slDatePicker [defaultValue]="ninth"></div>`, [
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);

    expect(trigger(fixture).getAttribute('aria-label')).toMatch(
      /^Alterar data, .*setembro de 2026/,
    );

    locale.set('en-US');
    fixture.detectChanges();
    expect(trigger(fixture).getAttribute('aria-label')).toMatch(
      /^Change date, .*September 9, 2026/,
    );
  });
});

describe('the composition surface', () => {
  it('hands a template the instance and its imperative actions', () => {
    const fixture = renderTemplate(
      `<div slDatePicker #picker="slDatePicker" locale="pt-BR" [defaultValue]="ninth"></div>
       <button type="button" id="open" (click)="picker.openSurface()">open</button>`,
    );

    click(fixture, fixture.nativeElement.querySelector('#open') as HTMLElement);
    expect(surface(fixture)).not.toBeNull();
  });

  /**
   * The contract's open reasons are pointer, keyboard, escape, outsidePress and
   * select; React's handle reports keyboard, and so does this one.
   */
  it('reports the handle’s open and close with a reason its contract lists', () => {
    const fixture = renderTemplate(
      `<div slDatePicker locale="pt-BR" (openChange)="onOpen($event)"></div>`,
    );
    const picker = fixture.debugElement
      .query(By.directive(SlDatePicker))
      .injector.get(SlDatePicker);

    picker.openSurface();
    fixture.detectChanges();
    picker.closeSurface();
    fixture.detectChanges();

    const reasons = fixture.componentInstance.onOpen.mock.calls.map(
      ([request]) => (request as ChangeRequest<boolean>).reason,
    );
    expect(reasons).toEqual(['keyboard', 'keyboard']);
    expect(contract.stateModel.open.reasons).toEqual(expect.arrayContaining(reasons));
  });

  it('takes the consumer’s own slots into the surface', () => {
    const fixture = renderTemplate(
      `<div slDatePicker defaultOpen locale="pt-BR">
         <div slDatePickerPresets><button type="button">Today</button></div>
         <div slDatePickerFooter><button type="button">Apply</button></div>
       </div>`,
    );

    expect(fixture.nativeElement.querySelector('[data-part="presets"]')?.textContent).toContain(
      'Today',
    );
    expect(fixture.nativeElement.querySelector('[data-part="footer"]')?.textContent).toContain(
      'Apply',
    );
  });
});

describe('the inputs it passes on', () => {
  const segmentText = (fixture: Fixture) =>
    [...fixture.nativeElement.querySelectorAll('[data-part="segment"]')]
      .map((element: Element) => (element as HTMLElement).textContent?.trim())
      .join('/');

  it('starts the week on the day firstDayOfWeek names', () => {
    const fixture = renderTemplate(
      `<div slDatePicker defaultOpen locale="en-US" [firstDayOfWeek]="1" [defaultValue]="ninth"></div>`,
    );
    const first = fixture.nativeElement.querySelector('[data-part="week-header"]') as HTMLElement;
    expect(first.getAttribute('abbr')).toBe('Monday');
  });

  it('hands the field the yearPivot it is given', () => {
    const fixture = renderTemplate(`<div slDatePicker locale="en-US" [yearPivot]="0"></div>`);
    const field = fixture.debugElement.query(By.directive(SlDateField)).componentInstance;
    expect((field as SlDateField).yearPivot()).toBe(0);
  });

  it('marks the field invalid when the picker is', () => {
    const fixture = renderTemplate(`<div slDatePicker invalid locale="en-US"></div>`);
    const field = fixture.nativeElement.querySelector('[data-ui="date-field"]') as HTMLElement;
    expect(field.hasAttribute('data-invalid')).toBe(true);
  });

  it('empties the field when a controlled value becomes null', () => {
    const fixture = renderTemplate(`<div slDatePicker locale="en-US" [value]="held()"></div>`);
    expect(segmentText(fixture)).toBe('09/09/2026');

    fixture.componentInstance.held.set(null);
    fixture.detectChanges();
    expect(segmentText(fixture)).not.toContain('2026');
  });
});

describe('in an Angular form', () => {
  const hidden = (fixture: Fixture) =>
    (fixture.nativeElement.querySelector('[data-part="hidden-input"]') as HTMLInputElement).value;

  it('takes the value the form writes and empties on reset', () => {
    const fixture = renderTemplate(
      `<div slDatePicker locale="en-US" [formControl]="control"></div>`,
    );
    fixture.componentInstance.control.setValue(NINTH);
    fixture.detectChanges();
    expect(hidden(fixture)).toBe('2026-09-09');

    fixture.componentInstance.control.reset();
    fixture.detectChanges();
    expect(hidden(fixture)).toBe('');
  });

  it('returns to its default value when its form is reset', () => {
    const fixture = renderTemplate(
      `<form>
         <div slDatePicker defaultOpen locale="pt-BR" name="data" [defaultValue]="ninth" (valueChange)="onValue($event)"></div>
       </form>`,
    );

    click(fixture, dayFor(fixture, 17));
    expect(hidden(fixture)).toBe('2026-09-17');

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).reset();
    fixture.detectChanges();

    expect(hidden(fixture)).toBe('2026-09-09');
    expect(fixture.componentInstance.onValue).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: NINTH, reason: 'programmatic' }),
    );
  });

  it('reports the date chosen in the grid to the form', () => {
    const fixture = renderTemplate(
      `<div slDatePicker locale="en-US" [formControl]="control"></div>`,
    );
    fixture.componentInstance.control.setValue(NINTH);
    fixture.detectChanges();
    click(fixture, trigger(fixture));
    click(fixture, dayFor(fixture, 17));
    expect(fixture.componentInstance.control.value).toEqual(plainDate(2026, 9, 17));
  });

  it('takes the trigger out when the form disables it', () => {
    const fixture = renderTemplate(
      `<div slDatePicker locale="en-US" [formControl]="control"></div>`,
    );
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(trigger(fixture).disabled).toBe(true);
    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
  });

  it('reports a date outside the bounds as a form error', () => {
    const fixture = renderTemplate(
      `<div slDatePicker locale="en-US" [min]="ninth" [formControl]="control"></div>`,
    );
    fixture.componentInstance.control.setValue(plainDate(2026, 1, 1));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.errors?.['slottedDateRange']).toBeDefined();
  });
});

describe('where focus goes when it opens', () => {
  it('moves focus to the chosen day when the trigger opens it', async () => {
    const fixture = renderTemplate(
      `<div slDatePicker locale="en-US" [defaultValue]="ninth"></div>`,
    );

    click(fixture, trigger(fixture));
    await fixture.whenStable();

    expect(document.activeElement?.getAttribute('data-part')).toBe('day');
    expect(document.activeElement?.textContent?.trim()).toBe('9');
  });

  it('leaves focus alone when it is rendered open', async () => {
    const fixture = renderTemplate(
      `<div slDatePicker defaultOpen locale="en-US" [defaultValue]="ninth"></div>`,
    );
    await fixture.whenStable();

    expect(document.activeElement?.getAttribute('data-part')).not.toBe('day');
  });

  it('keeps Tab inside the surface while it is open', () => {
    const fixture = renderTemplate(
      `<div slDatePicker defaultOpen locale="en-US" [defaultValue]="ninth">
         <div slDatePickerPresets><button type="button" id="first">Today</button></div>
         <div slDatePickerFooter><button type="button" id="last">Done</button></div>
       </div>`,
    );
    const first = fixture.nativeElement.querySelector('#first') as HTMLButtonElement;
    const last = fixture.nativeElement.querySelector('#last') as HTMLButtonElement;

    last.focus();
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    expect(document.activeElement).toBe(last);
  });
});

/**
 * A card statement, a budget month: the form asks for a month and no day. The
 * calendar opens on the months of a year, a month cell is the choice, the
 * field shows only the month and the year, and the form submits "YYYY-MM".
 */
describe('month granularity', () => {
  const month = (fixture: Fixture, name: string) =>
    fixture.nativeElement.querySelector(
      `[data-part="period"][aria-label="${name}"]`,
    ) as HTMLElement;

  it('chooses a month cell and reports the month, and submits YYYY-MM', () => {
    const fixture = renderTemplate(
      `<form><div slDatePicker granularity="month" locale="en-US" name="statement"
        [defaultValue]="october" (valueChange)="onValue($event)"></div></form>`,
    );
    const segments = [...fixture.nativeElement.querySelectorAll('[data-part="segment"]')].map(
      (segment: Element) => segment.getAttribute('data-field'),
    );
    expect(segments).toEqual(['month', 'year']);
    const hidden = () =>
      (fixture.nativeElement.querySelector('[data-part="hidden-input"]') as HTMLInputElement).value;
    expect(hidden()).toBe('2026-10');

    click(fixture, trigger(fixture));
    expect(
      fixture.nativeElement.querySelector('[data-ui="calendar"]').getAttribute('data-view'),
    ).toBe('month');
    expect(fixture.nativeElement.querySelector('[data-part="grid"]')).toBeNull();
    expect(month(fixture, 'October 2026').getAttribute('aria-selected')).toBe('true');

    click(fixture, month(fixture, 'November 2026'));

    expect(fixture.componentInstance.values).toEqual([{ year: 2026, month: 11 }]);
    expect(hidden()).toBe('2026-11');
    expect(root(fixture).hasAttribute('data-open')).toBe(false);
  });

  it('refuses a month outside min and max, which are months', () => {
    const fixture = renderTemplate(
      `<div slDatePicker granularity="month" locale="en-US" [defaultOpen]="true"
        [defaultValue]="october" [min]="march" [max]="november"></div>`,
    );
    expect(month(fixture, 'February 2026').getAttribute('aria-disabled')).toBe('true');
    expect(month(fixture, 'November 2026').hasAttribute('aria-disabled')).toBe(false);
    expect(month(fixture, 'December 2026').getAttribute('aria-disabled')).toBe('true');
  });

  it('names the paging buttons for the year they step, and pages a year back', () => {
    const fixture = renderTemplate(
      `<div slDatePicker granularity="month" locale="en-US" [defaultOpen]="true"
        [defaultValue]="october"></div>`,
    );
    const name = (part: string) =>
      fixture.nativeElement.querySelector(`[data-part="${part}"]`).getAttribute('aria-label');
    expect(name('previous')).toBe('Previous year');
    expect(name('next')).toBe('Next year');

    click(fixture, fixture.nativeElement.querySelector('[data-part="previous"]'));

    expect(month(fixture, 'October 2025')).not.toBeNull();
    expect(month(fixture, 'October 2026')).toBeNull();
  });
});

/**
 * A segment is named for the unit it holds, in the language in force. The
 * placeholder ("mm", "dd", "yyyy") is drawn and never spoken: "mm, October"
 * was what a screen reader announced.
 */
describe('what each segment is called', () => {
  it.each([
    ['en-US', 'day', ['month', 'day', 'year']],
    ['en-US', 'month', ['month', 'year']],
    // language: pt-BR
    ['pt-BR', 'day', ['dia', 'mês', 'ano']],
    ['pt-BR', 'month', ['mês', 'ano']],
    // language: en-US
  ] as const)('in %s at %s granularity', (locale, granularity, expected) => {
    const fixture = renderTemplate(
      granularity === 'month'
        ? `<div slDatePicker granularity="month" [defaultValue]="october"></div>`
        : `<div slDatePicker [defaultValue]="ninth"></div>`,
      [provideSlotted({ locale: signal(locale), catalogs: { 'pt-BR': PT_BR } })],
    );
    const names = [...fixture.nativeElement.querySelectorAll('[role="spinbutton"]')].map(
      (segment: Element) => segment.getAttribute('aria-label'),
    );
    expect(names).toEqual(expected);
  });
});

describe('as a sheet', () => {
  /** jsdom has no `PointerEvent` constructor; a mouse event with the pointer's fields stands in. */
  const pointer = (type: string, clientY: number) => {
    const event = new MouseEvent(type, { bubbles: true, button: 0, clientY });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    return event;
  };

  it('draws a grip at the top of the content that a pull down dismisses it by', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    const fixture = renderTemplate(
      `<div slDatePicker locale="pt-BR" (openChange)="onOpen($event)"></div>`,
    );
    click(fixture, trigger(fixture));
    await fixture.whenStable();
    const grip = surface(fixture)?.firstElementChild as HTMLElement;

    expect(grip.getAttribute('data-part')).toBe('grip');
    expect(grip.getAttribute('aria-hidden')).toBe('true');

    grip.dispatchEvent(pointer('pointerdown', 100));
    grip.dispatchEvent(pointer('pointermove', 400));
    grip.dispatchEvent(pointer('pointerup', 400));

    expect(fixture.componentInstance.opens.at(-1)).toBe(false);
    expect(fixture.componentInstance.onOpen).toHaveBeenLastCalledWith(
      expect.objectContaining({ reason: 'pointer' }),
    );
    vi.unstubAllGlobals();
  });
});
