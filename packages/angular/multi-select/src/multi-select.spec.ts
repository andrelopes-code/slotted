import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SlMultiSelect } from './multi-select';
import { SlMultiSelectItem } from './multi-select-items';
import { provideMultiSelectDefaults } from './multi-select-defaults';
import type { MultiSelectOpenOn, MultiSelectRefuseCause } from './multi-select-defaults';

@Component({
  standalone: true,
  imports: [SlMultiSelect, SlMultiSelectItem],
  template: `
    <sl-multi-select
      aria-label="Fruit"
      [portal]="false"
      [defaultValue]="defaultValue()"
      [creatable]="creatable()"
      [editable]="editable()"
      [reorderable]="reorderable()"
      [allowDuplicates]="allowDuplicates()"
      [max]="max()"
      [name]="name()"
      (valueChange)="value.set($event)"
      (valueChangeRequest)="reason.set($event.reason)"
      (valueRefuse)="refused.set($event)"
    >
      <sl-multi-select-item value="blueberry" label="Blueberry" />
      <sl-multi-select-item value="raspberry" label="Raspberry" />
      <sl-multi-select-item value="cloudberry" label="Cloudberry" disabled />
    </sl-multi-select>
  `,
})
class Host {
  readonly defaultValue = signal<readonly string[] | undefined>(undefined);
  readonly creatable = signal(false);
  readonly editable = signal(false);
  readonly reorderable = signal(false);
  readonly allowDuplicates = signal(false);
  readonly max = signal<number | undefined>(undefined);
  readonly name = signal<string | undefined>(undefined);
  readonly value = signal<readonly string[] | undefined>(undefined);
  readonly reason = signal<string | undefined>(undefined);
  readonly refused = signal<{ values: readonly string[]; cause: MultiSelectRefuseCause } | null>(
    null,
  );
}

const field = () => document.querySelector<HTMLInputElement>("[data-part='input']")!;
const grid = () => document.querySelector<HTMLElement>("[data-part='control']")!;
const root = () =>
  document.querySelector<HTMLElement>("[data-ui='multi-select'][data-part='root']")!;
const chips = () =>
  [
    ...document.querySelectorAll<HTMLElement>(
      "[data-part='chips'] > [role='gridcell']:not([data-part='field'])",
    ),
  ].filter((chip) => chip.hasAttribute('data-value'));
const chipValues = () => chips().map((chip) => chip.dataset['value']);
const optionFor = (value: string) =>
  document.querySelector<HTMLElement>(`[data-part='item'][data-value='${value}']`)!;

const press = (target: Element, key: string, modifiers: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...modifiers }));

const type = (fixture: ComponentFixture<unknown>, text: string) => {
  field().value = text;
  field().dispatchEvent(new Event('input'));
  fixture.detectChanges();
};

const settle = async (fixture: ComponentFixture<unknown>) => {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
};

const open = async (fixture: ComponentFixture<unknown>) => {
  field().focus();
  press(field(), 'ArrowDown');
  await settle(fixture);
};

