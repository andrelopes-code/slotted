import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { plainDate, plainDateTime, plainTime, toISODateTime } from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/datetime-picker/contract.json';
import { SlDateTimePicker } from './datetime-picker';
import type { DateTimePickerHighlight } from './datetime-picker';
import { provideDateTimePickerDefaults } from './datetime-picker-defaults';
import {
  SlDateTimePickerFooter,
  SlDateTimePickerOption,
  SlDateTimePickerPresets,
} from './datetime-picker-parts';

const TENTH = plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20));
/** Stated rather than read from the clock, so every assertion below is fixed. */
const REFERENCE = plainDateTime(plainDate(2026, 9, 10), plainTime(12, 0));

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlDateTimePicker,
    SlDateTimePickerFooter,
    SlDateTimePickerOption,
    SlDateTimePickerPresets,
  ],
  template: `<div slDateTimePicker></div>`,
})
class Host {
  readonly value = signal<PlainDateTime | null | undefined>(undefined);
  readonly control = new FormControl<PlainDateTime | null>(null);
  readonly tenth = TENTH;
  readonly reference = REFERENCE;
  readonly irregular = [plainTime(9, 0), plainTime(9, 20), plainTime(13, 45)];
  readonly closedDay = (_time: PlainTime, date: PlainDate) => date.day === 12;
  readonly onValue = vi.fn();
  readonly onOpen = vi.fn();
  readonly onHighlight = vi.fn((request: { value: DateTimePickerHighlight }) => request);
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
    '[data-ui="datetime-picker"][data-part="root"]',
  ) as HTMLElement;
const panel = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="content"]') as HTMLElement | null;
const trigger = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="trigger"]') as HTMLButtonElement;
const options = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="option"]')] as HTMLElement[];
const hidden = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="hidden-input"]') as HTMLInputElement;
const list = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="list"]') as HTMLElement | null;

const dayCell = (fixture: Fixture, day: number) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="day"]')].find(
    (element) => (element as HTMLElement).textContent?.trim() === String(day),
  ) as HTMLElement;

const click = (fixture: Fixture, element: HTMLElement) => {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  fixture.detectChanges();
};

const key = (
  fixture: Fixture,
  element: HTMLElement,
  name: string,
  init: KeyboardEventInit = {},
) => {
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: name, ...init }));
  fixture.detectChanges();
};

const OPEN = `locale="pt-BR" name="quando" defaultOpen [referenceDateTime]="reference"`;

