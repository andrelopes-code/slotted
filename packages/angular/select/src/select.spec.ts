import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { beforeEach, describe, expect, it } from 'vitest';

import { SlSelect } from './select';
import { provideSelectDefaults } from './select-defaults';
import { SlSelectGroup, SlSelectItem, SlSelectSeparator } from './select-items';

@Component({
  standalone: true,
  imports: [SlSelect, SlSelectGroup, SlSelectItem, SlSelectSeparator],
  template: `
    <sl-select
      aria-label="Fruit"
      placeholder="Choose a fruit"
      [(value)]="value"
      [multiple]="multiple()"
      [clearable]="clearable()"
      [loop]="loop()"
      [readOnly]="readOnly()"
      (valueChangeRequest)="valueReason.set($event.reason)"
      (openChangeRequest)="openReason.set($event.reason)"
    >
      <sl-select-group label="Berries">
        <sl-select-item value="apple">Apple</sl-select-item>
        <sl-select-item value="banana" [disabled]="true">Banana</sl-select-item>
        <sl-select-item value="blueberry">Blueberry</sl-select-item>
      </sl-select-group>
      <sl-select-separator />
      <sl-select-item value="cherry">Cherry</sl-select-item>
    </sl-select>
  `,
})
class Host {
  readonly value = signal<string | readonly string[] | null>(null);
  readonly multiple = signal(false);
  readonly clearable = signal(false);
  readonly loop = signal(false);
  readonly readOnly = signal(false);
  readonly valueReason = signal<string | undefined>(undefined);
  readonly openReason = signal<string | undefined>(undefined);
}

const trigger = () =>
  document.querySelector<HTMLButtonElement>("[data-part='trigger']") as HTMLButtonElement;
const listbox = () => document.querySelector<HTMLElement>("[role='listbox']");
const options = () => [...document.querySelectorAll<HTMLElement>("[role='option']")];
const named = (label: string) =>
  options().find((option) => option.textContent?.includes(label)) as HTMLElement;
const highlighted = () => trigger().getAttribute('aria-activedescendant');

function press(key: string, init: KeyboardEventInit = {}) {
  trigger().dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...init }));
}

/**
 * What a browser does with a press on an option, in the order it does it. The
 * focus move is the press's default action, so an option that refuses the press
 * leaves focus where it was; the click is dispatched either way (CB11).
 */
function pressOption(fixture: ComponentFixture<unknown>, option: HTMLElement) {
  const focusMoves = option.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
  );
  if (focusMoves) {
    trigger().blur();
    fixture.detectChanges();
  }
  option.click();
  fixture.detectChanges();
}

@Component({
  standalone: true,
  imports: [SlSelect, SlSelectItem],
  template: `<span id="fruit-label">Fruit</span>
    <sl-select aria-labelledby="fruit-label">
      <sl-select-item value="apple">Apple</sl-select-item>
    </sl-select>`,
})
class LabelledHost {}

@Component({
  standalone: true,
  imports: [SlSelect, SlSelectItem],
  template: `<sl-select aria-label="Statement" placeholder="Choose" value="">
    <sl-select-item value="">Automatic</sl-select-item>
    <sl-select-item value="2026-12">December 2026</sl-select-item>
  </sl-select>`,
})
class EmptyValueHost {}

/** The empty string is an option value as HTML's own `<option value="">` is one. */
describe('SlSelect, holding the empty string', () => {
  it('names the option whose value it is', async () => {
    await TestBed.configureTestingModule({ imports: [EmptyValueHost] }).compileComponents();
    const fixture = TestBed.createComponent(EmptyValueHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(trigger().textContent?.trim()).toBe('Automatic');
  });
});

describe('SlSelect, named by another element', () => {
  it('carries a written aria-labelledby to the trigger, not the root', async () => {
    await TestBed.configureTestingModule({ imports: [LabelledHost] }).compileComponents();
    const fixture = TestBed.createComponent(LabelledHost);
    fixture.detectChanges();

    const root = document.querySelector('[data-ui="select"]') as HTMLElement;
    expect(trigger().getAttribute('aria-labelledby')).toBe('fruit-label');
    expect(root.hasAttribute('aria-labelledby')).toBe(false);
  });
});

@Component({
  standalone: true,
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectItem],
  template: `<div slField id="fruit">
    <label slFieldLabel>Fruit</label>
    <sl-select placeholder="Choose a fruit">
      <sl-select-item value="apple">Apple</sl-select-item>
    </sl-select>
  </div>`,
})
class FieldHost {}

