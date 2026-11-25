import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import { SlClockSlot } from '@slotted/angular/clock';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/datetime-picker/contract.json';
import { SlDateTimePicker } from './datetime-picker';
import { provideDateTimePickerDefaults } from './datetime-picker-defaults';
import { SlDateTimePickerFooter } from './datetime-picker-parts';

const at = (day: number, hour: number, minute = 0) =>
  plainDateTime(plainDate(2026, 9, day), plainTime(hour, minute));

const TENTH = plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20));
/** Stated rather than read from the clock, so every assertion below is fixed. */
const REFERENCE = plainDateTime(plainDate(2026, 9, 10), plainTime(12, 0));

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SlDateTimePicker, SlDateTimePickerFooter, SlClockSlot],
  template: `<div slDateTimePicker></div>`,
})
class Host {
  readonly value = signal<PlainDateTime | null | undefined>(undefined);
  readonly control = new FormControl<PlainDateTime | null>(null);
  readonly tenth = TENTH;
  readonly eleventh = at(11, 9);
  readonly twelfth = at(12, 9);
  readonly reference = REFERENCE;
  readonly irregular = [plainTime(9, 0), plainTime(9, 20), plainTime(13, 45)];
  readonly closed = (date: PlainDate) => date.day === 12;
  readonly onValue = vi.fn();
  readonly onOpen = vi.fn();
  readonly onlyMorning = ({ hour }: PlainTime, date: PlainDate) => date.day === 12 && hour > 8;
  readonly presets = [{ label: 'Monday early', value: () => at(14, 9) }];
  readonly noon = at(10, 12);
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
const options = (fixture: Fixture, name: string) =>
  [
    ...fixture.nativeElement.querySelectorAll(
      `[role="listbox"][aria-label="${name}"] [role="option"]`,
    ),
  ] as HTMLElement[];
const part = (fixture: Fixture, name: string) =>
  fixture.nativeElement.querySelector(`[data-part="${name}"]`) as HTMLElement;
const text = (fixture: Fixture, name: string) => part(fixture, name)?.textContent?.trim();
const hidden = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="hidden-input"]') as HTMLInputElement;
const dayCell = (fixture: Fixture, day: number) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="day"]')].find(
    (element: Element) =>
      element.textContent?.trim() === String(day) &&
      element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') === false,
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

describe('anatomy', () => {
  /**
   * The family composes the field and the grid and redraws neither. A second
   * segmented control or a second month grid would be two places to fix one
   * defect.
   */
  /** The role the APG's own Date Picker Combobox example gives its popup. */
  /**
   * A `tablist` that exists on a narrow container and not on a wide one tells
   * assistive technology two different stories about the same component.
   */
  /** The two marks are `Glyph` elements inside an `Icon` box, never masks. */
});

describe('focus follows the missing half', () => {
  /**
   * The decision this family owes, in one sentence: the press that leaves the
   * value incomplete carries focus to the half that is missing, and the press
   * that completes the value closes the panel.
   */
  /**
   * A value that was already whole is not completed by anything, so a reader
   * who opened a filled field to change both halves is not shut out by their
   * first press. Ant spends a confirm button on this and Kendo spends Set.
   */
});

describe('the list', () => {
  /**
   * The list answers the day the reader is on rather than a day already
   * committed, so a closed day empties it while the reader is still deciding.
   */
  /**
   * Both pairs of bounds apply at once, and the first day of the range holds a
   * partial window — the rule MDN states for the platform and no surveyed
   * script implements.
   */
});