describe('anatomy', () => {
  /**
   * The family composes the field and the grid and redraws neither. A second
   * segmented control or a second month grid would be two places to fix one
   * defect.
   */
  it('composes the field and the calendar rather than drawing either again', () => {
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN} [defaultValue]="tenth"></div>`);

    expect(root(fixture).dataset['ui']).toBe(contract.ui);
    expect(fixture.nativeElement.querySelector('[data-ui="datetime-field"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-ui="calendar"]')).not.toBeNull();
  });

  /** The role the APG's own Date Picker Combobox example gives its popup. */
  it('opens one dialog holding a grid and a listbox', () => {
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN} [defaultValue]="tenth"></div>`);

    expect(panel(fixture)?.getAttribute('role')).toBe('dialog');
    expect(trigger(fixture).getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="grid"]')).not.toBeNull();
    expect(list(fixture)?.getAttribute('role')).toBe('listbox');
  });

  /**
   * A `tablist` that exists on a narrow container and not on a wide one tells
   * assistive technology two different stories about the same component.
   */
  it('keeps both surfaces in the DOM, and draws no tablist at all', () => {
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN} [defaultValue]="tenth"></div>`);

    expect(panel(fixture)?.querySelector('[data-part="date-panel"]')).not.toBeNull();
    expect(panel(fixture)?.querySelector('[data-part="time-panel"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="tablist"]')).toBeNull();
  });

  it('says what the reader has so far at the head, and names no surface', () => {
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN} [defaultValue]="tenth"></div>`);
    const head = panel(fixture)?.querySelector('[data-part="head-value"]');
    expect(head?.textContent).toContain('setembro');
    expect(panel(fixture)?.querySelector('[data-part="panel-label"]')).toBeNull();
  });

  it('draws the missing half as a placeholder in the head', () => {
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN}></div>`);
    const placeholder = panel(fixture)?.querySelector(
      '[data-part="head-value"] [data-placeholder]',
    );
    expect(placeholder?.textContent?.trim()).toBe('--:--');
  });

  it('gives the list its own name: the day its times belong to', () => {
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN} [defaultValue]="tenth"></div>`);
    expect(list(fixture)?.getAttribute('aria-label')).toContain('set');
  });

  /** The two marks are `Glyph` elements inside an `Icon` box, never masks. */
  it('draws the calendar on the trigger and the clock on now as glyph elements', () => {
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN} [defaultValue]="tenth"></div>`);
    const mark = (element: Element | null | undefined) =>
      element?.querySelector("[data-ui='icon'] > svg[data-glyph]")?.getAttribute('data-glyph');
    expect(mark(trigger(fixture))).toBe(contract.marks.trigger);
    expect(mark(panel(fixture)?.querySelector('[data-part="now"]'))).toBe(contract.marks.now);
  });
});

describe('focus follows the missing half', () => {
  /**
   * The decision this family owes, in one sentence: the press that leaves the
   * value incomplete carries focus to the half that is missing, and the press
   * that completes the value closes the panel.
   */
  it('carries focus to the list when a day leaves the value incomplete', async () => {
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN}></div>`);

    click(fixture, dayCell(fixture, 11));
    await fixture.whenStable();

    expect(panel(fixture)).not.toBeNull();
    expect(hidden(fixture).value).toBe('');
    expect(document.activeElement?.getAttribute('role')).toBe('option');
    expect(document.activeElement?.textContent?.trim()).toBe('12:00');

    const half = options(fixture).find((option) => option.textContent?.trim() === '14:30');
    click(fixture, half as HTMLElement);

    expect(panel(fixture)).toBeNull();
    expect(hidden(fixture).value).toBe('2026-09-11T14:30:00');
  });

  it('carries focus to the calendar when a time leaves the value incomplete', async () => {
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN}></div>`);

    const half = options(fixture).find((option) => option.textContent?.trim() === '14:30');
    click(fixture, half as HTMLElement);
    await fixture.whenStable();

    expect(panel(fixture)).not.toBeNull();
    expect(hidden(fixture).value).toBe('');
    expect(half?.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement?.getAttribute('data-part')).toBe('day');

    click(fixture, dayCell(fixture, 11));

    expect(panel(fixture)).toBeNull();
    expect(hidden(fixture).value).toBe('2026-09-11T14:30:00');
  });

  /**
   * A value that was already whole is not completed by anything, so a reader
   * who opened a filled field to change both halves is not shut out by their
   * first press. Ant spends a confirm button on this and Kendo spends Set.
   */
  it('leaves the panel open when the value was already whole', () => {
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN} [defaultValue]="tenth"></div>`);
    click(fixture, dayCell(fixture, 11));
    expect(panel(fixture)).not.toBeNull();
  });

  it('closes on any press that changes the value when closeOnSelect is always', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} closeOnSelect="always" [defaultValue]="tenth"></div>`,
    );
    click(fixture, dayCell(fixture, 11));
    expect(panel(fixture)).toBeNull();
  });

  it('closes on nothing when closeOnSelect is never', () => {
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN} closeOnSelect="never"></div>`);
    click(fixture, dayCell(fixture, 11));
    expect(panel(fixture)).not.toBeNull();
  });
});

