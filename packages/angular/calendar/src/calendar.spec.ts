import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/calendar/contract.json';
import { SlCalendar } from './calendar';
import { provideCalendarDefaults } from './calendar-defaults';
import type { CalendarValue, DateRange } from './calendar-defaults';

const NINTH = plainDate(2026, 9, 9);

@Component({
  standalone: true,
  imports: [SlCalendar],
  template: `<div slCalendar></div>`,
})
class Host {
  readonly ninth = NINTH;
  readonly owned = signal(plainDate(2026, 9, 30));
  readonly january = plainDate(2026, 1, 31);
  readonly february = plainDate(2026, 2, 1);
  readonly june = plainDate(2026, 6, 1);
  readonly seventeenth = plainDate(2026, 9, 17);
  readonly fifteenth = plainDate(2026, 9, 15);
  readonly run: DateRange = { start: plainDate(2026, 9, 7), end: plainDate(2026, 9, 11) };
  readonly openRun: DateRange = { start: plainDate(2026, 9, 7), end: null };
  readonly openFromEleventh: DateRange = { start: plainDate(2026, 9, 11), end: null };
  readonly refuseTenth = (date: PlainDate) => date.day === 10;
  readonly marks = new Map([['2026-09-12', { count: 2, tone: 'info' as const }]]);
  readonly values: CalendarValue[] = [];
  readonly previews: (PlainDate | null)[] = [];
  readonly onPreview = vi.fn((date: PlainDate | null) => {
    this.previews.push(date);
  });
  readonly focusRequests: ChangeRequest<PlainDate>[] = [];
  readonly onValue = vi.fn((request: ChangeRequest<CalendarValue>) => {
    this.values.push(request.value);
  });
  readonly onFocused = vi.fn((request: ChangeRequest<PlainDate>) => {
    this.focusRequests.push(request);
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
  fixture.nativeElement.querySelector('[data-ui="calendar"]') as HTMLElement;
const days = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="day"]')] as HTMLElement[];
const dayFor = (fixture: Fixture, number: number) =>
  days(fixture).find(
    (element) =>
      (element.textContent ?? '').trim() === String(number) &&
      element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') === false,
  ) as HTMLElement;
const roving = (fixture: Fixture) =>
  days(fixture).find((element) => element.tabIndex === 0) as HTMLElement;
const headingText = (fixture: Fixture) =>
  (fixture.nativeElement.querySelector('[data-part="heading"]').textContent ?? '').trim();

const press = (fixture: Fixture, key: string, init: KeyboardEventInit = {}) => {
  root(fixture).dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
  );
  fixture.detectChanges();
};

const click = (fixture: Fixture, element: HTMLElement) => {
  element.click();
  fixture.detectChanges();
};

describe('the shape the pattern asks for', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" weekNumbers [defaultFocusedDate]="ninth"></div>`,
    );

    const present = [...fixture.nativeElement.querySelectorAll('[data-part]')].map(
      (element: Element) => (element as HTMLElement).dataset['part'],
    );
    expect(root(fixture).getAttribute('data-ui')).toBe(contract.ui);
    for (const part of ['root', 'header', 'previous', 'next', 'heading', 'grids', 'grid']) {
      expect(present).toContain(part);
    }
  });

  it('puts the grid role on a real table and writes none of the implied ones', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth"></div>`,
    );

    expect(fixture.nativeElement.querySelector('[data-part="grid"]').tagName).toBe('TABLE');
    expect(fixture.nativeElement.querySelector('tr[role]')).toBeNull();
    expect(fixture.nativeElement.querySelector('td[role]')).toBeNull();
  });

  it('gives the column header the full weekday name a reader hears', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth"></div>`,
    );
    const headers = [...fixture.nativeElement.querySelectorAll('[data-part="week-header"]')];
    expect(headers).toHaveLength(7);
    expect((headers[0] as HTMLElement).getAttribute('abbr')).toBe('domingo');
  });

  it('keeps exactly one cell in the tab sequence', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth"></div>`,
    );
    expect(days(fixture).filter((element) => element.tabIndex === 0)).toHaveLength(1);
    expect((roving(fixture).textContent ?? '').trim()).toBe('9');
  });

  it('names the month in a live region, because a key changes nothing else', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth"></div>`,
    );
    expect(
      fixture.nativeElement.querySelector('[data-part="heading"]').getAttribute('aria-live'),
    ).toBe('polite');
    expect(headingText(fixture)).toBe('setembro de 2026');
  });
});

