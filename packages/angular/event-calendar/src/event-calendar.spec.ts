import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlMenuItem } from '@slotted/angular/menu';
import { plainDate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import type { PlainDate, PlainDateTime } from '@slotted/core/date';
import type { ChangeRequest } from '@slotted/core/state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/event-calendar/contract.json';
import { SlEventCalendar } from './event-calendar';
import { provideEventCalendarDefaults } from './event-calendar-defaults';
import type {
  CalendarEvent,
  EventCalendarContextTarget,
  EventCalendarEventChange,
  EventCalendarSelection,
  EventOccurrence,
} from './event-calendar-defaults';
import {
  SlEventCalendarActions,
  SlEventCalendarContextMenu,
  SlEventCalendarDayContent,
  SlEventCalendarDetail,
  SlEventCalendarEmpty,
} from './event-calendar-templates';

const at = (day: number, hour: number, minute = 0): PlainDateTime => ({
  date: plainDate(2026, 9, day),
  time: { hour, minute, second: 0 },
});
const day = (value: number, month = 9): PlainDate => plainDate(2026, month, value);

@Component({
  standalone: true,
  imports: [
    SlEventCalendar,
    SlMenuItem,
    SlEventCalendarActions,
    SlEventCalendarContextMenu,
    SlEventCalendarDayContent,
    SlEventCalendarDetail,
    SlEventCalendarEmpty,
  ],
  template: `<div slEventCalendar></div>`,
})
class Host {
  readonly calendars = [
    { key: 'work', label: 'Work' },
    { key: 'home', label: 'Home' },
  ];
  readonly events: CalendarEvent[] = [
    { id: 'offsite', title: 'Offsite', start: day(8), end: day(10), calendar: 'work' },
    {
      id: 'standup',
      title: 'Standup',
      start: at(21, 9),
      end: at(21, 9, 15),
      calendar: 'work',
      recurrence: 'FREQ=DAILY;COUNT=3',
    },
    {
      id: 'dentist',
      title: 'Dentist',
      start: at(22, 14, 30),
      end: at(22, 15, 15),
      calendar: 'home',
      status: 'tentative',
    },
    { id: 'a', title: 'Design review', start: at(23, 13), end: at(23, 15), calendar: 'work' },
    { id: 'b', title: 'Vendor sync', start: at(23, 13, 30), end: at(23, 14), calendar: 'home' },
  ];
  readonly twentyFourth = day(24);
  readonly eighth = day(8);
  readonly withLater: CalendarEvent[] = [
    ...this.events,
    { id: 'later', title: 'Later', start: at(25, 9), end: at(25, 10) },
  ];
  readonly onlyOffsite = (occurrence: EventOccurrence) => occurrence.event.id === 'offsite';
  readonly asked: EventCalendarEventChange[] = [];
  readonly notTheNinth = (change: EventCalendarEventChange) => {
    this.asked.push(change);
    return (change.start as PlainDate).day !== 9;
  };
  readonly notTheNinthOrTenth = (change: EventCalendarEventChange) =>
    ![9, 10].includes((change.start as PlainDate).day);
  readonly nowhere = () => false;
  readonly notTheTwentyFifth = (target: EventCalendarContextTarget) =>
    target.kind === 'event' ||
    ('time' in target.slot.start ? target.slot.start.date : target.slot.start).day !== 25;
  readonly changes: EventCalendarEventChange[] = [];
  onChange(request: ChangeRequest<EventCalendarEventChange>) {
    this.changes.push(request.value);
  }
  readonly twentyThird = day(23);
  readonly thirtieth = day(30);
  readonly morningOfTheThirtieth = at(30, 9, 30);
  readonly firstOfNovember = day(1, 11);
  readonly working = [
    {
      days: [1, 2, 3, 4, 5],
      start: { hour: 9, minute: 0, second: 0 },
      end: { hour: 17, minute: 0, second: 0 },
    },
  ];
  readonly dates: ChangeRequest<PlainDate>[] = [];
  readonly selections: ChangeRequest<EventCalendarSelection | null>[] = [];
  readonly opens: ChangeRequest<string | null>[] = [];
  readonly ranges: unknown[] = [];
  onDate(request: ChangeRequest<PlainDate>) {
    this.dates.push(request);
  }
  onSelection(request: ChangeRequest<EventCalendarSelection | null>) {
    this.selections.push(request);
  }
  onOpen(request: ChangeRequest<string | null>) {
    this.opens.push(request);
  }
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

const query = (fixture: Fixture, selector: string) =>
  fixture.nativeElement.querySelector(selector) as HTMLElement;
const cell = (fixture: Fixture, iso: string, row = 'day') =>
  query(fixture, `[data-row='${row}'][data-date='${iso}']`);
const roving = (fixture: Fixture) => query(fixture, "[data-row][tabindex='0']");
const key = (fixture: Fixture, target: HTMLElement, name: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, ...init }));
  fixture.detectChanges();
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-09-24T15:40:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('SlEventCalendar', () => {
  /**
   * A page dated by its content — a docs console, a screenshot — names its
   * own now: the runtime's clock marked 1 October in a week dated 30 September.
   */
  it('reads now from the now input, which stops the clock', async () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [events]="[]" [defaultDate]="thirtieth" defaultView="week" [now]="morningOfTheThirtieth" locale="en-US" timeZone="UTC"></div>`,
    );
    await fixture.whenStable();
    fixture.detectChanges();
    const line = () => query(fixture, "[data-part='now']");
    expect(line().closest("[data-part='column']")?.getAttribute('data-date')).toBe('2026-09-30');
    expect(line().style.getPropertyValue('--slotted-event-start')).toBe('570');
    const marked = [...fixture.nativeElement.querySelectorAll('[data-today]')] as HTMLElement[];
    expect(marked.length).toBeGreaterThan(0);
    expect(marked.every((node) => node.getAttribute('data-date') === '2026-09-30')).toBe(true);
    vi.advanceTimersByTime(5 * 60_000);
    fixture.detectChanges();
    expect(line().style.getPropertyValue('--slotted-event-start')).toBe('570');
  });

  it('is selected by the family identifier and draws the month as a labelled grid', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [calendars]="calendars" [events]="events" [defaultDate]="twentyFourth" locale="en-US" timeZone="UTC"></div>`,
    );
    const root = query(fixture, "[data-ui='event-calendar']");
    expect(root.dataset['part']).toBe('root');
    expect(root.dataset['view']).toBe('month');
    const grid = query(fixture, "[role='grid']");
    const title = query(fixture, `#${grid.getAttribute('aria-labelledby') ?? ''}`);
    expect(title.textContent?.trim()).toBe('September 2026');
    expect(contract.ui).toBe('event-calendar');
    expect(fixture.nativeElement.querySelectorAll("[data-row][tabindex='0']")).toHaveLength(1);
    expect(roving(fixture)).toBe(cell(fixture, '2026-09-24'));
  });

  it('draws the bar, the series and the names the React binding draws', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [calendars]="calendars" [events]="events" [defaultDate]="twentyFourth" locale="en-US" timeZone="UTC"></div>`,
    );
    const bar = query(fixture, "[data-key='offsite']");
    expect(bar.hasAttribute('data-bar')).toBe(true);
    expect(bar.style.getPropertyValue('--slotted-event-span')).toBe('3');
    expect(cell(fixture, '2026-09-09').textContent).toContain('Offsite, continues');
    expect(fixture.nativeElement.querySelectorAll("[data-key^='standup@']")).toHaveLength(3);
    expect(query(fixture, "[data-key='dentist']").textContent).toContain('tentative');
  });

  it('asks to move a period, with the reason of the gesture', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [events]="[]" [defaultDate]="twentyFourth" locale="en-US" timeZone="UTC" (dateRequest)="onDate($event)" (rangeChange)="ranges.push($event)"></div>`,
    );
    const host = fixture.componentInstance;
    query(fixture, "[data-part='next']").dispatchEvent(
      new MouseEvent('click', { detail: 1, bubbles: true }),
    );
    fixture.detectChanges();
    expect(host.dates.at(-1)?.value).toEqual(day(24, 10));
    expect(host.dates.at(-1)?.reason).toBe('pointer');
    expect(host.ranges.at(-1)).toEqual({ start: day(27, 9), end: day(31, 10), view: 'month' });
  });

  it('moves the day with the arrows, and goes in and out of a day', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [calendars]="calendars" [events]="events" [defaultDate]="twentyThird" locale="en-US" timeZone="UTC" (dateRequest)="onDate($event)"></div>`,
    );
    const start = cell(fixture, '2026-09-23');
    start.focus();
    key(fixture, start, 'Enter');
    expect(document.activeElement?.getAttribute('data-part')).toBe('day-number');
    key(fixture, document.activeElement as HTMLElement, 'ArrowDown');
    expect(document.activeElement?.getAttribute('data-key')).toBe('standup@2026-09-23');
    key(fixture, document.activeElement as HTMLElement, 'Escape');
    expect(document.activeElement).toBe(start);
    key(fixture, start, 'ArrowRight');
    expect(fixture.componentInstance.dates.at(-1)?.reason).toBe('keyboard');
    expect(roving(fixture)).toBe(cell(fixture, '2026-09-24'));
  });

  it('lays overlapping events in columns and marks the change of the clocks', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [events]="events" [defaultDate]="twentyThird" defaultView="day" locale="en-US" timeZone="UTC"></div>
       <div slEventCalendar [events]="[]" [defaultDate]="firstOfNovember" defaultView="day" locale="en-US" timeZone="America/New_York"></div>`,
    );
    const review = query(fixture, "[data-key='a']");
    expect(review.style.getPropertyValue('--slotted-event-columns')).toBe('2');
    expect(review.style.getPropertyValue('--slotted-event-start')).toBe('780');
    expect(query(fixture, "[data-part='offset-change']").getAttribute('aria-label')).toBe(
      'Clocks go back 1 hour at 2:00 AM',
    );
  });

  it('shades the hours nobody works in', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [events]="[]" [defaultDate]="twentyFourth" defaultView="day" timeZone="UTC" [workingHours]="working"></div>`,
    );
    const off = [
      ...fixture.nativeElement.querySelectorAll("[data-part='off-hours']"),
    ] as HTMLElement[];
    expect(off.map((element) => element.style.getPropertyValue('--slotted-event-length'))).toEqual([
      '540',
      '420',
    ]);
  });

  it('chooses days with Space and Shift, clears with Escape, and honors a cancel', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [events]="[]" [defaultDate]="twentyFourth" selectionMode="range" timeZone="UTC" (selectionRequest)="onSelection($event)"></div>`,
    );
    const host = fixture.componentInstance;
    const start = cell(fixture, '2026-09-24');
    start.focus();
    key(fixture, start, ' ');
    expect(host.selections.at(-1)?.value).toEqual({ start: day(24), end: day(24) });
    key(fixture, roving(fixture), 'ArrowRight', { shiftKey: true });
    expect(host.selections.at(-1)?.value).toEqual({ start: day(24), end: day(25) });
    expect(cell(fixture, '2026-09-25').hasAttribute('data-selected')).toBe(true);
    key(fixture, roving(fixture), 'Escape');
    expect(host.selections.at(-1)?.reason).toBe('escape');
  });

  it('asks to open an event, and hosts its detail when a template is given', async () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [calendars]="calendars" [events]="events" [defaultDate]="twentyFourth" locale="en-US" timeZone="UTC" (openEventRequest)="onOpen($event)">
         <ng-template slEventCalendarDetail let-occurrence><p>Detail of {{ occurrence.event.title }}</p></ng-template>
       </div>`,
    );
    const dentist = query(fixture, "[data-key='dentist']");
    dentist.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.opens.at(-1)?.value).toBe('dentist');
    expect(query(fixture, "[data-key='dentist']").getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Detail of Dentist');
  });

  it('writes the consumer’s day content and actions, and reads the provider', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [events]="[]" [defaultDate]="twentyFourth" timeZone="UTC">
         <ng-template slEventCalendarDayContent let-date>{{ date.day === 25 ? 'Payroll' : '' }}</ng-template>
         <button slEventCalendarActions type="button">New event</button>
       </div>`,
      [
        provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }),
        provideEventCalendarDefaults({ weekNumbers: true }),
      ],
    );
    expect(cell(fixture, '2026-09-25').textContent).toContain('Payroll');
    expect(query(fixture, "[data-part='actions']").textContent).toContain('New event');
    // language: pt-BR
    expect(query(fixture, "[data-part='today']").textContent?.trim()).toBe('Hoje');
    expect(query(fixture, "[data-part='title']").textContent?.trim()).toBe('setembro de 2026');
    // language: en-US
    expect(query(fixture, "[data-part='week-number']")).not.toBeNull();
  });

  it('changes its words and its date format together with the language in force', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<div slEventCalendar [events]="[]" [defaultDate]="twentyFourth" timeZone="UTC"></div>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );
    const today = () => query(fixture, "[data-part='today']").textContent?.trim();
    const title = () => query(fixture, "[data-part='title']").textContent?.trim();

    // language: pt-BR
    expect(today()).toBe('Hoje');
    expect(title()).toBe('setembro de 2026');
    // language: en-US

    locale.set('en-US');
    fixture.detectChanges();
    expect(today()).toBe('Today');
    expect(title()).toBe('September 2026');
  });

  it('lays its own messages over the language in force', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [events]="[]" [defaultDate]="twentyFourth" timeZone="UTC" locale="en-US" [messages]="{ next: { month: 'Following month' } }"></div>`,
    );
    expect(query(fixture, "[data-part='next']").getAttribute('aria-label')).toBe('Following month');
    expect(query(fixture, "[data-part='previous']").getAttribute('aria-label')).toBe(
      'Previous month',
    );
  });

  it('draws a list with a heading per day, and its empty state', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [events]="events" [defaultDate]="twentyFourth" defaultView="list" locale="en-US" timeZone="UTC"></div>
       <div slEventCalendar [events]="[]" [defaultDate]="twentyFourth" defaultView="list" locale="en-US" timeZone="UTC">
         <button slEventCalendarEmpty type="button">New event</button>
       </div>`,
    );
    const headings = [
      ...fixture.nativeElement.querySelectorAll("[data-part='list-day-heading']"),
    ] as HTMLElement[];
    const tuesday = headings.find(
      (element) => element.getAttribute('aria-label') === 'Tuesday, September 22',
    );
    expect(tuesday?.querySelector("[data-part='list-weekday']")?.textContent?.trim()).toBe(
      'Tuesday',
    );
    expect(tuesday?.querySelector("[data-part='list-date']")?.textContent?.trim()).toBe(
      'September 22',
    );
    expect(fixture.nativeElement.textContent).toContain('No events this week.');
  });

  it('draws an event that ended before now a step back', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [events]="withLater" [defaultDate]="twentyThird" defaultView="week" timeZone="UTC"></div>`,
    );
    TestBed.tick();
    fixture.detectChanges();
    expect(query(fixture, "[data-key='a']").hasAttribute('data-past')).toBe(true);
    expect(query(fixture, "[data-key='later']").hasAttribute('data-past')).toBe(false);
  });

  it('moves an editable event a slot, a day and its end with Alt and the arrows', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar editable [events]="events" [defaultDate]="twentyThird" defaultView="week" timeZone="UTC" (eventChangeRequest)="onChange($event)"></div>`,
    );
    const { changes } = fixture.componentInstance;
    const review = query(fixture, "[data-key='a']");
    expect(review.hasAttribute('data-editable')).toBe(true);
    expect(review.querySelector("[data-part='resize-handle']")).not.toBeNull();
    review.focus();
    key(fixture, review, 'ArrowDown', { altKey: true });
    expect(changes.at(-1)).toMatchObject({
      key: 'a',
      kind: 'move',
      start: at(23, 13, 30),
      end: at(23, 15, 30),
    });
    key(fixture, review, 'ArrowRight', { altKey: true });
    expect(changes.at(-1)).toMatchObject({ start: at(24, 13), end: at(24, 15) });
    key(fixture, review, 'ArrowUp', { altKey: true, shiftKey: true });
    expect(changes.at(-1)).toMatchObject({
      kind: 'resize',
      start: at(23, 13),
      end: at(23, 14, 30),
    });
  });

  it('moves by any step of minutes, and rules the hours at it', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar editable [events]="events" [defaultDate]="twentyThird" defaultView="week" timeZone="UTC" slotDuration="10" (eventChangeRequest)="onChange($event)"></div>`,
    );
    const { changes } = fixture.componentInstance;
    const grid = query(fixture, "[data-part='time-grid']");
    expect(grid.style.getPropertyValue('--slotted-event-calendar-slot')).toBe('10');
    const review = query(fixture, "[data-key='a']");
    review.focus();
    key(fixture, review, 'ArrowDown', { altKey: true });
    expect(changes.at(-1)).toMatchObject({ start: at(23, 13, 10), end: at(23, 15, 10) });
  });

  it('writes an all-day move in dates, and edits only what the predicate allows', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [editable]="onlyOffsite" [events]="events" [defaultDate]="eighth" timeZone="UTC" (eventChangeRequest)="onChange($event)"></div>`,
    );
    const { changes } = fixture.componentInstance;
    expect(query(fixture, "[data-key='dentist']").hasAttribute('data-editable')).toBe(false);
    const offsite = query(fixture, "[data-key='offsite']");
    offsite.focus();
    key(fixture, offsite, 'ArrowRight', { altKey: true });
    expect(changes.at(-1)).toMatchObject({ kind: 'move', start: day(9), end: day(11) });
  });

  it('opens the application’s context menu on an event, on a day and from the keyboard', async () => {
    const fixture = renderTemplate(
      `<div slEventCalendar [events]="events" [defaultDate]="twentyFourth" locale="en-US" timeZone="UTC">
         <ng-template slEventCalendarContextMenu [slEventCalendarContextMenuFor]="notTheTwentyFifth" let-target>
           <button slMenuItem>{{ target.kind === 'event' ? 'Duplicate' : 'New event' }}</button>
         </ng-template>
       </div>`,
    );
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const menu = () =>
      document.querySelector("[data-ui='menu'][data-open] [role='menu']") as HTMLElement | null;
    const secondary = (target: HTMLElement) => {
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 10,
        clientY: 10,
      });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    await settle();

    expect(secondary(query(fixture, "[data-key='dentist']"))).toBe(true);
    await settle();
    expect(menu()?.getAttribute('aria-label')).toBe('Dentist');
    expect(menu()?.querySelector("[role='menuitem']")?.textContent).toContain('Duplicate');
    expect(query(fixture, "[data-key='dentist']").hasAttribute('data-context')).toBe(true);
    menu()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(menu()).toBeNull();
    expect(query(fixture, "[data-key='dentist']").hasAttribute('data-context')).toBe(false);

    secondary(cell(fixture, '2026-09-10'));
    await settle();
    expect(menu()?.getAttribute('aria-label')).toBe('Thursday, September 10');
    expect(menu()?.querySelector("[role='menuitem']")?.textContent).toContain('New event');
    expect(cell(fixture, '2026-09-10').hasAttribute('data-selected')).toBe(true);
    menu()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();

    /* No menu for the day: the browser's own menu is left alone. */
    expect(secondary(cell(fixture, '2026-09-25'))).toBe(false);
    await settle();
    expect(menu()).toBeNull();

    const dentist = query(fixture, "[data-key='dentist']");
    dentist.focus();
    dentist.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true }),
    );
    await settle();
    expect(menu()?.getAttribute('aria-label')).toBe('Dentist');
  });

  it('opens a day and an event as sheets from the bottom below the compact size class', async () => {
    /* jsdom lays nothing out: every box is a phone's width. */
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 360,
      height: 640,
      top: 0,
      left: 0,
      right: 360,
      bottom: 640,
    } as DOMRect);
    try {
      const fixture = renderTemplate(
        `<div slEventCalendar compact="keep" [events]="events" [defaultDate]="twentyFourth" locale="en-US" timeZone="UTC">
           <ng-template slEventCalendarDetail let-occurrence><p>Detail of {{ occurrence.event.title }}</p></ng-template>
         </div>`,
      );
      await fixture.whenStable();
      fixture.detectChanges();
      const number = query(
        fixture,
        "[data-row='day'][data-date='2026-09-22'] [data-part='day-number']",
      );
      expect(number.getAttribute('aria-haspopup')).toBe('dialog');

      number.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const sheet = query(fixture, "[data-ui='drawer'][data-side='bottom']");
      expect(sheet).not.toBeNull();
      expect(query(fixture, "[data-ui='popover']")).toBeNull();
      expect(sheet.querySelector("[data-part='panel']")?.getAttribute('role')).toBe('dialog');
      const inSheet = sheet.querySelector<HTMLElement>("[data-key='dentist']");
      expect(inSheet).not.toBeNull();

      inSheet?.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const detail = [...fixture.nativeElement.querySelectorAll("[data-ui='drawer']")].find(
        (layer) => (layer as HTMLElement).textContent?.includes('Detail of Dentist'),
      ) as HTMLElement | undefined;
      expect(detail?.getAttribute('data-side')).toBe('bottom');
      expect(detail?.querySelector("[data-part='detail-range']")).not.toBeNull();
    } finally {
      measure.mockRestore();
    }
  });

  it('drags a bar by the day under the pointer, not by the day it starts on', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar editable [events]="events" [defaultDate]="eighth" timeZone="UTC" (eventChangeRequest)="onChange($event)"></div>`,
    );
    const { changes } = fixture.componentInstance;
    /* jsdom lays nothing out: the two days the hand crosses get boxes. */
    const place = (iso: string, left: number) => {
      cell(fixture, iso).getBoundingClientRect = () =>
        ({ left, right: left + 100, top: 0, bottom: 100, width: 100, height: 100 }) as DOMRect;
    };
    place('2026-09-09', 100);
    place('2026-09-10', 200);
    const pointer = (type: string, on: EventTarget, x: number, y: number) => {
      on.dispatchEvent(
        new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y }) as PointerEvent,
      );
      fixture.detectChanges();
    };
    pointer('pointerdown', query(fixture, "[data-key='offsite']"), 150, 50);
    pointer('pointermove', document, 250, 50);
    expect(query(fixture, "[data-key='offsite']").hasAttribute('data-dragging')).toBe(true);
    expect(changes).toHaveLength(0);
    pointer('pointerup', document, 250, 50);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ kind: 'move', start: day(9), end: day(11) });
    expect(query(fixture, "[data-key='offsite']").hasAttribute('data-dragging')).toBe(false);
  });

  it('draws a destination canDrop refuses, and asks nothing when let go there', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar editable [canDrop]="notTheNinth" [events]="events" [defaultDate]="eighth" timeZone="UTC" (eventChangeRequest)="onChange($event)"></div>`,
    );
    const { changes, asked } = fixture.componentInstance;
    const place = (iso: string, left: number) => {
      cell(fixture, iso).getBoundingClientRect = () =>
        ({ left, right: left + 100, top: 0, bottom: 100, width: 100, height: 100 }) as DOMRect;
    };
    place('2026-09-08', 0);
    place('2026-09-09', 100);
    const pointer = (type: string, on: EventTarget, x: number, y: number) => {
      on.dispatchEvent(
        new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y }) as PointerEvent,
      );
      fixture.detectChanges();
    };
    pointer('pointerdown', query(fixture, "[data-key='offsite']"), 50, 50);
    pointer('pointermove', document, 150, 50);
    const dragged = query(fixture, "[data-key='offsite']");
    expect(dragged.hasAttribute('data-dragging')).toBe(true);
    expect(dragged.hasAttribute('data-drop-invalid')).toBe(true);
    expect(asked.at(-1)).toMatchObject({ key: 'offsite', kind: 'move', start: day(9) });
    pointer('pointerup', document, 150, 50);
    expect(changes).toHaveLength(0);
    expect(query(fixture, "[data-key='offsite']").hasAttribute('data-drop-invalid')).toBe(false);
  });

  it('passes over refused destinations with Alt and the arrows', () => {
    const fixture = renderTemplate(
      `<div slEventCalendar editable [canDrop]="notTheNinthOrTenth" [events]="events" [defaultDate]="eighth" timeZone="UTC" (eventChangeRequest)="onChange($event)"></div>`,
    );
    const offsite = query(fixture, "[data-key='offsite']");
    offsite.focus();
    key(fixture, offsite, 'ArrowRight', { altKey: true });
    expect(fixture.componentInstance.changes.at(-1)).toMatchObject({
      kind: 'move',
      start: day(11),
      end: day(13),
    });
  });

  it('keeps the event where it is when no destination in reach is allowed', () => {
    const announce = vi.spyOn(getLiveAnnouncer(document), 'announce');
    const fixture = renderTemplate(
      `<div slEventCalendar editable [canDrop]="nowhere" [events]="events" [defaultDate]="eighth" timeZone="UTC" (eventChangeRequest)="onChange($event)"></div>`,
    );
    const offsite = query(fixture, "[data-key='offsite']");
    offsite.focus();
    key(fixture, offsite, 'ArrowRight', { altKey: true });
    expect(fixture.componentInstance.changes).toHaveLength(0);
    expect(announce).toHaveBeenCalledWith('Offsite cannot move there');
  });
});
