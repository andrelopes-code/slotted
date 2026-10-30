import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideSlotted } from '@slotted/angular/i18n';
import { plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/date-range-picker/contract.json';
import { SlDateRangePicker, SlDateRangePickerPreset } from './date-range-picker';
import { provideDateRangePickerDefaults } from './date-range-picker-defaults';
import type { DateRange, DateRangePickerPosition } from './date-range-picker-defaults';
import { SlDateRangePickerFooter, SlDateRangePickerPresets } from './date-range-picker-parts';

const d = (day: number) => plainDate(2026, 9, day);
const RUN: DateRange = { start: d(7), end: d(11) };

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlField,
    SlFieldLabel,
    SlDateRangePicker,
    SlDateRangePickerFooter,
    SlDateRangePickerPresets,
    SlDateRangePickerPreset,
  ],
  template: `<div slDateRangePicker></div>`,
})
class Host {
  readonly run = RUN;
  readonly openRun: DateRange = { start: d(7), end: null };
  readonly reversed: DateRange = { start: d(11), end: d(7) };
  readonly month: DateRange = { start: d(1), end: d(30) };
  readonly ninth = d(9);
  readonly control = new FormControl<DateRange | null>(RUN);
  readonly values: (DateRange | null)[] = [];
  readonly opens: boolean[] = [];
  readonly positions: DateRangePickerPosition[] = [];
  readonly onValue = vi.fn((request: ChangeRequest<DateRange | null>) => {
    this.values.push(request.value);
  });
  readonly onOpen = vi.fn((request: ChangeRequest<boolean>) => {
    this.opens.push(request.value);
  });
  readonly onPosition = vi.fn((request: ChangeRequest<DateRangePickerPosition>) => {
    this.positions.push(request.value);
  });
  readonly refuseFifteenth = (date: PlainDate) => date.day === 15;
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
  fixture.nativeElement.querySelector(
    '[data-ui="date-range-picker"][data-part="root"]',
  ) as HTMLElement;
const part = (fixture: Fixture, name: string) =>
  fixture.nativeElement.querySelector(`[data-part="${name}"]`) as HTMLElement;
const text = (fixture: Fixture, name: string) => (part(fixture, name)?.textContent ?? '').trim();
const trigger = (fixture: Fixture) => part(fixture, 'trigger') as HTMLButtonElement;
const surface = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="content"]') as HTMLElement | null;
const dayFor = (fixture: Fixture, number: number) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="day"]')].find(
    (element: Element) =>
      ((element as HTMLElement).textContent ?? '').trim() === String(number) &&
      element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') === false,
  ) as HTMLElement;
const segments = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[role="spinbutton"]')] as HTMLElement[];

const click = (fixture: Fixture, element: HTMLElement) => {
  element.click();
  fixture.detectChanges();
};
const hover = (fixture: Fixture, element: HTMLElement) => {
  element.dispatchEvent(new Event('pointerenter'));
  fixture.detectChanges();
};
const escape = (fixture: Fixture) => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  fixture.detectChanges();
};