describe('SlMultiSelect', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
  });

  it('is a combobox controlling a multi-selectable listbox, inside a layout grid', async () => {
    fixture.detectChanges();
    expect(field().getAttribute('role')).toBe('combobox');
    expect(field().getAttribute('aria-autocomplete')).toBe('list');
    expect(grid().getAttribute('role')).toBe('grid');
    expect(document.querySelector("[data-part='chips']")?.getAttribute('role')).toBe('row');

    await open(fixture);
    const listbox = document.querySelector("[data-part='content']")!;
    expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
    expect(field().getAttribute('aria-controls')).toBe(listbox.id);
  });

  /**
   * The highlight is brought into view by scrolling the list alone. A
   * `scrollIntoView` scrolls every ancestor as well, and on the first open it
   * runs before the popup is positioned — so a control far down a page sent the
   * page to its top, and the popup, its control now out of view, hid itself.
   */
  it('scrolls the list to the highlight, and never the page', async () => {
    const original = Element.prototype.scrollIntoView;
    let calls = 0;
    Element.prototype.scrollIntoView = () => {
      calls += 1;
    };
    try {
      await open(fixture);
      const surface = document.querySelector<HTMLElement>("[data-part='content']")!;
      Object.defineProperty(surface, 'clientHeight', { configurable: true, value: 100 });
      Object.defineProperty(surface, 'scrollTop', { configurable: true, writable: true, value: 0 });
      surface.getBoundingClientRect = () =>
        DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 100 });
      optionFor('raspberry').getBoundingClientRect = () =>
        DOMRect.fromRect({ x: 0, y: 130, width: 200, height: 30 });
      for (let step = 0; step < 3; step += 1) {
        if (field().getAttribute('aria-activedescendant') === optionFor('raspberry').id) break;
        press(field(), 'ArrowDown');
        await settle(fixture);
      }
      expect(field().getAttribute('aria-activedescendant')).toBe(optionFor('raspberry').id);
      expect(calls).toBe(0);
      expect(surface.scrollTop).toBe(60);
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  /**
   * Opened from the end, the highlight lands on the last option before the
   * popup has a position, so the list has not yet taken the height that bounds
   * it. Revealed only then, the option stayed below the fold.
   */
  it('shows the highlighted option once the popup has taken its height', async () => {
    const bounded = (element: Element) =>
      element
        .closest<HTMLElement>("[data-part='positioner']")
        ?.style.getPropertyValue('--slotted-positioner-available-height') !== '';
    const rect = Element.prototype.getBoundingClientRect;
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
    const top = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
    const scrolled = new Map<Element, number>();
    Element.prototype.getBoundingClientRect = function (this: Element) {
      if (this.getAttribute('role') === 'listbox') {
        return DOMRect.fromRect({ x: 0, y: 0, width: 200, height: bounded(this) ? 100 : 400 });
      }
      if (this.getAttribute('data-value') === 'raspberry') {
        return DOMRect.fromRect({ x: 0, y: 130, width: 200, height: 30 });
      }
      return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
    };
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get(this: HTMLElement) {
        if (this.getAttribute('role') !== 'listbox') return 0;
        return bounded(this) ? 100 : 400;
      },
    });
    Object.defineProperty(Element.prototype, 'scrollTop', {
      configurable: true,
      get(this: Element) {
        return scrolled.get(this) ?? 0;
      },
      set(this: Element, next: number) {
        scrolled.set(this, next);
      },
    });
    try {
      fixture.detectChanges();
      field().focus();
      press(field(), 'ArrowUp');
      await settle(fixture);
      const surface = document.querySelector<HTMLElement>("[data-part='content']")!;
      for (let attempt = 0; attempt < 20 && surface.scrollTop !== 60; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(field().getAttribute('aria-activedescendant')).toBe(optionFor('raspberry').id);
      expect(surface.scrollTop).toBe(60);
    } finally {
      Element.prototype.getBoundingClientRect = rect;
      if (height) Object.defineProperty(HTMLElement.prototype, 'clientHeight', height);
      if (top) Object.defineProperty(Element.prototype, 'scrollTop', top);
    }
  });

  it('is one tab stop, whatever the row holds', async () => {
    fixture.componentInstance.defaultValue.set(['blueberry', 'raspberry']);
    await settle(fixture);
    expect(field().hasAttribute('tabindex')).toBe(false);
    for (const chip of chips()) expect(chip.getAttribute('tabindex')).toBe('-1');
    expect(document.querySelector("[data-part='trigger']")?.getAttribute('tabindex')).toBe('-1');
  });

  it('adds and removes a value from the popup, and keeps the popup open', async () => {
    await open(fixture);
    optionFor('blueberry').click();
    await settle(fixture);
    expect(chipValues()).toEqual(['blueberry']);
    expect(document.querySelector("[data-part='content']")).not.toBeNull();

    optionFor('raspberry').click();
    await settle(fixture);
    expect(chipValues()).toEqual(['blueberry', 'raspberry']);

    optionFor('blueberry').click();
    await settle(fixture);
    expect(chipValues()).toEqual(['raspberry']);
  });

  /**
   * §6's rule: `Backspace` removes only from an empty field, and the
   * predictable half is two presses — one to see what is about to go and one to
   * let it go.
   */
  it('removes with Backspace only from an empty field, and only on the second press', async () => {
    fixture.componentInstance.defaultValue.set(['blueberry', 'raspberry']);
    await settle(fixture);
    field().focus();

    type(fixture, 'be');
    press(field(), 'Backspace');
    await settle(fixture);
    expect(chipValues()).toEqual(['blueberry', 'raspberry']);

    type(fixture, '');
    press(field(), 'Backspace');
    await settle(fixture);
    expect(chipValues()).toEqual(['blueberry', 'raspberry']);
    expect(document.activeElement).toBe(chips()[1]);

    press(chips()[1]!, 'Backspace');
    await settle(fixture);
    expect(chipValues()).toEqual(['blueberry']);
  });

  it('takes a value out from the chip that holds it', async () => {
    fixture.componentInstance.defaultValue.set(['blueberry', 'raspberry']);
    await settle(fixture);
    press(chips()[0]!, 'Delete');
    await settle(fixture);
    expect(chipValues()).toEqual(['raspberry']);
    expect(fixture.componentInstance.reason()).toBe('remove');
  });

  it('commits the typed text on a delimiter, and only where creation is allowed', async () => {
    fixture.detectChanges();
    field().focus();
    type(fixture, 'fig');
    press(field(), ',');
    await settle(fixture);
    expect(chipValues()).toEqual([]);

    fixture.componentInstance.creatable.set(true);
    await settle(fixture);
    type(fixture, 'fig');
    press(field(), ',');
    await settle(fixture);
    expect(chipValues()).toEqual(['fig']);
    expect(field().value).toBe('');
    expect(fixture.componentInstance.reason()).toBe('submit');
  });

  /**
   * Every icon the family owns is a `Glyph` element inside an `Icon` box, never
   * a mask, and the offer to add takes the plus where a chosen option takes the
   * check.
   */
  it('draws the chevron, the cross, the tick and the plus as glyph elements', async () => {
    fixture.componentInstance.creatable.set(true);
    fixture.componentInstance.defaultValue.set(['blueberry']);
    await settle(fixture);
    const glyph = (part: string) =>
      document.querySelector(`[data-part='${part}'] > [data-ui='icon'] > svg[data-glyph]`);
    expect(glyph('arrow')?.getAttribute('data-glyph')).toBe('chevron-down');
    expect(glyph('clear')?.getAttribute('data-glyph')).toBe('x');
    expect(glyph('remove')?.getAttribute('data-glyph')).toBe('x');

    await open(fixture);
    const mark = (option: Element | null) =>
      option?.querySelector("[data-part='indicator'] > [data-ui='icon'] > svg");
    expect(mark(optionFor('blueberry'))?.getAttribute('data-glyph')).toBe('check');

    type(fixture, 'Quince');
    await settle(fixture);
    const offer = document.querySelector("[data-part='item'][data-create]");
    expect(mark(offer)?.getAttribute('data-glyph')).toBe('plus');
  });

  it('takes up to the limit and reports the rest rather than dropping it', async () => {
    fixture.componentInstance.creatable.set(true);
    fixture.componentInstance.max.set(2);
    await settle(fixture);
    field().focus();

    const paste = new Event('paste') as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', {
      value: { getData: () => 'fig,plum,pear,lime' },
    });
    field().dispatchEvent(paste);
    await settle(fixture);

    expect(chipValues()).toEqual(['fig', 'plum']);
    expect(fixture.componentInstance.refused()).toEqual({
      values: ['pear', 'lime'],
      cause: 'limit',
    });
  });

  it('says a full control with the word the vocabulary already had', async () => {
    fixture.componentInstance.defaultValue.set(['blueberry', 'raspberry']);
    fixture.componentInstance.max.set(2);
    await settle(fixture);

    expect(root().hasAttribute('data-complete')).toBe(true);
    expect(document.querySelector("[data-part='counter']")?.textContent?.trim()).toBe('2 of 2');

    await open(fixture);
    expect(optionFor('cloudberry').getAttribute('aria-disabled')).toBe('true');
    /* A value already held stays takeable: taking it out is what a full control
       still has to allow. */
    expect(optionFor('blueberry').getAttribute('aria-disabled')).toBeNull();
  });

  it('refuses a duplicate, reports it, and puts focus on the chip that holds it', async () => {
    fixture.componentInstance.creatable.set(true);
    fixture.componentInstance.defaultValue.set(['fig']);
    await settle(fixture);
    field().focus();
    type(fixture, 'FIG');
    press(field(), ',');
    await settle(fixture);

    expect(chipValues()).toEqual(['fig']);
    expect(fixture.componentInstance.refused()).toEqual({ values: ['FIG'], cause: 'duplicate' });
    expect(document.activeElement).toBe(chips()[0]);
  });

  it('lets a duplicate in when the consumer allows one', async () => {
    fixture.componentInstance.allowDuplicates.set(true);
    fixture.componentInstance.creatable.set(true);
    fixture.componentInstance.defaultValue.set(['fig']);
    await settle(fixture);
    field().focus();
    type(fixture, 'fig');
    press(field(), ',');
    await settle(fixture);
    expect(chipValues()).toEqual(['fig', 'fig']);
  });

  /** Reorder emits `keyboard` and nothing else. */
  it('moves a value with Alt and an arrow, under the one reason reorder emits', async () => {
    fixture.componentInstance.defaultValue.set(['blueberry', 'raspberry', 'cloudberry']);
    fixture.componentInstance.reorderable.set(true);
    await settle(fixture);

    press(chips()[0]!, 'ArrowRight', { altKey: true });
    await settle(fixture);
    expect(chipValues()).toEqual(['raspberry', 'blueberry', 'cloudberry']);
    expect(fixture.componentInstance.reason()).toBe('keyboard');

    press(chips()[1]!, 'End', { altKey: true });
    await settle(fixture);
    expect(chipValues()).toEqual(['raspberry', 'cloudberry', 'blueberry']);
  });

  it('does not move a value where reorder was not asked for', async () => {
    fixture.componentInstance.defaultValue.set(['blueberry', 'raspberry']);
    await settle(fixture);
    press(chips()[0]!, 'ArrowRight', { altKey: true });
    await settle(fixture);
    expect(chipValues()).toEqual(['blueberry', 'raspberry']);
  });

  it('edits a chip in place, and commits it as one value', async () => {
    fixture.componentInstance.creatable.set(true);
    fixture.componentInstance.editable.set(true);
    fixture.componentInstance.defaultValue.set(['fig']);
    await settle(fixture);

    press(chips()[0]!, 'Enter');
    await settle(fixture);
    const editor = document.querySelector<HTMLInputElement>(
      "[data-part='chips'] input:not([data-part='input'])",
    )!;
    editor.value = 'figs';
    editor.dispatchEvent(new Event('input'));
    press(editor, 'Enter');
    await settle(fixture);

    expect(chipValues()).toEqual(['figs']);
  });

  it('clears the whole set at once, and says so', async () => {
    fixture.componentInstance.defaultValue.set(['blueberry', 'raspberry']);
    await settle(fixture);
    document.querySelector<HTMLButtonElement>("[data-part='clear']")!.click();
    await settle(fixture);
    expect(chipValues()).toEqual([]);
    expect(fixture.componentInstance.reason()).toBe('clear');
  });

  it('submits several values under one name', async () => {
    fixture.componentInstance.defaultValue.set(['blueberry', 'raspberry']);
    fixture.componentInstance.name.set('fruit');
    await settle(fixture);
    const hidden = [...document.querySelectorAll<HTMLInputElement>('input[name="fruit"]')];
    expect(hidden.map((element) => element.value)).toEqual(['blueberry', 'raspberry']);
  });

  /**
   * The asymmetry the design records rather than levels away: Angular gets a
   * `Validator` React has no equivalent of, so a Reactive Form sees `tooMany`
   * without the consumer writing it.
   */
  it('reports the validities a native input cannot describe', async () => {
    fixture.componentInstance.max.set(1);
    await settle(fixture);
    const instance = fixture.debugElement.children[0]!.componentInstance as SlMultiSelect;

    expect(instance.validate()).toBeNull();
    instance.value.set(['a', 'b']);
    expect(instance.validate()).toEqual({ tooMany: { max: 1, actual: 2 } });
    instance.value.set(['a', 'a']);
    fixture.componentInstance.max.set(undefined);
    await settle(fixture);
    expect(instance.validate()).toEqual({ duplicate: true });
  });
});