describe('the list', () => {
  it('offers one row per step, at the step the consumer set', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [step]="3600" [defaultValue]="tenth"></div>`,
    );
    expect(options(fixture)).toHaveLength(24);
  });

  /**
   * The list answers the day the reader is on rather than a day already
   * committed, so a closed day empties it while the reader is still deciding.
   */
  it('empties on a day whose window is closed', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} unavailableOptions="hide" [isTimeUnavailable]="closedDay"></div>`,
    );
    expect(options(fixture).length).toBeGreaterThan(0);

    click(fixture, dayCell(fixture, 12));
    expect(panel(fixture)?.querySelector('[data-part="empty"]')).not.toBeNull();
  });

  it('takes an explicit list of times in the consumer s own order', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [options]="irregular" [defaultValue]="tenth"></div>`,
    );
    expect(options(fixture).map((element) => element.textContent?.trim())).toEqual([
      '09:00',
      '09:20',
      '13:45',
    ]);
  });

  it('cuts the list at maxOptions and says so in the DOM', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [maxOptions]="4" [step]="900" [defaultValue]="tenth"></div>`,
    );
    expect(options(fixture)).toHaveLength(4);
    expect(list(fixture)?.dataset['truncated']).toBe('');
    expect(panel(fixture)?.getAttribute('aria-description')).toBeTruthy();
  });

  /**
   * Both pairs of bounds apply at once, and the first day of the range holds a
   * partial window — the rule MDN states for the platform and no surveyed
   * script implements.
   */
  it('opens the first day of the range where the range starts', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [step]="3600"
        [min]="{ date: { year: 2026, month: 9, day: 10 }, time: { hour: 14, minute: 0, second: 0 } }"
        [max]="{ date: { year: 2026, month: 9, day: 30 }, time: { hour: 11, minute: 0, second: 0 } }"
        [minTime]="{ hour: 9, minute: 0, second: 0 }"
        [maxTime]="{ hour: 18, minute: 0, second: 0 }"></div>`,
    );
    expect(options(fixture).map((element) => element.textContent?.trim())).toEqual([
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
    ]);
  });
});

describe('keyboard', () => {
  it('moves the highlight with the arrows and selects with Enter', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [step]="3600" [defaultValue]="tenth"></div>`,
    );

    key(fixture, list(fixture) as HTMLElement, 'ArrowDown');
    const current = options(fixture).find((element) => element.dataset['current'] === '');
    expect(current?.textContent?.trim()).toBe('16:00');

    key(fixture, list(fixture) as HTMLElement, 'Enter');
    expect(hidden(fixture).value).toBe('2026-09-10T16:00:00');
  });

  it('jumps an hour boundary on PageDown', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [step]="900" [defaultValue]="tenth"></div>`,
    );
    key(fixture, list(fixture) as HTMLElement, 'PageDown');
    const current = options(fixture).find((element) => element.dataset['current'] === '');
    expect(current?.textContent?.trim()).toBe('16:00');
  });

  it('takes Home and End to the two ends of the list', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [step]="3600" [defaultValue]="tenth"></div>`,
    );
    key(fixture, list(fixture) as HTMLElement, 'Home');
    expect(options(fixture)[0]?.dataset['current']).toBe('');
    key(fixture, list(fixture) as HTMLElement, 'End');
    expect(options(fixture).at(-1)?.dataset['current']).toBe('');
  });

  /**
   * The highlight moves and the value does not: the listbox pattern lists
   * selection-following-focus as optional and warns it can degrade
   * accessibility.
   */
  it('does not move the value as the highlight moves', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [step]="3600" [defaultValue]="tenth" (valueChange)="onValue($event)"></div>`,
    );
    const host = fixture.componentInstance as Host;
    key(fixture, list(fixture) as HTMLElement, 'ArrowDown');
    expect(host.onValue).not.toHaveBeenCalled();
  });

  /**
   * The chord both sibling pickers took, with the same recorded cost: ChromeOS
   * turns it into `PageDown` before the browser sees it.
   */
  it('opens on Alt+ArrowDown from the control', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" [referenceDateTime]="reference" [defaultValue]="tenth"></div>`,
    );
    const control = fixture.nativeElement.querySelector('[data-part="control"]') as HTMLElement;
    key(fixture, control, 'ArrowDown', { altKey: true });
    expect(panel(fixture)).not.toBeNull();
  });
});

