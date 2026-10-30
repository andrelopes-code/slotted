import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { plainDate, plainTime } from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/datetime-range-picker/contract.json';
import { SlDateTimeRangePicker, SlDateTimeRangePickerPreset } from './datetime-range-picker';
import { provideDateTimeRangePickerDefaults } from './datetime-range-picker-defaults';
import type { DateTimeRange, DateTimeRangePickerPosition } from './datetime-range-picker-defaults';
import {
  SlDateTimeRangePickerFooter,
  SlDateTimeRangePickerOption,
  SlDateTimeRangePickerPresets,
} from './datetime-range-picker-parts';

const d = (day: number) => plainDate(2026, 9, day);
const t = (hour: number, minute = 0) => plainTime(hour, minute);
const dt = (day: number, hour: number, minute = 0): PlainDateTime => ({
  date: d(day),
  time: t(hour, minute),
});
const RUN: DateTimeRange = { start: dt(12, 14), end: dt(16, 11) };
const NOON = dt(14, 12);

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlDateTimeRangePicker,
    SlDateTimeRangePickerFooter,
    SlDateTimeRangePickerOption,
    SlDateTimeRangePickerPresets,
    SlDateTimeRangePickerPreset,
  ],
  template: `<div slDateTimeRangePicker></div>`,
})
class Host {
  readonly run = RUN;
  readonly sameDay: DateTimeRange = { start: dt(12, 14), end: dt(12, 16, 30) };
  readonly openRun: DateTimeRange = { start: dt(12, 14), end: null };
  readonly lateSame: DateTimeRange = { start: dt(12, 17), end: dt(12, 17) };
  readonly reversed: DateTimeRange = { start: dt(16, 11), end: dt(12, 14) };
  readonly noon = NOON;
  readonly eight = t(8);
  readonly seventeen = t(17);
  readonly eighteen = t(18);
  readonly control = new FormControl<DateTimeRange | null>(RUN);
  readonly values: (DateTimeRange | null)[] = [];
  readonly opens: boolean[] = [];
  readonly positions: DateTimeRangePickerPosition[] = [];
  readonly onValue = vi.fn((request: ChangeRequest<DateTimeRange | null>) => {
    this.values.push(request.value);
  });
  readonly onOpen = vi.fn((request: ChangeRequest<boolean>) => {
    this.opens.push(request.value);
  });
  readonly onPosition = vi.fn((request: ChangeRequest<DateTimeRangePickerPosition>) => {
    this.positions.push(request.value);
  });
  readonly closedTwelveAtThree = (time: PlainTime, date: PlainDate) =>
    date.day === 12 && time.hour === 15;
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

const BASE = `slDateTimeRangePicker locale="en" [hourCycle]="24" [referenceDateTime]="noon"`;

const root = (fixture: Fixture) =>
  fixture.nativeElement.querySelector(
    '[data-ui="datetime-range-picker"][data-part="root"]',
  ) as HTMLElement;
const part = (fixture: Fixture, name: string) =>
  fixture.nativeElement.querySelector(`[data-part="${name}"]`) as HTMLElement;
const text = (fixture: Fixture, name: string) => (part(fixture, name)?.textContent ?? '').trim();
const surface = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="content"]') as HTMLElement | null;
const tab = (fixture: Fixture, position: DateTimeRangePickerPosition) =>
  fixture.nativeElement.querySelector(
    `[data-part="tab"][data-position="${position}"]`,
  ) as HTMLElement;
/** The one panel, which is the current end's; asking for the other end swaps the tab. */
const panel = (fixture: Fixture, position: DateTimeRangePickerPosition) => {
  if (!tab(fixture, position).hasAttribute('data-current')) {
    tab(fixture, position).click();
    fixture.detectChanges();
  }
  return fixture.nativeElement.querySelector(
    `[data-part="panel"][data-position="${position}"]`,
  ) as HTMLElement;
};
const list = (fixture: Fixture, position: DateTimeRangePickerPosition) =>
  panel(fixture, position).querySelector('[data-part="list"]') as HTMLElement;