@Component({
  standalone: true,
  imports: [SlMultiSelect, SlMultiSelectItem],
  template: `
    <sl-multi-select
      aria-label="Fruit"
      [portal]="false"
      [openOn]="openOn()"
      [readOnly]="readOnly()"
      (openChangeRequest)="requests.push($event)"
    >
      <sl-multi-select-item value="blueberry" label="Blueberry" />
      <sl-multi-select-item value="raspberry" label="Raspberry" />
    </sl-multi-select>
  `,
})
class OpeningHost {
  readonly openOn = signal<MultiSelectOpenOn | undefined>('input');
  readonly readOnly = signal(false);
  readonly requests: ChangeRequest<boolean>[] = [];
}

/**
 * The contract's `opening`: `input` opens on typing and on a press, `focus` on
 * every focus, `manual` only on the trigger and the arrows. A press on the
 * input opens a closed popup and never closes an open one.
 */
describe('SlMultiSelect, opening', () => {
  let fixture: ComponentFixture<OpeningHost>;

  const create = async (providers: unknown[] = []) => {
    await TestBed.configureTestingModule({
      imports: [OpeningHost],
      providers: providers as never[],
    }).compileComponents();
    fixture = TestBed.createComponent(OpeningHost);
  };

  const expanded = () => field().getAttribute('aria-expanded');
  const focusField = () => {
    field().focus();
    fixture.detectChanges();
  };
  const pressField = () => {
    field().click();
    fixture.detectChanges();
  };

  it('opens a closed popup on a press on the input, once, with reason pointer', async () => {
    await create();
    fixture.detectChanges();
    focusField();
    pressField();
    expect(expanded()).toBe('true');
    expect(fixture.componentInstance.requests).toHaveLength(1);
    expect(fixture.componentInstance.requests[0]).toMatchObject({ value: true, reason: 'pointer' });
  });

  it('keeps an open popup open on a press on the input', async () => {
    await create();
    fixture.detectChanges();
    focusField();
    pressField();
    pressField();
    expect(expanded()).toBe('true');
    expect(fixture.componentInstance.requests).toHaveLength(1);
  });

  it('opens nothing on a Tab into the input under input', async () => {
    await create();
    fixture.detectChanges();
    focusField();
    expect(expanded()).toBe('false');
    expect(fixture.componentInstance.requests).toHaveLength(0);
  });

  it('opens on typing under input', async () => {
    await create();
    fixture.detectChanges();
    focusField();
    type(fixture, 'be');
    expect(expanded()).toBe('true');
  });

  it('opens only on the trigger and the arrows under manual', async () => {
    await create();
    fixture.componentInstance.openOn.set('manual');
    fixture.detectChanges();
    focusField();
    type(fixture, 'be');
    expect(expanded()).toBe('false');
    pressField();
    expect(expanded()).toBe('false');
    expect(fixture.componentInstance.requests).toHaveLength(0);
    press(field(), 'ArrowDown');
    fixture.detectChanges();
    expect(expanded()).toBe('true');
  });

  it('opens on focus under focus, and a press that focuses opens it once', async () => {
    await create();
    fixture.componentInstance.openOn.set('focus');
    fixture.detectChanges();
    focusField();
    pressField();
    expect(expanded()).toBe('true');
    expect(fixture.componentInstance.requests).toHaveLength(1);
  });

  it('opens nothing on a press on a read-only control', async () => {
    await create();
    fixture.componentInstance.readOnly.set(true);
    fixture.detectChanges();
    focusField();
    pressField();
    expect(expanded()).toBe('false');
    expect(fixture.componentInstance.requests).toHaveLength(0);
  });

  it('stays closed when a listener before it prevents the click', async () => {
    await create();
    fixture.detectChanges();
    fixture.nativeElement.addEventListener('click', (event: Event) => event.preventDefault(), {
      capture: true,
    });
    focusField();
    pressField();
    expect(expanded()).toBe('false');
    expect(fixture.componentInstance.requests).toHaveLength(0);
  });

  it('takes openOn from the defaults provider', async () => {
    await create([provideMultiSelectDefaults({ openOn: 'focus' })]);
    fixture.componentInstance.openOn.set(undefined);
    fixture.detectChanges();
    focusField();
    expect(expanded()).toBe('true');
  });
});