describe('the keyboard the grid pattern lists', () => {
  it('moves by a day and by a week', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth"></div>`,
    );

    press(fixture, 'ArrowRight');
    expect((roving(fixture).textContent ?? '').trim()).toBe('10');

    press(fixture, 'ArrowDown');
    expect((roving(fixture).textContent ?? '').trim()).toBe('17');

    press(fixture, 'ArrowUp');
    expect((roving(fixture).textContent ?? '').trim()).toBe('10');
  });

  it('goes to the ends of the displayed week', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth"></div>`,
    );

    press(fixture, 'Home');
    expect((roving(fixture).textContent ?? '').trim()).toBe('6');

    press(fixture, 'End');
    expect((roving(fixture).textContent ?? '').trim()).toBe('12');
  });

  /** The APG clamps to the last day a short month has. */
  it('pages a month and clamps the day the next one cannot hold', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="january"></div>`,
    );

    press(fixture, 'PageDown');
    expect(headingText(fixture)).toBe('fevereiro de 2026');
    expect((roving(fixture).textContent ?? '').trim()).toBe('28');
  });

  it('pages a year with Shift', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth"></div>`,
    );

    press(fixture, 'PageDown', { shiftKey: true });
    expect(headingText(fixture)).toBe('setembro de 2027');
  });

  it('selects with Enter', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth" (valueChange)="onValue($event)"></div>`,
    );

    press(fixture, 'Enter');
    expect(fixture.componentInstance.values.at(-1)).toEqual(NINTH);
  });
});

/** A day that holds items carries a mark, and its count is in the day's name. */
describe('a day that carries a mark', () => {
  it('draws the mark in that cell alone and names its count', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="en-US" [defaultFocusedDate]="ninth" [marks]="marks"></div>`,
    );
    const marks = fixture.nativeElement.querySelectorAll('[data-part="mark"]');
    expect(marks).toHaveLength(1);
    const day = marks[0].closest('[data-part="day"]') as HTMLElement;
    expect(day.textContent?.trim()).toBe('12, 2 items');
    expect(marks[0].getAttribute('data-tone')).toBe('info');
  });
});

describe('what a cell says', () => {
  it('keeps a refused date reachable and refuses to select it', () => {
    const fixture = renderTemplate(
      `<div
         slCalendar
         locale="pt-BR"
         [defaultFocusedDate]="ninth"
         [isDateUnavailable]="refuseTenth"
         (valueChange)="onValue($event)"
       ></div>`,
    );

    const tenth = dayFor(fixture, 10);
    expect(tenth.getAttribute('aria-disabled')).toBe('true');
    expect(tenth.closest('[data-part="cell"]')?.hasAttribute('data-unavailable')).toBe(true);

    click(fixture, tenth);
    expect(fixture.componentInstance.values).toHaveLength(0);

    press(fixture, 'ArrowRight');
    expect((roving(fixture).textContent ?? '').trim()).toBe('10');
  });

  it('refuses a date outside the bounds', () => {
    const fixture = renderTemplate(
      `<div
         slCalendar
         locale="pt-BR"
         [defaultFocusedDate]="ninth"
         [min]="fifteenth"
         (valueChange)="onValue($event)"
       ></div>`,
    );

    click(fixture, dayFor(fixture, 10));
    expect(fixture.componentInstance.values).toHaveLength(0);
  });

  it('marks a day of the month either side', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth"></div>`,
    );
    expect(
      fixture.nativeElement.querySelector('[data-part="cell"][data-outside-month]'),
    ).not.toBeNull();
  });

  /**
   * September's grid ends with the first days of October and October's begins
   * with the last days of September, so a pair that draws both writes the same
   * six dates twice — and a range across the boundary was painted twice on the
   * reference page.
   */
  it('draws no day of a neighbouring month when more than one month is shown', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [months]="2" [defaultFocusedDate]="ninth"></div>`,
    );
    const outside = [
      ...fixture.nativeElement.querySelectorAll('[data-part="cell"][data-outside-month]'),
    ] as Element[];
    expect(outside.length).toBeGreaterThan(0);
    for (const cell of outside) {
      expect(cell.querySelector('[data-part="day"]')).toBeNull();
    }

    /* Sixty-one days across the two grids, each written once. */
    expect(fixture.nativeElement.querySelectorAll('[data-part="day"]')).toHaveLength(61);
  });

  it('draws them again in a pair when the consumer asks for them', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [months]="2" outsideDays="shown" [defaultFocusedDate]="ninth"></div>`,
    );
    expect(
      fixture.nativeElement.querySelector('[data-part="cell"][data-outside-month]'),
    ).not.toBeNull();
  });
});