describe('what it is made of', () => {
  it('renders two fields and one calendar, each keeping its own identifier', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" [defaultValue]="run"></div>`,
    );
    expect(fixture.nativeElement.querySelectorAll('[data-ui="date-field"]')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('[data-ui="calendar"]')).toHaveLength(1);
    expect(root(fixture).getAttribute('data-ui')).toBe(contract.ui);
    expect(root(fixture).getAttribute('data-count')).toBe('days');
  });

  it('declares every part the contract names', () => {
    /* The grip is drawn in the sheet presentation only. */
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen clearable locale="pt-BR" [defaultValue]="run" [maxLength]="7">
         <div slDateRangePickerPresets>
           <button [slDateRangePickerPreset]="run">This week</button>
         </div>
         <div slDateRangePickerFooter><button type="button">Apply</button></div>
       </div>`,
    );
    const present = new Set(
      [...fixture.nativeElement.querySelectorAll('[data-part]')].map(
        (element: Element) => (element as HTMLElement).dataset['part'],
      ),
    );
    for (const name of contract.members.dateRangePicker.parts) {
      expect(present, `${name} is not rendered`).toContain(name);
    }

    vi.unstubAllGlobals();
  });

  it('carries the dialog role and points the trigger at it while it is open', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" [defaultValue]="run"></div>`,
    );
    expect(surface(fixture)?.getAttribute('role')).toBe('dialog');
    expect(trigger(fixture).getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('true');
    expect(trigger(fixture).getAttribute('aria-controls')).toBe(surface(fixture)?.id);
  });

  it('names the two fields and submits them under two names', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker locale="pt-BR" [defaultValue]="run" [messages]="{ start: 'Start', end: 'End' }" startName="start" endName="end"></div>`,
    );
    const groups = [...fixture.nativeElement.querySelectorAll('[role="group"]')] as HTMLElement[];
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual(['Start', 'End']);
    expect(fixture.nativeElement.querySelector('input[name="start"]').value).toBe('2026-09-07');
    expect(fixture.nativeElement.querySelector('input[name="end"]').value).toBe('2026-09-11');
  });
});

describe('what the trigger says', () => {
  it('names itself for choosing, then carries both ends and the length', () => {
    const empty = renderTemplate(
      `<div slDateRangePicker locale="pt-BR" [messages]="{ choose: 'Choose a period' }"></div>`,
    );
    expect(trigger(empty).getAttribute('aria-label')).toBe('Choose a period');

    const chosen = renderTemplate(
      `<div slDateRangePicker locale="pt-BR" count="nights" [messages]="{ change: 'Change the period, {start} – {end}, {length}' }" [defaultValue]="run"></div>`,
    );
    const name = trigger(chosen).getAttribute('aria-label') ?? '';
    expect(name).toContain('Change the period');
    expect(name).toMatch(/7 de setembro de 2026/);
    expect(name).toContain('4 nights');
  });

  /** Both marks are `Glyph` elements inside an `Icon` box, never masks. */
  it('draws the calendar and the cross as glyph elements', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker clearable locale="pt-BR" [defaultValue]="run"></div>`,
    );
    const glyph = (name: string) =>
      part(fixture, name)
        ?.querySelector("[data-ui='icon'] > svg[data-glyph]")
        ?.getAttribute('data-glyph');
    expect(glyph('trigger')).toBe('calendar');
    expect(glyph('clear')).toBe('x');
  });
});

describe('the length, said while the run is drawn', () => {
  it('says the length of a whole value in a live region', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" [defaultValue]="run"></div>`,
    );
    expect(text(fixture, 'length')).toBe('5 days');
    expect(part(fixture, 'length').getAttribute('aria-live')).toBe('polite');
    expect(part(fixture, 'length').hasAttribute('data-pending')).toBe(false);
  });

  it('says the length the pending end would give, and marks it pending', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" count="nights" [defaultValue]="openRun"></div>`,
    );
    hover(fixture, dayFor(fixture, 11));
    expect(text(fixture, 'length')).toBe('4 nights');
    expect(part(fixture, 'length').hasAttribute('data-pending')).toBe(true);
    expect(part(fixture, 'head-end').hasAttribute('data-pending')).toBe(true);
  });

  it('draws the missing ends as placeholders, and names a limit', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" count="nights" [minLength]="2" [maxLength]="7"></div>`,
    );
    expect(part(fixture, 'head-start').hasAttribute('data-placeholder')).toBe(true);
    expect(part(fixture, 'head-end').hasAttribute('data-placeholder')).toBe(true);
    expect(text(fixture, 'length')).toBe('');
    expect(text(fixture, 'limit')).toBe('2 to 7 nights');
  });
});