@Component({
  standalone: true,
  imports: [SlMultiSelect, SlMultiSelectItem],
  template: `
    <sl-multi-select aria-label="Fruit" [portal]="false">
      <sl-multi-select-item value="blueberry" label="Blueberry" icon="dot" />
      <sl-multi-select-item value="raspberry" label="Raspberry" />
    </sl-multi-select>
  `,
})
class IconHost {}

/** The first column holds the glyph the icon input names; no stylesheet fills it. */
describe('SlMultiSelect, the icon column', () => {
  it('draws the named glyph in the first column, and prints no name there', async () => {
    await TestBed.configureTestingModule({ imports: [IconHost] }).compileComponents();
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    await open(fixture);

    const column = optionFor('blueberry').querySelector("[data-part='icon']");
    expect(column?.querySelector("[data-ui='icon'] > svg")?.getAttribute('data-glyph')).toBe('dot');
    expect(column?.textContent?.trim()).toBe('');
    expect(optionFor('raspberry').querySelector("[data-part='icon']")).toBeNull();
  });
});

/** The words come from the language in force, and follow a change of it in place. */
describe('SlMultiSelect, the language in force', () => {
  it('speaks pt-BR, and follows a change of locale without being created again', async () => {
    const locale = signal('pt-BR');
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.defaultValue.set(['blueberry', 'raspberry']);
    await settle(fixture);

    expect(grid().getAttribute('aria-label')).toBe('Fruit, 2 escolhidos');

    locale.set('en-US');
    await settle(fixture);
    expect(grid().getAttribute('aria-label')).toBe('Fruit, 2 chosen');
  });
});