describe('the three selection modes', () => {
  it('takes one date', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth" (valueChange)="onValue($event)"></div>`,
    );

    click(fixture, dayFor(fixture, 10));
    expect(fixture.componentInstance.values.at(-1)).toEqual(plainDate(2026, 9, 10));
  });

  /**
   * A reader who chooses the 11th and then the 7th means the 7th to the 11th,
   * not a range that runs backwards.
   */
  it('orders a range whichever end is chosen first', () => {
    const fixture = renderTemplate(
      `<div
         slCalendar
         locale="pt-BR"
         selectionMode="range"
         [defaultFocusedDate]="ninth"
         (valueChange)="onValue($event)"
       ></div>`,
    );

    click(fixture, dayFor(fixture, 11));
    click(fixture, dayFor(fixture, 7));

    const value = fixture.componentInstance.values.at(-1) as DateRange;
    expect(value.start).toEqual(plainDate(2026, 9, 7));
    expect(value.end).toEqual(plainDate(2026, 9, 11));
  });

  it('draws the two ends and the run between them', () => {
    const fixture = renderTemplate(
      `<div
         slCalendar
         locale="pt-BR"
         selectionMode="range"
         [defaultFocusedDate]="ninth"
         [defaultValue]="run"
       ></div>`,
    );

    expect(
      (
        fixture.nativeElement.querySelector('[data-range-start] [data-part="day"]')?.textContent ??
        ''
      ).trim(),
    ).toBe('7');
    expect(fixture.nativeElement.querySelectorAll('[data-in-range]')).toHaveLength(3);
  });

  /**
   * While the run has one end, the grid draws where it would close — under
   * the pointer, or on the focused day — and says so. `date-range-picker`
   * reads the day to say how long the run would be.
   */
  it('previews the open run to the day under the pointer, and reports it', () => {
    const fixture = renderTemplate(
      `<div
         slCalendar
         locale="pt-BR"
         selectionMode="range"
         [defaultFocusedDate]="ninth"
         [defaultValue]="openRun"
         (previewChange)="onPreview($event)"
       ></div>`,
    );
    const text = (selector: string) =>
      (fixture.nativeElement.querySelector(selector)?.textContent ?? '').trim();

    dayFor(fixture, 11).dispatchEvent(new Event('pointerenter', { bubbles: false }));
    fixture.detectChanges();

    expect(fixture.componentInstance.previews.at(-1)).toEqual(plainDate(2026, 9, 11));
    expect(text('[data-range-end][data-preview] [data-part="day"]')).toBe('11');
    expect(fixture.nativeElement.querySelectorAll('[data-in-range][data-preview]')).toHaveLength(3);
    /* The chosen start is a choice, not a proposal. */
    expect(
      fixture.nativeElement.querySelector('[data-range-start]')?.hasAttribute('data-preview'),
    ).toBe(false);

    dayFor(fixture, 11).dispatchEvent(new Event('pointerleave', { bubbles: false }));
    fixture.detectChanges();
    /* Nothing under the pointer: the focused day is the pending end. */
    expect(fixture.componentInstance.previews.at(-1)).toEqual(NINTH);
    expect(text('[data-range-end][data-preview] [data-part="day"]')).toBe('9');
  });

  it('previews backwards when the pending end is before the start', () => {
    const fixture = renderTemplate(
      `<div
         slCalendar
         locale="pt-BR"
         selectionMode="range"
         [defaultFocusedDate]="ninth"
         [defaultValue]="openFromEleventh"
       ></div>`,
    );
    press(fixture, 'ArrowLeft');
    press(fixture, 'ArrowLeft');

    const start = fixture.nativeElement.querySelector('[data-range-start]');
    expect((start?.textContent ?? '').trim()).toBe('7');
    expect(start?.hasAttribute('data-preview')).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[data-range-end]')?.hasAttribute('data-preview'),
    ).toBe(false);
  });

  it('draws no preview once the run is whole', () => {
    const fixture = renderTemplate(
      `<div
         slCalendar
         locale="pt-BR"
         selectionMode="range"
         [defaultFocusedDate]="ninth"
         [value]="run"
       ></div>`,
    );
    dayFor(fixture, 20).dispatchEvent(new Event('pointerenter', { bubbles: false }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-preview]')).toBeNull();
  });

  it('adds to a set and takes a date back out of it', () => {
    const fixture = renderTemplate(
      `<div
         slCalendar
         locale="pt-BR"
         selectionMode="multiple"
         [defaultFocusedDate]="ninth"
         (valueChange)="onValue($event)"
       ></div>`,
    );

    click(fixture, dayFor(fixture, 7));
    click(fixture, dayFor(fixture, 11));
    expect(fixture.componentInstance.values.at(-1)).toHaveLength(2);

    click(fixture, dayFor(fixture, 7));
    expect(fixture.componentInstance.values.at(-1)).toHaveLength(1);
  });
});