describe('choosing a run', () => {
  it('holds the first press as a draft and emits the whole run on the second', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" (valueChange)="onValue($event)" (positionChange)="onPosition($event)"></div>`,
    );
    click(fixture, dayFor(fixture, 7));
    expect(fixture.componentInstance.values).toHaveLength(0);
    expect(fixture.componentInstance.positions.at(-1)).toBe('end');
    expect(part(fixture, 'end').hasAttribute('data-current')).toBe(true);
    expect(text(fixture, 'head-start')).toContain('7');

    click(fixture, dayFor(fixture, 11));
    /* The grid opens on today's month, so the run is read by its days. */
    const [run] = fixture.componentInstance.values;
    expect(fixture.componentInstance.values).toHaveLength(1);
    expect([run?.start?.day, run?.end?.day]).toEqual([7, 11]);
    expect(run?.start?.month).toBe(run?.end?.month);
    expect(fixture.componentInstance.positions.at(-1)).toBe('start');
  });

  it('closes when the run becomes whole and returns focus to the trigger', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" (openChange)="onOpen($event)"></div>`,
    );
    click(fixture, dayFor(fixture, 7));
    expect(fixture.componentInstance.opens).toHaveLength(0);
    click(fixture, dayFor(fixture, 11));
    expect(fixture.componentInstance.opens.at(-1)).toBe(false);
    expect(document.activeElement).toBe(trigger(fixture));
  });

  it('abandons the draft when the surface closes', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" [defaultValue]="run" (valueChange)="onValue($event)"></div>`,
    );
    click(fixture, dayFor(fixture, 20));
    escape(fixture);
    expect(fixture.componentInstance.values).toHaveLength(0);
    click(fixture, trigger(fixture));
    expect(text(fixture, 'head-start')).toContain('7');
    expect(text(fixture, 'head-end')).toContain('11');
  });

  it('writes the end when the end is the current position', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" position="end" [defaultValue]="run" (valueChange)="onValue($event)"></div>`,
    );
    click(fixture, dayFor(fixture, 20));
    expect(fixture.componentInstance.values.at(-1)).toEqual({ start: d(7), end: d(20) });
  });

  it('writes a preset with the select reason, marks the one equal to the value, and closes', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" [value]="run" (valueChange)="onValue($event)" (openChange)="onOpen($event)">
         <div slDateRangePickerPresets>
           <button [slDateRangePickerPreset]="run">This week</button>
           <button [slDateRangePickerPreset]="month">This month</button>
         </div>
       </div>`,
    );
    const presets = fixture.nativeElement.querySelectorAll('[data-part="preset"]');
    expect(presets[0].hasAttribute('data-selected')).toBe(true);
    expect(presets[1].hasAttribute('data-selected')).toBe(false);
    expect(presets[1].getAttribute('type')).toBe('button');

    click(fixture, presets[1] as HTMLElement);
    expect(fixture.componentInstance.onValue).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: { start: d(1), end: d(30) }, reason: 'select' }),
    );
    expect(fixture.componentInstance.opens.at(-1)).toBe(false);
  });

  it('empties both ends from one clear', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker clearable locale="pt-BR" [defaultValue]="run" (valueChange)="onValue($event)"></div>`,
    );
    expect(fixture.nativeElement.querySelectorAll('[data-part="clear"]')).toHaveLength(1);
    click(fixture, part(fixture, 'clear'));
    expect(fixture.componentInstance.onValue).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: null, reason: 'clear' }),
    );
  });
});

describe('the limits', () => {
  it('refuses the days beyond the limit while a start is chosen', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" count="nights" [minLength]="2" [maxLength]="7" [defaultValue]="openRun"></div>`,
    );
    const cell = (day: number) => dayFor(fixture, day).closest('[data-part="cell"]') as HTMLElement;
    expect(cell(8).hasAttribute('data-unavailable')).toBe(true);
    expect(cell(9).hasAttribute('data-unavailable')).toBe(false);
    expect(cell(14).hasAttribute('data-unavailable')).toBe(false);
    expect(cell(15).hasAttribute('data-unavailable')).toBe(true);
  });

  it('refuses the days beyond an unavailable one while the run must be contiguous', () => {
    const contiguous = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" [isDateUnavailable]="refuseFifteenth" [defaultValue]="openRun"></div>`,
    );
    expect(
      dayFor(contiguous, 20).closest('[data-part="cell"]')?.hasAttribute('data-unavailable'),
    ).toBe(true);

    const loose = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" [contiguous]="false" [isDateUnavailable]="refuseFifteenth" [defaultValue]="openRun"></div>`,
    );
    expect(dayFor(loose, 20).closest('[data-part="cell"]')?.hasAttribute('data-unavailable')).toBe(
      false,
    );
  });
});