/**
 * The name belongs to the input and the listbox. Left on the host as well, it
 * named a generic element — a role that prohibits a name — and gave the root an
 * attribute `MultiSelect` never writes there.
 */
describe('SlMultiSelect, the accessible name', () => {
  it('names the input, and leaves no aria-label on the host', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await settle(fixture);

    expect(field().getAttribute('aria-label')).toBe('Fruit');
    expect(root().hasAttribute('aria-label')).toBe(false);
  });

  /**
   * The contract's wiring: the control carries the field's label and the count
   * of chips. Both bindings wrote the count alone, and a reader who entered the
   * grid heard "2 chosen" with nothing saying of what.
   */
  it('names the grid with the label and the count of chips', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.defaultValue.set(['blueberry', 'raspberry']);
    await settle(fixture);

    expect(grid().getAttribute('aria-label')).toBe('Fruit, 2 chosen');
    expect(grid().hasAttribute('aria-labelledby')).toBe(false);
  });
});

/**
 * A browser runs microtasks before the next render. Focus that waits only for a
 * microtask reaches a DOM the change has not reached yet: the field a chip
 * turns into does not exist, and the moved chip has not moved. Each test lets
 * the microtasks run before rendering, as a page does.
 */
describe('SlMultiSelect, focus after a chip changes', () => {
  const microtasks = () => new Promise<void>((resolve) => queueMicrotask(resolve));
  const focusedValue = () => document.activeElement?.getAttribute('data-value');

  it('keeps focus on the moved chip', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.defaultValue.set(['blueberry', 'raspberry', 'cloudberry']);
    fixture.componentInstance.reorderable.set(true);
    await settle(fixture);

    chips()[2]!.focus();
    press(chips()[2]!, 'Home', { altKey: true });
    await microtasks();
    await settle(fixture);

    expect(chipValues()).toEqual(['cloudberry', 'blueberry', 'raspberry']);
    expect(focusedValue()).toBe('cloudberry');
  });

  it('focuses the field a chip turns into, and the chip again once it is committed', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.creatable.set(true);
    fixture.componentInstance.editable.set(true);
    fixture.componentInstance.defaultValue.set(['fig']);
    await settle(fixture);

    chips()[0]!.focus();
    press(chips()[0]!, 'Enter');
    await microtasks();
    await settle(fixture);
    const editor = document.querySelector<HTMLInputElement>(
      "[data-part='chips'] input:not([data-part='input'])",
    )!;
    expect(document.activeElement).toBe(editor);

    editor.value = 'figs';
    editor.dispatchEvent(new Event('input'));
    press(editor, 'Enter');
    await microtasks();
    await settle(fixture);
    expect(focusedValue()).toBe('figs');
  });
});