describe('the three views', () => {
  /**
   * The chevrons are `Glyph` elements inside `Icon` boxes, never masks: the
   * page triggers mirror under `dir="rtl"`, and the year view, with no way
   * up, draws no chevron on its heading.
   */
  it('draws the page chevrons and the way up as glyph elements', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth"></div>`,
    );
    const icon = (part: string) =>
      root(fixture).querySelector(`[data-part="${part}"] > [data-ui="icon"]`);
    for (const part of ['previous', 'next']) {
      expect(icon(part)?.hasAttribute('data-directional')).toBe(true);
      expect(icon(part)?.querySelector('svg')?.getAttribute('data-glyph')).toBe('chevron-right');
    }
    expect(icon('heading')?.querySelector('svg')?.getAttribute('data-glyph')).toBe('chevron-down');

    click(fixture, root(fixture).querySelector('[data-part="heading"]') as HTMLElement);
    click(fixture, root(fixture).querySelector('[data-part="heading"]') as HTMLElement);
    expect(root(fixture).getAttribute('data-view')).toBe('year');
    expect(icon('heading')).toBeNull();
  });

  it('walks up from the day view and back down', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth"></div>`,
    );

    click(fixture, fixture.nativeElement.querySelector('[data-part="heading"]') as HTMLElement);
    expect(root(fixture).getAttribute('data-view')).toBe('month');

    click(fixture, fixture.nativeElement.querySelector('[data-part="heading"]') as HTMLElement);
    expect(root(fixture).getAttribute('data-view')).toBe('year');
  });

  /**
   * `Escape` inside a month or year view goes down a view rather than out of
   * the component, which is the staging `dismissable-layer` asks for.
   */
  it('takes Escape down a view rather than out of the component', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" defaultView="year" [defaultFocusedDate]="ninth"></div>`,
    );

    press(fixture, 'Escape');
    expect(root(fixture).getAttribute('data-view')).toBe('month');

    press(fixture, 'Escape');
    expect(root(fixture).getAttribute('data-view')).toBe('day');
  });

  it('leaves Escape alone in the day view, so a surface above it may close', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth"></div>`,
    );

    press(fixture, 'Escape');
    expect(root(fixture).getAttribute('data-view')).toBe('day');
  });

  it('picks a month from the month view and returns to the days', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" defaultView="month" [defaultFocusedDate]="ninth"></div>`,
    );

    const january = fixture.nativeElement.querySelectorAll(
      '[data-part="period"]',
    )[0] as HTMLElement;
    click(fixture, january);
    expect(root(fixture).getAttribute('data-view')).toBe('day');
    expect(headingText(fixture)).toBe('janeiro de 2026');
  });
});