describe('what the frame says', () => {
  it('states its own invalidity for an end before its start, and swaps nothing', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker locale="pt-BR" [value]="reversed"></div>`,
    );
    expect(root(fixture).hasAttribute('data-invalid')).toBe(true);
    const fields = fixture.nativeElement.querySelectorAll('[data-ui="date-field"]');
    expect(fields[0].hasAttribute('data-invalid')).toBe(false);
    expect(fields[1].hasAttribute('data-invalid')).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('[data-part="hidden-input"]')[0].value).toBe(
      '2026-09-11',
    );
  });

  it('states its own invalidity for a run over an unavailable day', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker locale="pt-BR" [isDateUnavailable]="refuseNinth" [value]="run"></div>`,
    );
    expect(root(fixture).hasAttribute('data-invalid')).toBe(true);
  });

  it('follows the field the reader focuses', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker locale="pt-BR" (positionChange)="onPosition($event)"></div>`,
    );
    expect(part(fixture, 'start').hasAttribute('data-current')).toBe(true);
    (segments(fixture)[3] as HTMLElement).focus();
    fixture.detectChanges();
    expect(fixture.componentInstance.onPosition).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 'end', reason: 'keyboard' }),
    );
    expect(part(fixture, 'end').hasAttribute('data-current')).toBe(true);
    expect(part(fixture, 'start').hasAttribute('data-current')).toBe(false);
  });

  it('takes the two buttons out while it is disabled', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker clearable disabled locale="pt-BR" [defaultValue]="run"></div>`,
    );
    expect(trigger(fixture).disabled).toBe(true);
    expect((part(fixture, 'clear') as HTMLButtonElement).disabled).toBe(true);
    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
  });
});

describe('opening and closing', () => {
  it('opens and closes from the trigger, and opens from either field with the chord', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker locale="pt-BR" (openChange)="onOpen($event)"></div>`,
    );
    click(fixture, trigger(fixture));
    expect(surface(fixture)).not.toBeNull();
    expect(fixture.componentInstance.opens.at(-1)).toBe(true);
    click(fixture, trigger(fixture));
    expect(fixture.componentInstance.opens.at(-1)).toBe(false);

    (segments(fixture)[4] as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true }),
    );
    fixture.detectChanges();
    expect(surface(fixture)).not.toBeNull();
  });

  it('closes on Escape, walking the calendar down a view first', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" [defaultValue]="run" (openChange)="onOpen($event)"></div>`,
    );
    const calendar = fixture.nativeElement.querySelector('[data-ui="calendar"]') as HTMLElement;
    click(fixture, part(fixture, 'heading'));
    expect(calendar.getAttribute('data-view')).toBe('month');

    escape(fixture);
    expect(calendar.getAttribute('data-view')).toBe('day');
    expect(fixture.componentInstance.opens).toHaveLength(0);

    escape(fixture);
    expect(fixture.componentInstance.opens.at(-1)).toBe(false);
  });

  it('opens on the cell of the current end', async () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker locale="pt-BR" defaultPosition="end" [defaultValue]="run"></div>`,
    );
    click(fixture, trigger(fixture));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      (
        fixture.nativeElement.querySelector('[data-part="day"][tabindex="0"]')?.textContent ?? ''
      ).trim(),
    ).toBe('11');
  });
});

describe('what a form sees', () => {
  it('reads and writes the whole range through a form control', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="pt-BR" [formControl]="control"></div>`,
    );
    expect(text(fixture, 'length')).toBe('5 days');

    click(fixture, dayFor(fixture, 20));
    click(fixture, dayFor(fixture, 24));
    expect(fixture.componentInstance.control.value).toEqual({ start: d(20), end: d(24) });
  });

  it('returns to its default value when its form is reset', () => {
    const fixture = renderTemplate(
      `<form>
         <div slDateRangePicker clearable locale="pt-BR" [defaultValue]="run" startName="start" endName="end" (valueChange)="onValue($event)"></div>
       </form>`,
    );
    const input = (name: string) =>
      fixture.nativeElement.querySelector(`[name="${name}"]`) as HTMLInputElement;

    click(fixture, part(fixture, 'clear'));
    expect(input('start').value).toBe('');

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).reset();
    fixture.detectChanges();

    expect(input('start').value).toBe('2026-09-07');
    expect(input('end').value).toBe('2026-09-11');
    expect(fixture.componentInstance.onValue).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: RUN, reason: 'programmatic' }),
    );
  });

  it('takes the value the form writes and empties on reset', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker locale="pt-BR" startName="start" [formControl]="control"></div>`,
    );
    const start = () => fixture.nativeElement.querySelector('[name="start"]') as HTMLInputElement;
    expect(start().value).toBe('2026-09-07');

    fixture.componentInstance.control.reset();
    fixture.detectChanges();
    expect(start().value).toBe('');
  });

  it('reports the family’s own errors', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker locale="pt-BR" count="nights" [maxLength]="2" [isDateUnavailable]="refuseNinth" [formControl]="control"></div>`,
    );
    const errors = fixture.componentInstance.control.errors ?? {};
    expect(Object.keys(errors).sort()).toEqual([
      'slottedDateRangeLength',
      'slottedDateRangeUnavailable',
    ]);

    fixture.componentInstance.control.setValue({ start: d(11), end: d(7) });
    expect(Object.keys(fixture.componentInstance.control.errors ?? {})).toEqual([
      'slottedDateRangeOrder',
    ]);
  });
});