/**
 * Field › wiring.id: the control carries the field's identifier, so the label's
 * `for` reaches the trigger — a button is labelable — and a press on the label
 * focuses it. The popup names the trigger by the same identifier.
 */
describe('SlSelect, inside a field', () => {
  it('is the control the field’s label is for', async () => {
    await TestBed.configureTestingModule({ imports: [FieldHost] }).compileComponents();
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();

    const label = document.querySelector('label') as HTMLLabelElement;
    expect(label.control).toBe(trigger());
    expect(trigger().id).toBe('fruit-control');
    press('ArrowDown');
    fixture.detectChanges();
    expect(listbox()?.getAttribute('aria-labelledby')).toBe('fruit-control');
  });

  /**
   * A press on the label reaches the trigger as the click the label forwards: a
   * pointer click (detail 1) whose press went down on the label, not on the
   * control's frame. It
   * focuses the control and leaves the list closed, as the select-only
   * example's label does and as a native select does.
   */
  it('focuses without opening when the label is pressed', async () => {
    await TestBed.configureTestingModule({ imports: [FieldHost] }).compileComponents();
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();

    const click = (clientX: number, clientY: number) =>
      trigger().dispatchEvent(
        new MouseEvent('click', { bubbles: true, detail: 1, clientX, clientY }),
      );
    const pressOn = (element: Element) =>
      element.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    pressOn(fixture.nativeElement.querySelector('[data-part="label"], label'));
    click(-40, -20);
    fixture.detectChanges();
    expect(document.activeElement).toBe(trigger());
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    pressOn(trigger());
    click(0, 0);
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });
});