describe('the contract with the consumer', () => {
  it('holds the value itself when nobody else does', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [step]="3600" [defaultValue]="tenth"></div>`,
    );
    click(fixture, options(fixture)[8] as HTMLElement);
    expect(hidden(fixture).value).toBe('2026-09-10T08:00:00');
  });

  it('owns the open state when the consumer states it', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" [open]="false" [defaultValue]="tenth" (openChange)="onOpen($event)"></div>`,
    );
    const host = fixture.componentInstance as Host;
    click(fixture, trigger(fixture));
    expect(host.onOpen).toHaveBeenCalled();
    expect(panel(fixture)).toBeNull();
  });

  /**
   * `referenceDateTime` answers where an empty field steps from and which time
   * a pressed day takes. It does not answer what time it is: a booking flow
   * whose reference is tomorrow at nine still means now when it says now.
   */
  it('writes the current datetime from the head, not the reference', () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 8, 30, 14, 5, 0));
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN} timeZone="UTC"></div>`);
    const now = panel(fixture)?.querySelector('[data-part="now"]') as HTMLButtonElement;
    click(fixture, now);
    expect(hidden(fixture).value).toBe('2026-09-30T14:05:00');
    expect(hidden(fixture).value).not.toBe(toISODateTime(REFERENCE));
    clock.mockRestore();
  });

  it('takes its defaults from a provider, and its words from the language in force', () => {
    const fixture = renderTemplate(`<div slDateTimePicker ${OPEN} [defaultValue]="tenth"></div>`, [
      provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } }),
      provideDateTimePickerDefaults({ step: 3600 }),
    ]);
    expect(panel(fixture)?.querySelector('[data-part="now"]')?.textContent?.trim()).toBe('Agora');
    expect(options(fixture)).toHaveLength(24);
  });

  it('lays its own messages over the catalog', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [messages]="{ now: 'Now' }" [defaultValue]="tenth"></div>`,
    );
    expect(panel(fixture)?.querySelector('[data-part="now"]')?.textContent?.trim()).toBe('Now');
  });

  it('takes the consumer s own slots', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [defaultValue]="tenth">
         <div slDateTimePickerPresets><button type="button">Tomorrow</button></div>
         <div slDateTimePickerFooter><button type="button">Apply</button></div>
       </div>`,
    );
    expect(panel(fixture)?.querySelector('[data-part="presets"]')).not.toBeNull();
    expect(panel(fixture)?.querySelector('[data-part="footer"]')).not.toBeNull();
  });

  it('draws one row the consumer s own way', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [step]="3600" [defaultValue]="tenth">
         <ng-template slDateTimePickerOption let-time let-label="label">
           <span data-test="row">{{ label }}</span>
         </ng-template>
       </div>`,
    );
    expect(fixture.nativeElement.querySelectorAll('[data-test="row"]')).toHaveLength(24);
  });

  it('refuses to open while it is not editable', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" disabled [defaultValue]="tenth"></div>`,
    );
    expect(root(fixture).dataset['disabled']).toBe('');
    expect(trigger(fixture).disabled).toBe(true);
  });

  it('names the chosen value on the trigger, because focus returns there', () => {
    const empty = renderTemplate(`<div slDateTimePicker locale="pt-BR"></div>`);
    expect(trigger(empty).getAttribute('aria-label')).toBe('Choose date and time');

    const chosen = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" [defaultValue]="tenth"></div>`,
    );
    expect(trigger(chosen).getAttribute('aria-label')).toContain('setembro');
  });

  it('changes its words and its moment together with the language in force', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<div slDateTimePicker aria-label="Quando" [defaultValue]="tenth"></div>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );

    expect(trigger(fixture).getAttribute('aria-label')).toMatch(/^Alterar data e hora, .*setembro/);

    locale.set('en-US');
    fixture.detectChanges();
    expect(trigger(fixture).getAttribute('aria-label')).toMatch(
      /^Change date and time, .*September/,
    );
  });

  it('reports a value the bounds refuse', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" [defaultValue]="tenth"
        [min]="{ date: { year: 2026, month: 9, day: 11 }, time: { hour: 9, minute: 0, second: 0 } }"></div>`,
    );
    expect(root(fixture).dataset['invalid']).toBe('');
  });
});

describe('where focus goes when it opens', () => {
  it('moves focus to the chosen day when the trigger opens it', async () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" [referenceDateTime]="reference" [defaultValue]="tenth"></div>`,
    );

    click(fixture, trigger(fixture));
    await fixture.whenStable();

    expect(document.activeElement?.getAttribute('data-part')).toBe('day');
    expect(document.activeElement?.textContent?.trim()).toBe('10');
  });

  it('moves focus to the chosen time when openTo is time', async () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" openTo="time" [referenceDateTime]="reference" [defaultValue]="tenth"></div>`,
    );

    click(fixture, trigger(fixture));
    await fixture.whenStable();

    expect(document.activeElement?.getAttribute('role')).toBe('option');
    expect(document.activeElement?.textContent?.trim()).toBe('15:15');
  });

  it('moves focus into the panel when openSurface() opens it', async () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker #picker="slDateTimePicker" locale="pt-BR" [referenceDateTime]="reference" [defaultValue]="tenth"></div>
       <button type="button" id="edit" (click)="picker.openSurface()">Edit</button>`,
    );

    click(fixture, fixture.nativeElement.querySelector('#edit') as HTMLElement);
    await fixture.whenStable();

    expect(document.activeElement?.getAttribute('data-part')).toBe('day');
  });

  /**
   * The contract's open reasons are pointer, keyboard, escape, outsidePress and
   * select; React's handle reports keyboard, and so does this one.
   */
  it('reports the handle’s open and close with a reason its contract lists', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" (openChange)="onOpen($event)"></div>`,
    );
    const picker = fixture.debugElement
      .query(By.directive(SlDateTimePicker))
      .injector.get(SlDateTimePicker);

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

  it('leaves focus in the field when Alt+ArrowDown opens it', async () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" [referenceDateTime]="reference" [defaultValue]="tenth"></div>`,
    );
    const segment = fixture.nativeElement.querySelector('[data-part="segment"]') as HTMLElement;
    segment.focus();

    key(fixture, segment, 'ArrowDown', { altKey: true });
    await fixture.whenStable();

    expect(document.activeElement).toBe(segment);
  });

  it('keeps Tab inside the panel while it is open', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker ${OPEN} [defaultValue]="tenth">
         <div slDateTimePickerPresets><button type="button" id="first">Tomorrow</button></div>
         <div slDateTimePickerFooter><button type="button" id="last">Apply</button></div>
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

describe('the inputs it passes on', () => {
  it('marks the field invalid when the picker is', () => {
    const fixture = renderTemplate(`<div slDateTimePicker invalid locale="pt-BR"></div>`);
    const field = fixture.nativeElement.querySelector('[data-ui="datetime-field"]') as HTMLElement;
    expect(field.hasAttribute('data-invalid')).toBe(true);
  });
});

describe('in an Angular form', () => {
  it('takes the value the form writes and empties on reset', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" name="quando" [formControl]="control"></div>`,
    );
    fixture.componentInstance.control.setValue(TENTH);
    fixture.detectChanges();
    expect(hidden(fixture).value).toBe('2026-09-10T15:20:00');

    fixture.componentInstance.control.reset();
    fixture.detectChanges();
    expect(hidden(fixture).value).toBe('');
  });

  it('returns to its default value when its form is reset', () => {
    const fixture = renderTemplate(
      `<form>
         <div slDateTimePicker defaultOpen locale="pt-BR" name="quando" [step]="3600" [referenceDateTime]="reference" [defaultValue]="tenth" (valueChange)="onValue($event)"></div>
       </form>`,
    );

    click(fixture, options(fixture)[8] as HTMLElement);
    expect(hidden(fixture).value).toBe('2026-09-10T08:00:00');

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).reset();
    fixture.detectChanges();

    expect(hidden(fixture).value).toBe('2026-09-10T15:20:00');
    expect(fixture.componentInstance.onValue).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: TENTH, reason: 'programmatic' }),
    );
  });

  it('reports the time chosen in the list to the form', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" [step]="3600" [referenceDateTime]="reference" [formControl]="control"></div>`,
    );
    fixture.componentInstance.control.setValue(TENTH);
    fixture.detectChanges();
    click(fixture, trigger(fixture));
    click(fixture, options(fixture)[8] as HTMLElement);
    expect(fixture.componentInstance.control.value).toEqual(
      plainDateTime(plainDate(2026, 9, 10), plainTime(8, 0)),
    );
  });

  it('takes the trigger out when the form disables it', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" [formControl]="control"></div>`,
    );
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(trigger(fixture).disabled).toBe(true);
    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
  });

  /**
   * A day typed without a time keeps the value null, so the picker's own
   * value never moves; the field's validity does, and the form is told.
   */
  it('reports a half-typed value as incomplete', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" [formControl]="control"></div>`,
    );
    let target = fixture.nativeElement.querySelector('[data-part="segment"]') as HTMLElement;
    target.focus();
    for (const digit of '10092026') {
      target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: digit }));
      fixture.detectChanges();
      const focused = document.activeElement as HTMLElement | null;
      if (focused?.dataset['part'] === 'segment') target = focused;
    }
    target.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
    fixture.detectChanges();

    expect(fixture.componentInstance.control.value).toBeNull();
    expect(fixture.componentInstance.control.errors?.['slottedDateTimeIncomplete']).toEqual({
      missing: 'time',
    });
  });

  it('reports a value outside the bounds as a form error', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" [min]="reference" [formControl]="control"></div>`,
    );
    fixture.componentInstance.control.setValue(
      plainDateTime(plainDate(2026, 1, 1), plainTime(9, 0)),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.control.errors?.['slottedDateTimeRange']).toBeDefined();
  });
});