describe('keyboard', () => {
  /**
   * The highlight moves and the value does not: the listbox pattern lists
   * selection-following-focus as optional and warns it can degrade
   * accessibility.
   */
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
  it('owns the open state when the consumer states it', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" [open]="false" [defaultValue]="tenth" (openChange)="onOpen($event)"></div>`,
    );
    const host = fixture.componentInstance as Host;
    click(fixture, trigger(fixture));
    expect(host.onOpen).toHaveBeenCalled();
    expect(panel(fixture)).toBeNull();
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

    click(fixture, options(fixture, 'Hours')[8] as HTMLElement);
    click(fixture, part(fixture, 'apply'));
    expect(hidden(fixture).value).toBe('2026-09-10T08:00:00');

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).reset();
    fixture.detectChanges();

    expect(hidden(fixture).value).toBe('2026-09-10T15:20:00');
    expect(fixture.componentInstance.onValue).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: TENTH, reason: 'programmatic' }),
    );
  });

  it('reports the time applied in the panel to the form', () => {
    const fixture = renderTemplate(
      `<div slDateTimePicker locale="pt-BR" [step]="3600" [referenceDateTime]="reference" [formControl]="control"></div>`,
    );
    fixture.componentInstance.control.setValue(TENTH);
    fixture.detectChanges();
    click(fixture, trigger(fixture));
    click(fixture, options(fixture, 'Hours')[8] as HTMLElement);
    click(fixture, part(fixture, 'apply'));
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

describe('the panel', () => {
  it('declares every part the contract names, and is the shared one', () => {
    const fixture = renderTemplate(picker('defaultOpen'));

    for (const name of contract.members.dateTimePicker.parts) {
      expect(part(fixture, name), name).not.toBeNull();
    }
    expect(fixture.nativeElement.querySelector('[data-kind="datetime"]')).not.toBeNull();
    expect(options(fixture, 'Hours')).toHaveLength(24);
  });

  it('writes the day in words, and how far the moment is', () => {
    const fixture = renderTemplate(picker('defaultOpen [defaultValue]="tenth"'));

    expect(text(fixture, 'value')).toBe('Thu, September 10');
    expect(text(fixture, 'meta')).toBe('today, week 37');
    expect(text(fixture, 'time-meta')).toBe('in 3 hr 20 min');
  });

  it('draws the shortcuts with what they write, after Now', () => {
    const fixture = renderTemplate(picker('defaultOpen [presets]="presets"'));
    const results = [...fixture.nativeElement.querySelectorAll('[data-part="preset-result"]')];

    expect(results.map((result: Element) => result.textContent)).toEqual([
      'Sep 10, 12:00 PM',
      'Sep 14, 9:00 AM',
    ]);
  });

  it('draws whole times from a stated list, the consumer’s own way', () => {
    const fixture = renderTemplate(
      picker(
        'defaultOpen [defaultValue]="tenth" [options]="irregular"',
        '<ng-template slClockSlot let-date="date" let-state="state">{{ state.label }} on the {{ date?.day }}th</ng-template>',
      ),
    );

    expect(options(fixture, 'Times').map((slot) => slot.textContent?.trim())).toEqual([
      '09:00 AM on the 10th',
      '09:20 AM on the 10th',
      '01:45 PM on the 10th',
    ]);
    expect(part(fixture, 'offsets')).toBeNull();
  });

  it('takes its shape from a provider, and its own footer', () => {
    const fixture = renderTemplate(
      picker('defaultOpen', '<span slDateTimePickerFooter>Doors close at 6</span>'),
      [provideDateTimePickerDefaults({ confirm: false, step: 3600 })],
    );

    expect(options(fixture, 'Minutes')).toHaveLength(0);
    expect(part(fixture, 'apply')).toBeNull();
    expect(text(fixture, 'hint')).toBe('Doors close at 6');
  });
});

describe('the draft', () => {
  it('takes a day, then a time, and Apply writes both', async () => {
    const fixture = renderTemplate(picker('defaultOpen'));

    click(fixture, dayCell(fixture, 18));
    expect((part(fixture, 'apply') as HTMLButtonElement).disabled).toBe(true);
    await fixture.whenStable();
    expect(options(fixture, 'Hours')).toContain(document.activeElement);

    click(fixture, options(fixture, 'Hours')[9]!);
    expect(fixture.componentInstance.onValue).not.toHaveBeenCalled();

    click(fixture, part(fixture, 'apply'));
    expect(written(fixture)).toEqual([at(18, 9)]);
    expect(panel(fixture)).toBeNull();
  });

  it('moves one day, over the days the rules refuse', () => {
    const fixture = renderTemplate(
      picker('defaultOpen [defaultValue]="eleventh" [isDateUnavailable]="closed"'),
    );

    click(
      fixture,
      fixture.nativeElement.querySelector('[data-part="step"][data-direction="next"]'),
    );
    expect(text(fixture, 'value')).toBe('Sun, September 13');
  });

  it('takes a step from now and a shortcut', () => {
    const fixture = renderTemplate(picker('defaultOpen [presets]="presets"'));
    const [, , day] = [...fixture.nativeElement.querySelectorAll('[data-part="chip"]')];

    click(fixture, day as HTMLElement);
    click(fixture, part(fixture, 'apply'));
    click(fixture, trigger(fixture));
    click(
      fixture,
      fixture.nativeElement.querySelectorAll('[data-part="preset"]')[1] as HTMLElement,
    );
    key(fixture, panel(fixture)!, 'Enter', { ctrlKey: true });
    expect(written(fixture)).toEqual([at(11, 12), at(14, 9)]);
  });

  it('is abandoned when the panel closes, and emptied by Clear', () => {
    const fixture = renderTemplate(picker('defaultOpen [defaultValue]="tenth"'));

    click(fixture, dayCell(fixture, 18));
    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    fixture.detectChanges();
    click(fixture, trigger(fixture));
    expect(text(fixture, 'value')).toBe('Thu, September 10');

    click(fixture, fixture.nativeElement.querySelector('[data-part="footer"] [data-part="clear"]'));
    click(fixture, part(fixture, 'apply'));
    expect(written(fixture)).toEqual([null]);
  });

  it('is written as it goes, without a confirmation', () => {
    const fixture = renderTemplate(picker('confirm="false" defaultOpen [defaultValue]="tenth"'));

    click(fixture, dayCell(fixture, 18));
    expect(written(fixture)).toEqual([at(18, 15, 20)]);
    expect(panel(fixture)).not.toBeNull();

    const hour = fixture.nativeElement.querySelector(
      '[data-part="time-value"] [role="spinbutton"]',
    ) as HTMLElement;
    key(fixture, hour, 'ArrowUp');
    expect(written(fixture).at(-1)).toEqual(at(18, 16, 20));

    click(fixture, options(fixture, 'Minutes')[0]!);
    expect(written(fixture).at(-1)).toEqual(at(18, 16));
    expect(panel(fixture)).toBeNull();
  });
});

describe('the rules of a moment', () => {
  it('bound the clock on the day the range starts', () => {
    const fixture = renderTemplate(
      picker('defaultOpen [defaultValue]="tenth" [min]="noon" [step]="3600"'),
    );
    expect(offered(fixture)[0]).toBe(12);

    click(fixture, dayCell(fixture, 11));
    expect(offered(fixture)[0]).toBe(0);
  });

  it('refuse every time of a refused day, and say so', () => {
    const fixture = renderTemplate(
      picker('defaultOpen [defaultValue]="twelfth" [isDateUnavailable]="closed"'),
    );

    expect(offered(fixture)).toEqual([]);
    expect(text(fixture, 'hint')).toBe('Not an accepted date and time');
  });

  it('ask about a time of a day', () => {
    const fixture = renderTemplate(
      picker('defaultOpen [defaultValue]="twelfth" [isTimeUnavailable]="onlyMorning"'),
    );

    expect(offered(fixture)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('one part at a time', () => {
  it('shows the time after a day, and each head brings its own', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      addEventListener: () => undefined,
      matches: query.includes('760px'),
      removeEventListener: () => undefined,
    }));
    const fixture = renderTemplate(picker('defaultOpen'));
    expect(showing(fixture)).toBe('day');

    click(fixture, dayCell(fixture, 18));
    expect(showing(fixture)).toBe('time');

    click(fixture, part(fixture, 'value'));
    expect(showing(fixture)).toBe('day');
    expect(part(fixture, 'time-label').getAttribute('aria-expanded')).toBe('false');
    vi.unstubAllGlobals();
  });
});

function picker(attributes: string, content = '') {
  return `<div slDateTimePicker locale="en-US" [referenceDateTime]="reference" ${attributes} (valueChange)="onValue($event)">${content}</div>`;
}

function written(fixture: Fixture) {
  return fixture.componentInstance.onValue.mock.calls.map(([request]) => request.value);
}

function showing(fixture: Fixture) {
  return fixture.nativeElement.querySelector('[data-kind]').getAttribute('data-showing');
}

/** The hours the clock accepts. */
function offered(fixture: Fixture) {
  return options(fixture, 'Hours').flatMap((hour, index) =>
    hour.getAttribute('aria-disabled') === 'true' ? [] : [index],
  );
}