describe('what an application sets once', () => {
  it('takes the unit and the months from a provider, and its words from the language in force', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen [defaultValue]="run"></div>`,
      [
        provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }),
        provideDateRangePickerDefaults({ count: 'nights', months: 1 }),
      ],
    );
    expect(root(fixture).getAttribute('data-count')).toBe('nights');
    expect(text(fixture, 'length')).toBe('4 noites');
    // language: pt-BR
    expect(trigger(fixture).getAttribute('aria-label')).toContain('Alterar período');
    // language: en-US
    expect(fixture.nativeElement.querySelectorAll('[data-part="grid"]')).toHaveLength(1);
  });

  it('lays its own messages over the catalog, a counting phrase included', () => {
    const fixture = renderTemplate(
      `<div
         slDateRangePicker
         count="nights"
         defaultOpen
         [defaultValue]="run"
         [messages]="{ nights: { length: '{count, plural, one {# overnight} other {# overnights}}' } }"
       ></div>`,
    );
    expect(text(fixture, 'length')).toBe('4 overnights');
    expect(trigger(fixture).getAttribute('aria-label')).toContain('Change range');
  });

  it('changes its words and its dates together with the language in force', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<div slDateRangePicker count="nights" [defaultValue]="run"></div>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );

    expect(trigger(fixture).getAttribute('aria-label')).toMatch(
      // language: pt-BR
      /^Alterar período, .*7 de setembro de 2026 – .*11 de setembro de 2026, 4 noites$/,
      // language: en-US
    );

    locale.set('en-US');
    fixture.detectChanges();
    expect(trigger(fixture).getAttribute('aria-label')).toMatch(
      /^Change range, .*September 7, 2026 – .*September 11, 2026, 4 nights$/,
    );
  });
});

describe('the composition surface', () => {
  it('hands a template the instance and its imperative actions', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker #picker="slDateRangePicker" locale="pt-BR" [defaultValue]="run"></div>
       <button type="button" id="open" (click)="picker.openSurface()">open</button>
       <button type="button" id="end" (click)="picker.focus('end')">end</button>`,
    );
    click(fixture, fixture.nativeElement.querySelector('#open') as HTMLElement);
    expect(surface(fixture)).not.toBeNull();
    click(fixture, fixture.nativeElement.querySelector('#end') as HTMLElement);
    expect(document.activeElement).toBe(segments(fixture)[3]);
  });

  /**
   * The contract's open reasons are pointer, keyboard, escape, outsidePress and
   * select; React's handle reports keyboard, and so does this one.
   */
  it('reports the handle’s open and close with a reason its contract lists', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker locale="pt-BR" (openChange)="onOpen($event)"></div>`,
    );
    const picker = fixture.debugElement
      .query(By.directive(SlDateRangePicker))
      .injector.get(SlDateRangePicker);

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
      `<div slDateRangePicker defaultOpen locale="pt-BR">
         <div slDateRangePickerPresets><button [slDateRangePickerPreset]="run">Today</button></div>
         <div slDateRangePickerFooter><button type="button">Apply</button></div>
       </div>`,
    );
    expect(text(fixture, 'presets')).toContain('Today');
    expect(text(fixture, 'footer')).toContain('Apply');
  });
});

describe('where focus goes when it opens', () => {
  const focusedDay = () =>
    document.activeElement?.getAttribute('data-part') === 'day'
      ? (document.activeElement.textContent ?? '').trim()
      : null;

  it('moves focus to the cell of the current end when the trigger opens it', async () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker locale="en-US" defaultPosition="end" [defaultValue]="run"></div>`,
    );
    click(fixture, trigger(fixture));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(focusedDay()).toBe('11');
  });

  it('moves focus into the calendar when the handle opens it', async () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker #picker="slDateRangePicker" locale="en-US" [defaultValue]="run"></div>
       <button type="button" id="open" (click)="picker.openSurface()">open</button>`,
    );
    click(fixture, fixture.nativeElement.querySelector('#open') as HTMLElement);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(focusedDay()).toBe('7');
  });

  it('leaves focus in the field when the chord opens it', async () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker locale="en-US" [defaultValue]="run"></div>`,
    );
    const segment = segments(fixture)[0] as HTMLElement;
    segment.focus();
    segment.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(surface(fixture)).not.toBeNull();
    expect(document.activeElement).toBe(segment);
  });

  it('leaves focus alone when it is rendered open', async () => {
    (document.activeElement as HTMLElement | null)?.blur();
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="en-US" [defaultValue]="run"></div>`,
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(document.activeElement).toBe(document.body);
  });

  it('keeps Tab inside the surface while it is open', () => {
    const fixture = renderTemplate(
      `<div slDateRangePicker defaultOpen locale="en-US" [defaultValue]="run">
         <div slDateRangePickerPresets><button [slDateRangePickerPreset]="run">This week</button></div>
         <div slDateRangePickerFooter><button type="button" id="apply">Apply</button></div>
       </div>`,
    );
    const first = part(fixture, 'preset');
    const last = fixture.nativeElement.querySelector('#apply') as HTMLElement;

    last.focus();
    last.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(last);
  });
});

describe('inside a field', () => {
  it('names the frame after the field’s label and gives each end its own identifier', () => {
    const fixture = renderTemplate(
      `<div slField>
         <label slFieldLabel>Stay</label>
         <div slDateRangePicker locale="en-US"></div>
       </div>`,
    );
    const element = fixture.nativeElement as HTMLElement;
    const frame = part(fixture, 'control');
    const label = element.querySelector('label') as HTMLLabelElement;
    expect(frame.getAttribute('role')).toBe('group');
    expect(frame.getAttribute('aria-labelledby')).toBe(label.id);
    expect(label.getAttribute('for')).toBe(frame.id);
    const ends = [...element.querySelectorAll('[data-part="segments"]')] as HTMLElement[];
    expect(ends.map((end) => end.getAttribute('aria-label'))).toEqual(['Start', 'End']);
    const ids = [frame.id, ...ends.map((end) => end.id)];
    expect(ids.every((id) => id !== '')).toBe(true);
    expect(new Set(ids).size).toBe(3);
  });
});