describe('SlSelect', () => {
  let fixture: ComponentFixture<Host>;

  const open = () => {
    press('ArrowDown');
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  /**
   * The highlight is brought into view by scrolling the list alone. A
   * `scrollIntoView` scrolls every ancestor as well, and on the first open it
   * runs before the popup is positioned — so a select far down a page sent the
   * page to its top, and the popup, its control now out of view, hid itself.
   */
  it('scrolls the list to the highlight, and never the page', () => {
    const original = Element.prototype.scrollIntoView;
    let calls = 0;
    Element.prototype.scrollIntoView = () => {
      calls += 1;
    };
    try {
      open();
      const surface = listbox() as HTMLElement;
      Object.defineProperty(surface, 'clientHeight', { configurable: true, value: 100 });
      Object.defineProperty(surface, 'scrollTop', { configurable: true, writable: true, value: 0 });
      surface.getBoundingClientRect = () =>
        DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 100 });
      named('Cherry').getBoundingClientRect = () =>
        DOMRect.fromRect({ x: 0, y: 130, width: 200, height: 30 });
      press('End');
      fixture.detectChanges();
      expect(calls).toBe(0);
      expect(surface.scrollTop).toBe(60);
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  /**
   * The popup is bounded by the height the positioner reports, and that height
   * arrives after the highlight lands on the selected option. Revealed only
   * then, the row was measured inside an unbounded list and stayed below the
   * fold once the list took its height.
   */
  it('shows the selected option once the popup has taken its height', async () => {
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
      if (this.getAttribute('data-value') === 'cherry') {
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
      fixture.componentInstance.value.set('cherry');
      fixture.detectChanges();
      open();
      const surface = listbox() as HTMLElement;
      for (let attempt = 0; attempt < 20 && surface.scrollTop !== 60; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(surface.scrollTop).toBe(60);
    } finally {
      Element.prototype.getBoundingClientRect = rect;
      if (height) Object.defineProperty(HTMLElement.prototype, 'clientHeight', height);
      if (top) Object.defineProperty(Element.prototype, 'scrollTop', top);
    }
  });

  it('is a combobox that opens a listbox, and says so before it does', () => {
    expect(trigger().getAttribute('role')).toBe('combobox');
    expect(trigger().getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    open();
    expect(listbox()).not.toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(listbox()?.id);
  });

  /**
   * The name is the trigger's (contract: \`aria-labelledby\` on the trigger).
   * The root is a generic element, which ARIA 1.2 does not let be named, and
   * React's \`Select\` root carries no name.
   */
  it('names the trigger and leaves the root unnamed', () => {
    const root = document.querySelector('[data-ui="select"]') as HTMLElement;
    expect(trigger().getAttribute('aria-label')).toBe('Fruit');
    expect(root.hasAttribute('aria-label')).toBe(false);
  });

  it('keeps DOM focus on the trigger for the whole interaction', () => {
    trigger().focus();
    open();
    press('ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(trigger());
  });

  it('marks the highlight with aria-activedescendant and data-current', () => {
    open();
    expect(highlighted()).toBe(named('Apple').id);
    expect(named('Apple').hasAttribute('data-current')).toBe(true);
    press('ArrowDown');
    fixture.detectChanges();
    expect(named('Blueberry').hasAttribute('data-current')).toBe(true);
  });

  it('steps over a disabled option rather than landing on it', () => {
    open();
    press('ArrowDown');
    fixture.detectChanges();
    /* Banana sits between Apple and Blueberry and is disabled. */
    expect(highlighted()).toBe(named('Blueberry').id);
  });

  it('does not wrap by default, and wraps when it is asked to', () => {
    open();
    press('End');
    fixture.detectChanges();
    press('ArrowDown');
    fixture.detectChanges();
    expect(highlighted()).toBe(named('Cherry').id);

    fixture.componentInstance.loop.set(true);
    fixture.detectChanges();
    press('ArrowDown');
    fixture.detectChanges();
    expect(highlighted()).toBe(named('Apple').id);
  });

  it('opens onto the last option from ArrowUp', () => {
    press('ArrowUp');
    fixture.detectChanges();
    expect(highlighted()).toBe(named('Cherry').id);
  });

  it('commits on Enter, closes, and reports both reasons', () => {
    open();
    press('Enter');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('apple');
    expect(fixture.componentInstance.valueReason()).toBe('keyboard');
    expect(fixture.componentInstance.openReason()).toBe('select');
    expect(listbox()).toBeNull();
  });

  it('closes on Escape without committing anything', () => {
    open();
    press('Escape');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance.openReason()).toBe('escape');
  });

  it('finds an option by typing its opening characters', () => {
    open();
    press('c');
    fixture.detectChanges();
    expect(highlighted()).toBe(named('Cherry').id);
  });

  /**
   * CB11. The button holds focus and `aria-activedescendant` names the option;
   * a press that moved focus to the body would leave the property pointing at
   * something that is not the active element.
   */
  it('keeps DOM focus on the trigger across a press on an option', () => {
    trigger().focus();
    open();

    pressOption(fixture, named('Blueberry'));

    expect(document.activeElement).toBe(trigger());
    expect(fixture.componentInstance.value()).toBe('blueberry');
  });

  it('keeps it across every press of a multiple selection', () => {
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    trigger().focus();
    open();

    pressOption(fixture, named('Apple'));
    pressOption(fixture, named('Cherry'));

    expect(document.activeElement).toBe(trigger());
    expect(fixture.componentInstance.value()).toEqual(['apple', 'cherry']);
  });

  /**
   * SL10. The control holds one line, so twelve chosen values are three chips
   * and a count. The band at the top of the popup holds all of them, and holds
   * no widget: focus never enters this layer, so a remove control in there
   * would be a tab stop the pattern excludes and a control no keyboard reaches.
   */
  describe('the band of chosen values', () => {
    const band = () => document.querySelector("[data-part='chosen']");

    it('holds every chosen value, whatever the control had room for', () => {
      fixture.componentInstance.multiple.set(true);
      fixture.detectChanges();
      open();
      named('Apple').click();
      fixture.detectChanges();
      named('Blueberry').click();
      fixture.detectChanges();
      named('Cherry').click();
      fixture.detectChanges();

      const labels = [...(band()?.querySelectorAll("[data-part='label']") ?? [])].map(
        (label) => label.textContent,
      );
      expect(labels).toEqual(['Apple', 'Blueberry', 'Cherry']);
    });

    it('is drawn inside the surface and out of the accessibility tree', () => {
      fixture.componentInstance.multiple.set(true);
      fixture.componentInstance.value.set(['apple']);
      fixture.detectChanges();
      open();

      expect(listbox()?.contains(band())).toBe(true);
      expect(band()?.getAttribute('aria-hidden')).toBe('true');
      expect(band()?.querySelector("[data-part='remove']")).toBeNull();
      expect(band()?.querySelector('button')).toBeNull();
    });

    it('is not drawn at all while nothing is chosen, or in single selection', () => {
      fixture.componentInstance.multiple.set(true);
      fixture.detectChanges();
      open();
      expect(band()).toBeNull();

      fixture.componentInstance.multiple.set(false);
      fixture.componentInstance.value.set('apple');
      fixture.detectChanges();
      expect(band()).toBeNull();
    });
  });

  it('names the chosen option in the closed control', () => {
    open();
    named('Blueberry').click();
    fixture.detectChanges();
    expect(trigger().textContent?.trim()).toBe('Blueberry');
  });

  /**
   * SL4: several values are the chips they are, and not a sentence about them.
   * The sentence stays as the trigger's name — and as what a control too narrow
   * for a chip shows — but the picture is one `tag` per value, each with the
   * remove control a tag already has.
   */
  it('previews several values as chips, and keeps the popup open while they are taken', () => {
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    open();
    expect(listbox()?.getAttribute('aria-multiselectable')).toBe('true');

    named('Apple').click();
    fixture.detectChanges();
    named('Cherry').click();
    fixture.detectChanges();

    expect(listbox()).not.toBeNull();
    const chips = [
      ...document.querySelectorAll("[data-part='tags'] > [data-ui='tag']:not([data-overflow])"),
    ];
    expect(chips.map((chip) => chip.querySelector("[data-part='label']")?.textContent)).toEqual([
      'Apple',
      'Cherry',
    ]);
    for (const chip of chips) {
      expect(chip.querySelector("[data-part='remove']")).not.toBeNull();
    }
    expect(trigger().textContent?.trim()).toBe('2 selected');

    /* The chip that counts what did not fit is rendered and hidden until the
       collapse reveals it. */
    const overflow = document.querySelector("[data-part='tags'] > [data-overflow]");
    expect(overflow?.getAttribute('data-ui')).toBe('tag');
    expect(overflow?.hasAttribute('hidden')).toBe(true);
  });

  it('takes a value out of the selection from its own chip', () => {
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    open();
    named('Apple').click();
    fixture.detectChanges();
    named('Cherry').click();
    fixture.detectChanges();

    const remove = document.querySelector<HTMLButtonElement>(
      "[data-part='tags'] > [data-ui='tag']:not([data-overflow]) [data-part='remove']",
    );
    expect(remove?.getAttribute('aria-label')).toBe('Remove Apple');
    remove?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toEqual(['cherry']);
  });

  it('clears the selection, and says why', () => {
    fixture.componentInstance.clearable.set(true);
    fixture.componentInstance.value.set('apple');
    fixture.detectChanges();

    document.querySelector<HTMLButtonElement>("[data-part='clear']")?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance.valueReason()).toBe('clear');
  });

  /** Every icon the family owns is a `Glyph` element inside an `Icon` box, never a mask. */
  it('draws the chevron, the cross and the tick as glyph elements', () => {
    fixture.componentInstance.clearable.set(true);
    fixture.componentInstance.value.set('apple');
    fixture.detectChanges();
    const glyph = (part: string) =>
      document.querySelector(`[data-part='${part}'] > [data-ui='icon'] > svg[data-glyph]`);
    expect(glyph('arrow')?.getAttribute('data-glyph')).toBe('chevron-down');
    expect(glyph('clear')?.getAttribute('data-glyph')).toBe('x');

    open();
    const tick = named('Apple').querySelector("[data-part='indicator'] > [data-ui='icon'] > svg");
    expect(tick?.getAttribute('data-glyph')).toBe('check');
  });

  it('refuses to open while it is read-only', () => {
    fixture.componentInstance.readOnly.set(true);
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-readonly')).toBe('true');
    open();
    expect(listbox()).toBeNull();
  });

  it('names each group by its own label, as the listbox pattern requires', () => {
    open();
    const group = document.querySelector<HTMLElement>("[role='group']");
    const labelId = group?.getAttribute('aria-labelledby') ?? '';
    expect(document.getElementById(labelId)?.textContent?.trim()).toBe('Berries');
  });

  it('opens onto a sentence when it holds no options', async () => {
    @Component({
      standalone: true,
      imports: [SlSelect],
      template: `<sl-select aria-label="Empty" />`,
    })
    class Bare {}

    const bare = TestBed.createComponent(Bare);
    bare.detectChanges();
    trigger().dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
    bare.detectChanges();
    expect(document.querySelector("[data-part='empty']")?.textContent?.trim()).toBe('No options');
  });

  it('writes every state a consumer may style into the DOM', () => {
    const root = document.querySelector<HTMLElement>("[data-ui='select'][data-part='root']");
    expect(root?.getAttribute('data-size')).toBe('md');
    expect(root?.getAttribute('data-variant')).toBe('outline');
    expect(root?.hasAttribute('data-full-width')).toBe(true);
    open();
    expect(root?.hasAttribute('data-open')).toBe(true);
  });

  /**
   * A popup pinned to the control's width wrapped its option labels under a
   * narrow control. The default sizes it to its options, never narrower than
   * the control.
   */
  it('sizes the popup to its options by default', () => {
    open();
    const positioner = document.querySelector<HTMLElement>(
      "[data-ui='select'][data-part='positioner']",
    );
    expect(positioner?.getAttribute('data-width')).toBe('content');
  });
});

/**
 * Contract `chips.narrowWidth`: under 120px of control a multiple select's
 * chips give way to the summary sentence. A single select draws no chips, so
 * nothing swaps and nothing is written.
 */
describe('SlSelect, narrower than a chip', () => {
  it('writes data-narrow only while a multiple select draws its chips', async () => {
    const original = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = () =>
      ({ bottom: 32, height: 32, left: 0, right: 100, top: 0, width: 100, x: 0, y: 0 }) as DOMRect;
    try {
      await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
      const fixture = TestBed.createComponent(Host);
      const root = () => document.querySelector("[data-ui='select'][data-part='root']");
      const settle = async () => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
      };
      await settle();

      fixture.componentInstance.value.set('apple');
      await settle();
      expect(root()?.hasAttribute('data-narrow')).toBe(false);

      fixture.componentInstance.multiple.set(true);
      fixture.componentInstance.value.set(['apple', 'cherry']);
      await settle();
      expect(root()?.hasAttribute('data-narrow')).toBe(true);

      fixture.componentInstance.value.set([]);
      await settle();
      expect(root()?.hasAttribute('data-narrow')).toBe(false);
    } finally {
      HTMLElement.prototype.getBoundingClientRect = original;
    }
  });
});

describe('SlSelect in a form', () => {
  @Component({
    standalone: true,
    imports: [ReactiveFormsModule, SlSelect, SlSelectItem],
    template: `
      <sl-select aria-label="Fruit" [formControl]="control" [required]="true">
        <sl-select-item value="apple">Apple</sl-select-item>
      </sl-select>
    `,
  })
  class FormHost {
    readonly control = new FormControl<string | null>(null);
  }

  it('is a ControlValueAccessor and a Validator, which is Angular’s own answer', async () => {
    await TestBed.configureTestingModule({ imports: [FormHost] }).compileComponents();
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();

    /* The family owns `required`, because the hidden native select always holds
       an option and the browser therefore cannot answer the question. */
    expect(fixture.componentInstance.control.errors).toEqual({ required: true });

    fixture.componentInstance.control.setValue('apple');
    fixture.detectChanges();
    expect(fixture.componentInstance.control.errors).toBeNull();
    expect(trigger().textContent?.trim()).toBe('Apple');
  });

  /**
   * The hidden native select holds one option per chosen value. Tracked by the
   * value itself, a single select that moved from one value to another
   * re-created its whole collection on every change, and Angular said so in
   * the console (NG0956) each time.
   */
  it('changes the value its hidden select submits without re-creating it', async () => {
    @Component({
      standalone: true,
      imports: [SlSelect, SlSelectItem],
      template: `
        <sl-select aria-label="Fruit" name="fruit" [(value)]="value">
          <sl-select-item value="apple">Apple</sl-select-item>
          <sl-select-item value="cherry">Cherry</sl-select-item>
        </sl-select>
      `,
    })
    class NamedHost {
      readonly value = signal<string | readonly string[] | null>('apple');
    }
    await TestBed.configureTestingModule({ imports: [NamedHost] }).compileComponents();
    const fixture = TestBed.createComponent(NamedHost);
    fixture.detectChanges();

    const warnings: string[] = [];
    const warn = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args.map(String).join(' '));
    try {
      fixture.componentInstance.value.set('cherry');
      fixture.detectChanges();
    } finally {
      console.warn = warn;
    }
    expect(document.querySelector<HTMLSelectElement>("select[name='fruit']")?.value).toBe('cherry');
    expect(warnings.filter((message) => message.includes('NG0956'))).toEqual([]);
  });

  it('takes its disabled state from the form', async () => {
    await TestBed.configureTestingModule({ imports: [FormHost] }).compileComponents();
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(trigger().disabled).toBe(true);
  });
});

describe('SlSelect defaults', () => {
  @Component({
    standalone: true,
    imports: [SlSelect, SlSelectItem],
    template: `
      <sl-select aria-label="Fruit"><sl-select-item value="apple">Apple</sl-select-item></sl-select>
    `,
  })
  class ProvidedHost {}

  it('lets an application set every axis once', async () => {
    await TestBed.configureTestingModule({
      imports: [ProvidedHost],
      providers: [provideSelectDefaults({ size: 'sm', variant: 'subtle' })],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProvidedHost);
    fixture.detectChanges();
    const root = document.querySelector<HTMLElement>("[data-ui='select'][data-part='root']");
    expect(root?.getAttribute('data-size')).toBe('sm');
    expect(root?.getAttribute('data-variant')).toBe('subtle');
  });

  @Component({
    standalone: true,
    imports: [SlSelect, SlSelectItem],
    template: `
      <sl-select aria-label="Fruit" multiple [value]="['apple', 'cherry']" [portal]="false">
        <sl-select-item value="apple">Apple</sl-select-item>
        <sl-select-item value="cherry">Cherry</sl-select-item>
      </sl-select>
    `,
  })
  class SpokenHost {}

  it('speaks the language in force, and follows a change of it in place', async () => {
    const locale = signal('pt-BR');
    await TestBed.configureTestingModule({
      imports: [SpokenHost],
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    }).compileComponents();

    const fixture = TestBed.createComponent(SpokenHost);
    fixture.detectChanges();
    const summary = () => document.querySelector("[data-part='summary']")?.textContent?.trim();
    expect(summary()).toBe('2 selecionados');

    locale.set('en-US');
    fixture.detectChanges();
    expect(summary()).toBe('2 selected');
  });
});

@Component({
  standalone: true,
  imports: [SlSelect, SlSelectGroup, SlSelectItem],
  template: `
    <button type="button">before</button>
    <sl-select
      search
      aria-label="Fruit"
      placeholder="Choose a fruit"
      [(value)]="value"
      [(searchValue)]="query"
      [multiple]="multiple()"
      [filter]="filter()"
      (searchValueChangeRequest)="searchReason.set($event.reason)"
    >
      <sl-select-item value="apple" label="Apple" />
      <sl-select-item value="blueberry" label="Blueberry" />
      <sl-select-item value="cherry" label="Cherry" />
      <sl-select-item value="raspberry" label="Raspberry" />
    </sl-select>
    <button type="button">after</button>
  `,
})
class SearchHost {
  readonly value = signal<string | readonly string[] | null>(null);
  readonly query = signal('');
  readonly multiple = signal(false);
  readonly filter = signal<((label: string, query: string) => boolean) | null | undefined>(
    undefined,
  );
  readonly searchReason = signal<string | undefined>(undefined);
}

describe('SlSelect, searching', () => {
  let fixture: ComponentFixture<SearchHost>;

  const field = () =>
    document.querySelector<HTMLInputElement>("[data-part='search-input']") as HTMLInputElement;
  const visible = () => options().filter((option) => !option.hasAttribute('hidden'));
  const outside = (label: string) =>
    [...document.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent?.trim() === label,
    ) as HTMLButtonElement;

  const openSearch = () => {
    trigger().focus();
    trigger().click();
    fixture.detectChanges();
  };

  const type = (value: string) => {
    field().value = value;
    field().dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };

  const send = (key: string, init: KeyboardEventInit = {}) => {
    field().dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...init }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SearchHost] }).compileComponents();
    fixture = TestBed.createComponent(SearchHost);
    fixture.detectChanges();
  });

  it('draws the magnifier as a glyph element', () => {
    openSearch();
    const magnifier = document.querySelector(
      "[data-part='search-icon'] > [data-ui='icon'] > svg[data-glyph]",
    );
    expect(magnifier?.getAttribute('data-glyph')).toBe('search');
  });

  /**
   * The popup stops being a listbox and becomes a dialog holding one, which is
   * the composition the combobox pattern names: a popup that is not a listbox
   * is named by `aria-haspopup` on the control.
   */
  it('opens a dialog holding a listbox, and says so on the trigger', () => {
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    openSearch();

    const dialog = document.querySelector<HTMLElement>("[role='dialog']");
    expect(dialog).not.toBeNull();
    expect(trigger().getAttribute('aria-controls')).toBe(dialog?.id);
    expect(field().getAttribute('aria-controls')).toBe(listbox()?.id);
    expect(field().getAttribute('aria-autocomplete')).toBe('list');
  });

  /** The pattern: a dialog popup does not support aria-activedescendant. */
  it('takes focus into the field however the popup was opened, and gives it back', () => {
    openSearch();
    expect(document.activeElement).toBe(field());
    expect(trigger().getAttribute('aria-activedescendant')).toBeNull();

    send('ArrowDown');
    expect(field().getAttribute('aria-activedescendant')).not.toBeNull();

    send('Escape');
    expect(document.activeElement).toBe(trigger());
  });

  it('filters the options and marks the span the query matched', () => {
    openSearch();
    type('berr');

    expect(visible().map((option) => option.textContent?.trim())).toEqual([
      'Blueberry',
      'Raspberry',
    ]);
    const marks = [...document.querySelectorAll("[data-part='match']")];
    expect(marks).toHaveLength(2);
    expect(marks.every((mark) => mark.parentElement?.getAttribute('data-ui') === 'highlight')).toBe(
      true,
    );
  });

  it('moves the highlight onto the first surviving option as the query changes', () => {
    openSearch();
    type('rasp');
    expect(field().getAttribute('aria-activedescendant')).toBe(named('Raspberry').id);

    send('Enter');
    expect(fixture.componentInstance.value()).toBe('raspberry');
    expect(document.querySelector("[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  /** The query first, the popup second. */
  it('clears the query on the first Escape and closes on the second', () => {
    openSearch();
    type('berr');
    expect(visible()).toHaveLength(2);

    send('Escape');
    expect(visible()).toHaveLength(4);
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
    expect(fixture.componentInstance.query()).toBe('');

    send('Escape');
    expect(document.querySelector("[role='dialog']")).toBeNull();
  });

  /**
   * Tab keeps the effect the closed control's Tab has — commit, close, move on
   * — and only the mechanism differs: the layer is portalled to the end of the
   * document, so the browser's own next element is the end of the page.
   */
  it('commits on Tab and leaves the control for the element beside it', () => {
    openSearch();
    send('ArrowDown');
    send('Tab');

    expect(fixture.componentInstance.value()).toBe('blueberry');
    expect(document.querySelector("[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(outside('after'));
  });

  it('goes back the way it came under Shift', () => {
    openSearch();
    send('Tab', { shiftKey: true });
    expect(document.activeElement).toBe(outside('before'));
  });

  /** A field the reader is typing into cannot spend the space bar on a commit. */
  it('leaves the space bar, Home and End to the browser', () => {
    openSearch();
    send('ArrowDown');
    const held = field().getAttribute('aria-activedescendant');

    for (const key of [' ', 'Home', 'End']) {
      const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
      field().dispatchEvent(event);
      fixture.detectChanges();
      expect(event.defaultPrevented, `${key} was prevented`).toBe(false);
    }
    expect(field().getAttribute('aria-activedescendant')).toBe(held);
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
  });

  it('announces how many options survived the query', () => {
    openSearch();
    const status = () => document.querySelector<HTMLElement>("[data-part='status']");
    expect(status()?.textContent?.trim()).toBe('4 results');

    type('berr');
    expect(status()?.textContent?.trim()).toBe('2 results');
  });

  it('renders the window it was given when the filter is null', () => {
    fixture.componentInstance.filter.set(null);
    fixture.detectChanges();
    openSearch();
    type('nothing matches this');
    expect(visible()).toHaveLength(4);
  });

  it('replaces the comparison when a filter is given', () => {
    fixture.componentInstance.filter.set((label, query) => label.startsWith(query));
    fixture.detectChanges();
    openSearch();
    type('Ch');
    expect(visible().map((option) => option.textContent?.trim())).toEqual(['Cherry']);
  });

  /** Two searches on one keystroke would move the highlight twice per character. */
  it('turns typeahead off, so a printable key only types', () => {
    trigger().focus();
    press('c');
    fixture.detectChanges();
    expect(fixture.componentInstance.query()).toBe('c');
    expect(visible().map((option) => option.textContent?.trim())).toEqual(['Cherry']);
  });

  /** The query is a value the consumer can own, and it is not the selection. */
  it('asks before the query moves, with a reason of its own', () => {
    openSearch();
    type('ch');
    expect(fixture.componentInstance.searchReason()).toBe('keyboard');
    expect(fixture.componentInstance.value()).toBeNull();
  });

  /** A list still filtered to the row the reader has just taken looks broken. */
  it('empties the query when an option is taken and the popup stays open', () => {
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    openSearch();
    type('berr');
    expect(visible()).toHaveLength(2);

    pressOption(fixture, named('Blueberry'));
    expect(visible()).toHaveLength(4);
    expect(document.querySelector("[role='dialog']")).not.toBeNull();
    expect(fixture.componentInstance.searchReason()).toBe('select');
  });

  it('forgets the query when the popup closes', () => {
    openSearch();
    type('berr');
    send('Escape');
    send('Escape');
    expect(document.querySelector("[role='dialog']")).toBeNull();

    openSearch();
    expect(field().value).toBe('');
    expect(visible()).toHaveLength(4);
  });
});

@Component({
  standalone: true,
  imports: [SlSelect, SlSelectItem],
  template: `
    <sl-select aria-label="Fruit">
      <sl-select-item value="apple" icon="dot">Apple</sl-select-item>
      <sl-select-item value="cherry">Cherry</sl-select-item>
    </sl-select>
  `,
})
class IconHost {}

/** The first column holds the glyph the icon input names; no stylesheet fills it. */
describe('SlSelect, the icon column', () => {
  it('draws the named glyph in the first column, and prints no name there', async () => {
    await TestBed.configureTestingModule({ imports: [IconHost] }).compileComponents();
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    press('ArrowDown');
    fixture.detectChanges();

    const column = named('Apple').querySelector("[data-part='icon']");
    expect(column?.querySelector("[data-ui='icon'] > svg")?.getAttribute('data-glyph')).toBe('dot');
    expect(column?.textContent?.trim()).toBe('');
    expect(named('Cherry').querySelector("[data-part='icon']")).toBeNull();
  });
});

@Component({
  standalone: true,
  imports: [SlSelect, SlSelectItem],
  template: `
    <sl-select aria-label="Account" [value]="'a1b2c3'">
      <sl-select-item value="a1b2c3">Checking</sl-select-item>
      <sl-select-item value="d4e5f6">Savings</sl-select-item>
    </sl-select>
  `,
})
class AccountHost {}

/**
 * A value that is not its own label shows the label of its option while the
 * control is closed and the popup has never been built. The options are
 * projected content, created with the host whether or not the popup exists.
 */
describe('SlSelect, the closed control and an identifier', () => {
  it('names the value from its option without items', async () => {
    const fixture = TestBed.createComponent(AccountHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(trigger().textContent?.trim()).toBe('Checking');
    expect(document.querySelector("[role='listbox']")).toBeNull();
  });
});