describe('how much of it is drawn', () => {
  it('draws more than one month, and names each one', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [months]="2" [defaultFocusedDate]="ninth"></div>`,
    );

    expect(fixture.nativeElement.querySelectorAll('[data-part="grid"]')).toHaveLength(2);
    const captions = [...fixture.nativeElement.querySelectorAll('[data-part="grid-caption"]')].map(
      (element: Element) => (element.textContent ?? '').trim(),
    );
    expect(captions).toEqual(['setembro de 2026', 'outubro de 2026']);
  });

  /**
   * Drawing the pair from the focused date meant that choosing a day in the
   * second month scrolled the pair: a reader looking at June and July who
   * chose 9 June was shown July and August, with half of what they had just
   * chosen off screen.
   */
  it('does not move the pair when a day in the second month is chosen', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [months]="2" [defaultFocusedDate]="june"></div>`,
    );
    const captions = () =>
      [...fixture.nativeElement.querySelectorAll('[data-part="grid-caption"]')].map(
        (element: Element) => (element.textContent ?? '').trim(),
      );
    expect(captions()).toEqual(['junho de 2026', 'julho de 2026']);

    const july = fixture.nativeElement.querySelectorAll('[data-part="grid"]')[1] as HTMLElement;
    const ninth = [...july.querySelectorAll('[data-part="day"]')].find(
      (element: Element) =>
        ((element as HTMLElement).textContent ?? '').trim() === '9' &&
        element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') === false,
    ) as HTMLElement;
    click(fixture, ninth);

    expect(captions()).toEqual(['junho de 2026', 'julho de 2026']);
  });

  it('moves the pair by a whole page when the reader steps past its edge', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [months]="2" [defaultFocusedDate]="june"></div>`,
    );

    press(fixture, 'ArrowLeft');
    const captions = [...fixture.nativeElement.querySelectorAll('[data-part="grid-caption"]')].map(
      (element: Element) => (element.textContent ?? '').trim(),
    );
    expect(captions).toEqual(['abril de 2026', 'maio de 2026']);
  });

  it('draws six rows on request, so a popup does not resize under the pointer', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" fixedWeeks [defaultFocusedDate]="february"></div>`,
    );
    expect(fixture.nativeElement.querySelectorAll('[data-part="week"]')).toHaveLength(6);
  });

  it('draws a week number column on request', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" weekNumbers [defaultFocusedDate]="ninth"></div>`,
    );
    expect(root(fixture).hasAttribute('data-week-numbers')).toBe(true);
    expect(
      fixture.nativeElement.querySelectorAll('th[data-part="week-number"]').length,
    ).toBeGreaterThan(1);
  });
});