const optionFor = (fixture: Fixture, position: DateTimeRangePickerPosition, label: string) =>
  [...list(fixture, position).querySelectorAll<HTMLElement>('[data-part="option"]')].find((row) =>
    (row.textContent ?? '').trim().startsWith(label),
  ) as HTMLElement;
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
  it('renders a one-line frame, and two tabs, one field, one calendar and one list behind it', () => {
    const fixture = renderTemplate(`<div ${BASE} defaultOpen [defaultValue]="run"></div>`);
    expect(root(fixture).getAttribute('data-ui')).toBe(contract.ui);
    expect(part(fixture, 'control').querySelectorAll('[data-ui="datetime-field"]')).toHaveLength(0);
    expect(surface(fixture)?.querySelectorAll('[data-ui="datetime-field"]')).toHaveLength(1);
    expect(surface(fixture)?.querySelectorAll('[data-ui="calendar"]')).toHaveLength(1);
    expect(surface(fixture)?.querySelectorAll('[role="listbox"]')).toHaveLength(1);
    expect(surface(fixture)?.querySelectorAll('[role="tab"]')).toHaveLength(2);
    expect(text(fixture, 'summary')).toMatch(/Sep 12.*14:00.*–.*Sep 16.*11:00/);
    expect(tab(fixture, 'start').textContent).toMatch(/Sep 12.*14:00/);
    expect(tab(fixture, 'end').textContent).toMatch(/Sep 16.*11:00/);
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
      `<div ${BASE} defaultOpen clearable [defaultValue]="lateSame" [maxTime]="seventeen" [minLength]="900" [maxLength]="14400" unavailableOptions="hide">
         <div slDateTimeRangePickerPresets>
           <button [slDateTimeRangePickerPreset]="run">Estadia</button>
         </div>
         <div slDateTimeRangePickerFooter><button type="button">Aplicar</button></div>
       </div>`,
    );
    /* One end at a time: the empty end and the list of the other are two tabs. */
    const collect = () =>
      [...fixture.nativeElement.querySelectorAll('[data-part]')].map(
        (element: Element) => (element as HTMLElement).dataset['part'],
      );
    const present = new Set(collect());
    click(fixture, tab(fixture, 'end'));
    for (const name of collect()) present.add(name);
    for (const name of contract.members.dateTimeRangePicker.parts) {
      expect(present, `${name} is not rendered`).toContain(name);
    }

    vi.unstubAllGlobals();
  });

  it('names the list by the current tab, says what to choose, and submits two named values', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="run" startName="start" endName="end" [messages]="{ start: 'Pickup', end: 'Return' }"></div>`,
    );
    expect(
      document.getElementById(list(fixture, 'start').getAttribute('aria-labelledby') ?? ''),
    ).toBe(tab(fixture, 'start'));
    expect(text(fixture, 'hint')).toBe('');

    const empty = renderTemplate(
      `<div ${BASE} defaultOpen [messages]="{ start: 'Pickup', end: 'Return' }"></div>`,
    );
    expect(text(empty, 'hint')).toBe('Pickup: choose a day');
    click(empty, dayFor(empty, 12));
    expect(text(empty, 'hint')).toMatch(/^Pickup: choose a time on .*12/);
    expect(
      (fixture.nativeElement.querySelector('input[name="start"]') as HTMLInputElement).value,
    ).toBe('2026-09-12T14:00:00');
    expect(
      (fixture.nativeElement.querySelector('input[name="end"]') as HTMLInputElement).value,
    ).toBe('2026-09-16T11:00:00');
  });

  /** Both marks are `Glyph` elements inside an `Icon` box, never masks. */
  it('draws the calendar and the cross as glyph elements', () => {
    const fixture = renderTemplate(`<div ${BASE} clearable [defaultValue]="run"></div>`);
    const glyph = (name: string) =>
      part(fixture, name)
        ?.querySelector("[data-ui='icon'] > svg[data-glyph]")
        ?.getAttribute('data-glyph');
    expect(glyph('trigger')).toBe(contract.triggerIcon);
    expect(glyph('clear')).toBe('x');
  });
});

describe('the duration and the lists', () => {
  it('says the duration across days, and writes it beside the rows on the same day only', () => {
    const across = renderTemplate(`<div ${BASE} defaultOpen [defaultValue]="run"></div>`);
    expect(text(across, 'length')).toBe('3 days 21 hr');
    expect(
      optionFor(across, 'end', '15:00').querySelector('[data-part="option-duration"]'),
    ).toBeNull();

    const same = renderTemplate(`<div ${BASE} defaultOpen [defaultValue]="sameDay"></div>`);
    expect(
      optionFor(same, 'end', '15:00').querySelector('[data-part="option-duration"]')?.textContent,
    ).toBe('1 hr');
    expect(optionFor(same, 'end', '13:45').getAttribute('aria-disabled')).toBe('true');
  });

  it('runs each list inside the day window, and refuses a time unavailable on its own day', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="run" [minTime]="eight" [maxTime]="eighteen" [isTimeUnavailable]="closedTwelveAtThree"></div>`,
    );
    expect(optionFor(fixture, 'start', '07:45')).toBeUndefined();
    expect(optionFor(fixture, 'end', '18:15')).toBeUndefined();
    expect(optionFor(fixture, 'start', '15:00').getAttribute('aria-disabled')).toBe('true');
    expect(optionFor(fixture, 'end', '15:00').hasAttribute('aria-disabled')).toBe(false);
  });

  it('says the duration a pending day would give', () => {
    const fixture = renderTemplate(`<div ${BASE} defaultOpen [defaultValue]="openRun"></div>`);
    dayFor(fixture, 13).dispatchEvent(new Event('pointerenter', { bubbles: true }));
    fixture.detectChanges();
    expect(text(fixture, 'length')).toBe('10 hr');
    expect(part(fixture, 'length').hasAttribute('data-pending')).toBe(true);
  });
});