/**
 * A key that arrives before the next render — a fast typist, a barcode scanner
 * — types into the input as the browser holds it. A commit that empties the
 * query only in the model left the committed text in the input until the
 * render, and the next character joined it.
 */
describe('SlMultiSelect, typing faster than the render', () => {
  it('empties the input the moment a delimiter commits its text', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.creatable.set(true);
    await settle(fixture);

    field().focus();
    field().value = 'kiwi';
    field().dispatchEvent(new Event('input', { bubbles: true }));
    press(field(), ',');
    field().value += 'l';
    field().dispatchEvent(new Event('input', { bubbles: true }));
    await settle(fixture);

    expect(chipValues()).toEqual(['kiwi']);
    expect(field().value).toBe('l');
  });
});

const MANY = Array.from({ length: 40 }, (_, index) => ({
  value: `v${index}`,
  label: `Option ${index}`,
}));

@Component({
  standalone: true,
  imports: [SlMultiSelect, SlMultiSelectItem],
  template: `
    <sl-multi-select aria-label="Many" [portal]="false" [(open)]="open">
      @for (row of rows; track row.value) {
        <sl-multi-select-item [value]="row.value" [label]="row.label" />
      }
    </sl-multi-select>
  `,
})
class ManyHost {
  readonly open = signal(false);
  readonly rows = MANY;
}

/**
 * The cost of opening and of moving the highlight is one read of the
 * collection, whatever the list holds. An option that recounted the popup from
 * its own render effect read the whole collection once per option on every
 * open and every highlight move — quadratic in the option count.
 */
describe('SlMultiSelect, the cost of a long list', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ManyHost] }).compileComponents();
  });

  it('reads the collection a bounded number of times to open and to move the highlight', async () => {
    const reads = vi.spyOn(SlMultiSelect.prototype, 'options');
    const fixture = TestBed.createComponent(ManyHost);
    fixture.detectChanges();
    await fixture.whenStable();

    reads.mockClear();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(reads.mock.calls.length).toBeLessThan(8);

    reads.mockClear();
    document
      .querySelector("[data-part='item'][data-value='v10']")
      ?.dispatchEvent(new PointerEvent('pointerenter'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector('[data-current]')?.getAttribute('data-value')).toBe('v10');
    expect(reads.mock.calls.length).toBeLessThan(4);

    reads.mockClear();
    field().value = 'Option 1';
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelectorAll("[data-part='item']:not([hidden])").length).toBe(11);
    expect(reads.mock.calls.length).toBeLessThan(8);
    reads.mockRestore();
  });
});