describe('what an application sets once', () => {
  it('takes the shape from a provider and the locale from the language in force', () => {
    const fixture = renderTemplate(`<div slCalendar [defaultFocusedDate]="ninth"></div>`, [
      provideSlotted({ locale: 'de-DE' }),
      provideCalendarDefaults({ fixedWeeks: true }),
    ]);

    expect(headingText(fixture)).toBe('September 2026');
    expect(fixture.nativeElement.querySelectorAll('[data-part="week"]')).toHaveLength(6);
  });

  it('lets one calendar outrank the language in force', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" [defaultFocusedDate]="ninth"></div>`,
      [provideSlotted({ locale: 'de-DE' })],
    );
    expect(headingText(fixture)).toBe('setembro de 2026');
  });

  it('changes its words and its month names together with the language in force', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(`<div slCalendar [defaultFocusedDate]="ninth"></div>`, [
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);
    const previous = () =>
      fixture.nativeElement.querySelector('[data-part="previous"]').getAttribute('aria-label');

    // language: pt-BR
    expect(previous()).toBe('Mês anterior');
    // language: en-US
    expect(headingText(fixture)).toBe('setembro de 2026');

    locale.set('en-US');
    fixture.detectChanges();
    expect(previous()).toBe('Previous month');
    expect(headingText(fixture)).toBe('September 2026');
  });

  it('lays its own messages over the catalog', () => {
    const fixture = renderTemplate(
      `<div slCalendar [messages]="{ nextMonth: 'Seguinte' }" [defaultFocusedDate]="ninth"></div>`,
    );
    const name = (part: string) =>
      fixture.nativeElement.querySelector(`[data-part="${part}"]`).getAttribute('aria-label');
    expect(name('next')).toBe('Seguinte');
    expect(name('previous')).toBe('Previous month');
  });
});

describe('the composition surface', () => {
  it('separates the date chosen from the date the reader is on', () => {
    const fixture = renderTemplate(
      `<div
         slCalendar
         locale="pt-BR"
         [defaultFocusedDate]="ninth"
         (focusedDateChange)="onFocused($event)"
       ></div>`,
    );

    press(fixture, 'ArrowRight');
    const request = fixture.componentInstance.focusRequests.at(-1);
    expect(request?.value).toEqual(plainDate(2026, 9, 10));
    expect(request?.reason).toBe('keyboard');
  });

  it('hands a template the instance and its imperative actions', () => {
    const fixture = renderTemplate(
      `<div slCalendar #cal="slCalendar" locale="pt-BR" [defaultFocusedDate]="ninth"></div>
       <button type="button" (click)="cal.focusDate(seventeenth)">ir</button>`,
    );

    click(fixture, fixture.nativeElement.querySelector('button:not([data-part])') as HTMLElement);
    expect((roving(fixture).textContent ?? '').trim()).toBe('17');
  });

  it('answers no press while it is read-only', () => {
    const fixture = renderTemplate(
      `<div
         slCalendar
         locale="pt-BR"
         readOnly
         [defaultFocusedDate]="ninth"
         (valueChange)="onValue($event)"
       ></div>`,
    );

    click(fixture, dayFor(fixture, 10));
    expect(fixture.componentInstance.values).toHaveLength(0);
  });

  it('takes every cell out of the tab sequence when it is disabled', () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="pt-BR" disabled [defaultFocusedDate]="ninth"></div>`,
    );
    expect(days(fixture).filter((element) => element.tabIndex === 0)).toHaveLength(0);
  });
});

describe('a focused date the consumer owns', () => {
  /**
   * Focus was put back on the old page's tab stop before the page followed
   * the date, so the cell it took was replaced and focus fell to the
   * document. Found by datetime-picker, which owns the focused date to answer
   * the day its list shows.
   */
  it('keeps focus on the grid when a key moves it onto another month', async () => {
    const fixture = renderTemplate(
      `<div slCalendar locale="en-US" [focusedDate]="owned()" (focusedDateChange)="owned.set($event.value)"></div>`,
    );
    const start = fixture.nativeElement.querySelector(
      '[data-part="day"][tabindex="0"]',
    ) as HTMLElement;
    expect(start.textContent?.trim()).toBe('30');
    start.focus();

    start.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement?.textContent?.trim()).toBe('1');
    expect(document.activeElement?.getAttribute('data-part')).toBe('day');
    expect(document.activeElement?.closest('[data-outside-month]')).toBeNull();
  });
});