describe('choosing a run', () => {
  it('walks the reader through the four halves and closes on the last', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen (valueChange)="onValue($event)" (openChange)="onOpen($event)" (positionChange)="onPosition($event)"></div>`,
    );
    const host = fixture.componentInstance;
    click(fixture, dayFor(fixture, 12));
    expect(host.values).toEqual([]);
    expect(tab(fixture, 'start').textContent).toMatch(/12/);

    click(fixture, optionFor(fixture, 'start', '14:00'));
    expect(host.values).toEqual([]);
    expect(host.positions.at(-1)).toBe('end');
    expect(tab(fixture, 'end').hasAttribute('data-current')).toBe(true);

    click(fixture, dayFor(fixture, 16));
    expect(host.values).toEqual([]);

    click(fixture, optionFor(fixture, 'end', '11:00'));
    expect(host.values).toEqual([{ start: dt(12, 14), end: dt(16, 11) }]);
    expect(host.opens).toEqual([false]);
  });

  it('keeps the panel open when a whole work is changed, and abandons the work on Escape', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="run" (valueChange)="onValue($event)" (openChange)="onOpen($event)"></div>`,
    );
    click(fixture, optionFor(fixture, 'end', '12:00'));
    expect(fixture.componentInstance.values).toEqual([{ start: dt(12, 14), end: dt(16, 12) }]);
    expect(fixture.componentInstance.opens).toEqual([]);
    escape(fixture);
    expect(root(fixture).hasAttribute('data-open')).toBe(false);
    expect(fixture.componentInstance.values).toHaveLength(1);
  });

  it('writes now, both halves, into the current end', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="openRun" (valueChange)="onValue($event)"></div>`,
    );
    panel(fixture, 'end');
    click(fixture, part(fixture, 'now'));
    expect(fixture.componentInstance.values.at(-1)).toEqual({ start: dt(12, 14), end: NOON });
  });

  it('draws a consumer template inside each row, with the day', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="sameDay">
         <ng-template slDateTimeRangePickerOption let-time let-date="date" let-duration="duration">
           <em>{{ date.day }} {{ time.hour }} {{ duration }}</em>
         </ng-template>
       </div>`,
    );
    expect(optionFor(fixture, 'end', '12 15').querySelector('em')?.textContent?.trim()).toBe(
      '12 15 1 hr',
    );
  });
});

describe('forms and ownership', () => {
  it("belongs in a reactive form, and reports the family's own errors", () => {
    const fixture = renderTemplate(`<div ${BASE} [formControl]="control" [minTime]="eight"></div>`);
    const control = fixture.componentInstance.control;
    expect(control.errors).toBeNull();
    control.setValue({ start: dt(12, 7), end: dt(12, 9) });
    fixture.detectChanges();
    expect(control.errors?.['slottedDateTimeRangeMin']).toBeDefined();
    control.setValue({ start: dt(16, 11), end: dt(12, 14) });
    fixture.detectChanges();
    expect(control.errors?.['slottedDateTimeRangeOrder']).toBeDefined();
    expect(root(fixture).hasAttribute('data-invalid')).toBe(true);
  });

  it('reads the defaults an application provided once', () => {
    const fixture = renderTemplate(`<div ${BASE} defaultOpen></div>`, [
      provideDateTimeRangePickerDefaults({ months: 2 }),
    ]);
    expect(fixture.nativeElement.querySelectorAll('[data-part="grid"]')).toHaveLength(2);
  });

  it('changes its words and its date and time format together with the language in force', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<div slDateTimeRangePicker [referenceDateTime]="noon" [defaultValue]="run"></div>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );
    const name = () => part(fixture, 'trigger')?.getAttribute('aria-label') ?? '';

    // language: pt-BR
    expect(name()).toMatch(/^Alterar período, /);
    // language: en-US
    expect(text(fixture, 'summary')).toMatch(/12 de set.*14:00/);

    locale.set('en-US');
    fixture.detectChanges();
    expect(name()).toMatch(/^Change range, /);
    expect(text(fixture, 'summary')).toMatch(/Sep 12.*2:00\sPM/);
  });

  it('names the limit in the language in force', () => {
    const fixture = renderTemplate(
      `<div slDateTimeRangePicker defaultOpen [referenceDateTime]="noon" [minLength]="86400" [maxLength]="604800"></div>`,
      [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    );
    // language: pt-BR
    expect(text(fixture, 'limit')).toBe('de 1 dia a 7 dias');
    // language: en-US
  });
});
