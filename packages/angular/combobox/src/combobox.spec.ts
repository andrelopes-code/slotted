import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SlCombobox } from './combobox';
import type { ComboboxOpenOn } from './combobox-defaults';
import { SlComboboxItem, SlComboboxItemIcon } from './combobox-items';

@Component({
  standalone: true,
  imports: [SlCombobox, SlComboboxItem],
  template: `
    <sl-combobox
      aria-label="Fruit"
      [defaultValue]="defaultValue()"
      [portal]="false"
      (valueChange)="value.set($event)"
    >
      <sl-combobox-item value="blueberry" label="Blueberry" />
      <sl-combobox-item value="raspberry" label="Raspberry" />
    </sl-combobox>
  `,
})
class Host {
  readonly defaultValue = signal<string | null | undefined>(undefined);
  readonly value = signal<string | null | undefined>(undefined);
}

@Component({
  standalone: true,
  imports: [SlCombobox, SlComboboxItem],
  template: `
    <sl-combobox
      aria-label="Fruit"
      [portal]="false"
      [items]="items"
      [allowsCustomValue]="allowsCustomValue()"
      [defaultValue]="defaultValue()"
      [inputValue]="inputText()"
      (valueChangeRequest)="requested.set($event.value)"
      (inputReset)="refused.set($event.rejected)"
    >
      <sl-combobox-item value="apple" label="Apple" />
    </sl-combobox>
  `,
})
class SettleHost {
  readonly items = [{ value: 'apple', label: 'Apple' }];
  readonly allowsCustomValue = signal(false);
  readonly defaultValue = signal<string | null | undefined>(undefined);
  readonly inputText = signal('');
  readonly requested = signal<string | null | undefined>(undefined);
  readonly refused = signal<string | undefined>(undefined);
}

@Component({
  standalone: true,
  imports: [SlCombobox, SlComboboxItem],
  template: `
    <sl-combobox aria-label="Fruit" defaultValue="raspberry" [portal]="false" [(value)]="value">
      <sl-combobox-item value="blueberry" label="Blueberry" />
      <sl-combobox-item value="raspberry" label="Raspberry" />
    </sl-combobox>
  `,
})
class BoundHost {
  value: string | null = 'blueberry';
}

@Component({
  standalone: true,
  imports: [SlCombobox, SlComboboxItem],
  template: `
    <sl-combobox
      aria-label="Fruit"
      [portal]="false"
      [open]="true"
      [creatable]="creatable()"
      (create)="created.set($event.query)"
      (valueChangeRequest)="requested.set($event.value)"
    >
      <sl-combobox-item value="apple" label="Apple" />
    </sl-combobox>
  `,
})
class CreateHost {
  readonly creatable = signal(true);
  readonly created = signal<string | undefined>(undefined);
  readonly requested = signal<string | null | undefined>(undefined);
}

@Component({
  standalone: true,
  imports: [SlCombobox, SlComboboxItem],
  template: `
    <sl-combobox
      aria-label="Fruit"
      [portal]="false"
      [openOn]="openOn()"
      [readOnly]="readOnly()"
      (openChangeRequest)="requests.push($event)"
    >
      <sl-combobox-item value="blueberry" label="Blueberry" />
      <sl-combobox-item value="raspberry" label="Raspberry" />
    </sl-combobox>
  `,
})
class OpeningHost {
  readonly openOn = signal<ComboboxOpenOn>('input');
  readonly readOnly = signal(false);
  readonly requests: ChangeRequest<boolean>[] = [];
}

const field = () =>
  document.querySelector<HTMLInputElement>("[data-part='input']") as HTMLInputElement;

const marks = () => [...document.querySelectorAll("[data-part='match']")];

const option = (value: string) =>
  document.querySelector<HTMLElement>(`[data-part='item'][data-value='${value}']`) as HTMLElement;

/**
 * What a browser does with a press on an option, in the order it does it. The
 * focus move is the press's default action, so an option that refuses the press
 * leaves focus where it was — and only a press that moved focus produces the
 * `blur` that follows it. `inert` then swallows the click: a browser dispatches
 * none into a subtree the layer has switched off, which jsdom does not model
 * (CB11).
 */
const pressOption = (fixture: ComponentFixture<unknown>, target: HTMLElement) => {
  const focusMoves = target.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
  );
  if (focusMoves) {
    field().blur();
    fixture.detectChanges();
  }
  if (target.closest('[inert]') !== null) return;
  target.click();
  fixture.detectChanges();
};

describe('SlCombobox', () => {
  /**
   * R6/CB6: the span the query found is the `highlight` family's. Its root
   * sits inside this family's label and the `mark` is its part, so one sheet
   * paints what every list a reader types into found, and the same anatomy is
   * written here, in React, and in the harness fragment.
   */
  describe('the marked span', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    });

    it('renders the highlight family inside the label', async () => {
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      field().focus();
      field().value = 'berr';
      field().dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(marks().length).toBeGreaterThan(0);
      for (const mark of marks()) {
        expect(mark.tagName).toBe('MARK');
        expect(mark.hasAttribute('data-ui')).toBe(false);
        expect(mark.parentElement?.getAttribute('data-ui')).toBe('highlight');
        expect(mark.parentElement?.parentElement?.getAttribute('data-part')).toBe('label');
      }
    });
  });

  /**
   * `scrollIntoView` scrolls every ancestor, and on the first open it runs
   * before the popup is positioned: a control far down a page sent the page to
   * its top. The fix select and multi-select took.
   */
  describe('revealing the highlight', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    });

    it('scrolls the list to the highlight, and never the page', async () => {
      const original = Element.prototype.scrollIntoView;
      let calls = 0;
      Element.prototype.scrollIntoView = () => {
        calls += 1;
      };
      try {
        const fixture = TestBed.createComponent(Host);
        fixture.detectChanges();
        field().focus();
        field().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        const surface = document.querySelector<HTMLElement>("[data-part='content']")!;
        Object.defineProperty(surface, 'clientHeight', { configurable: true, value: 100 });
        Object.defineProperty(surface, 'scrollTop', {
          configurable: true,
          writable: true,
          value: 0,
        });
        surface.getBoundingClientRect = () =>
          DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 100 });
        option('raspberry').getBoundingClientRect = () =>
          DOMRect.fromRect({ x: 0, y: 130, width: 200, height: 30 });
        for (let step = 0; step < 3; step += 1) {
          if (field().getAttribute('aria-activedescendant') === option('raspberry').id) break;
          field().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
          fixture.detectChanges();
          await fixture.whenStable();
          fixture.detectChanges();
        }
        expect(field().getAttribute('aria-activedescendant')).toBe(option('raspberry').id);
        expect(calls).toBe(0);
        expect(surface.scrollTop).toBe(60);
      } finally {
        Element.prototype.scrollIntoView = original;
      }
    });
  });

  /** Every icon the family owns is a `Glyph` element inside an `Icon` box, never a mask. */
  describe('the glyph elements', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [BoundHost] }).compileComponents();
    });

    it('draws the chevron, the cross and the tick as glyph elements', async () => {
      const fixture = TestBed.createComponent(BoundHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const glyph = (part: string) =>
        document.querySelector(`[data-part='${part}'] > [data-ui='icon'] > svg[data-glyph]`);
      expect(glyph('arrow')?.getAttribute('data-glyph')).toBe('chevron-down');

      /* The cross stands only while there is text to clear. */
      field().focus();
      field().value = 'Blue';
      field().dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(glyph('clear')?.getAttribute('data-glyph')).toBe('x');

      const chosen = document.querySelector("[data-part='item'][data-selected]");
      const tick = chosen?.querySelector("[data-part='indicator'] > [data-ui='icon'] > svg");
      expect(tick?.getAttribute('data-glyph')).toBe('check');
    });
  });

  /**
   * CB7. The default refuses text that matched no option: the field goes back
   * to the committed value and says what it refused. `allowsCustomValue` takes
   * it as the value instead. React's binding states the reasoning.
   */
  /**
   * CB8. The offer to add what was typed is an option, so the keyboard reaches
   * it and Enter takes it; taking it reports the query and selects nothing,
   * because the collection does not hold the value yet.
   */
  describe('creating a value the list does not hold', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [CreateHost] }).compileComponents();
    });

    const typeInto = (fixture: ComponentFixture<CreateHost>, text: string) => {
      field().value = text;
      field().dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    it('offers the query as an option, in place of the empty message', () => {
      const fixture = TestBed.createComponent(CreateHost);
      fixture.detectChanges();
      typeInto(fixture, 'durian');

      const offer = document.querySelector("[data-part='item'][data-create]");
      expect(offer?.textContent?.trim()).toBe('Create “durian”');
      expect(document.querySelector("[data-part='empty']")).toBeNull();
    });

    it('offers nothing while something matched, or while the field cannot create', () => {
      const fixture = TestBed.createComponent(CreateHost);
      fixture.detectChanges();
      typeInto(fixture, 'App');
      expect(document.querySelector('[data-create]')).toBeNull();

      fixture.componentInstance.creatable.set(false);
      typeInto(fixture, 'durian');
      expect(document.querySelector('[data-create]')).toBeNull();
      expect(document.querySelector("[data-part='empty']")).not.toBeNull();
    });

    it('reports the query and selects nothing when the offer is taken', () => {
      const fixture = TestBed.createComponent(CreateHost);
      fixture.detectChanges();
      typeInto(fixture, 'durian');

      document.querySelector<HTMLElement>('[data-create]')?.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.created()).toBe('durian');
      expect(fixture.componentInstance.requested()).toBeUndefined();
    });
  });

  /**
   * CB11. The pointer is the primary interaction of the family, and it crosses
   * the one place the family gave up: a press on an option is a press on
   * something that cannot hold focus, so the browser took focus off the input
   * and the settling of CB7 ran on text the reader was in the middle of using.
   */
  /**
   * The contract's `opening.press`: a press on the input opens a closed popup
   * under `input` and `focus`, never closes an open one, and under `manual`
   * only places the caret.
   */
  describe('a press on the input', () => {
    let fixture: ComponentFixture<OpeningHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [OpeningHost] }).compileComponents();
      fixture = TestBed.createComponent(OpeningHost);
    });

    const expanded = () => field().getAttribute('aria-expanded');
    const focusField = () => {
      field().focus();
      fixture.detectChanges();
    };
    const pressField = () => {
      field().click();
      fixture.detectChanges();
    };

    it('opens a closed popup, once, with reason pointer', () => {
      fixture.detectChanges();
      focusField();
      pressField();
      expect(expanded()).toBe('true');
      expect(fixture.componentInstance.requests).toHaveLength(1);
      expect(fixture.componentInstance.requests[0]).toMatchObject({
        value: true,
        reason: 'pointer',
      });
    });

    it('keeps an open popup open', () => {
      fixture.detectChanges();
      focusField();
      pressField();
      pressField();
      expect(expanded()).toBe('true');
      expect(fixture.componentInstance.requests).toHaveLength(1);
    });

    it('opens nothing on a Tab into the input under input', () => {
      fixture.detectChanges();
      focusField();
      expect(expanded()).toBe('false');
      expect(fixture.componentInstance.requests).toHaveLength(0);
    });

    it('only places the caret under manual', () => {
      fixture.componentInstance.openOn.set('manual');
      fixture.detectChanges();
      focusField();
      pressField();
      expect(expanded()).toBe('false');
      expect(fixture.componentInstance.requests).toHaveLength(0);
    });

    it('opens once under focus, through the focus the press gave', () => {
      fixture.componentInstance.openOn.set('focus');
      fixture.detectChanges();
      focusField();
      pressField();
      expect(expanded()).toBe('true');
      expect(fixture.componentInstance.requests).toHaveLength(1);
    });

    it('opens nothing on a read-only control', () => {
      fixture.componentInstance.readOnly.set(true);
      fixture.detectChanges();
      focusField();
      pressField();
      expect(expanded()).toBe('false');
      expect(fixture.componentInstance.requests).toHaveLength(0);
    });

    it('stays closed when a listener before it prevents the click', () => {
      fixture.detectChanges();
      fixture.nativeElement.addEventListener('click', (event: Event) => event.preventDefault(), {
        capture: true,
      });
      focusField();
      pressField();
      expect(expanded()).toBe('false');
      expect(fixture.componentInstance.requests).toHaveLength(0);
    });
  });

  describe('choosing with the pointer', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [SettleHost] }).compileComponents();
    });

    it('selects the option that was pressed, with a query in the field', () => {
      const fixture = TestBed.createComponent(SettleHost);
      fixture.detectChanges();

      field().focus();
      field().value = 'App';
      field().dispatchEvent(new Event('input'));
      fixture.detectChanges();

      pressOption(fixture, option('apple'));

      expect(fixture.componentInstance.requested()).toBe('apple');
      expect(document.activeElement).toBe(field());
      expect(fixture.componentInstance.refused()).toBeUndefined();
    });
  });

  describe('text that matches no option', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [SettleHost] }).compileComponents();
    });

    it('puts the field back to the committed value, and says what it refused', () => {
      const fixture = TestBed.createComponent(SettleHost);
      fixture.componentInstance.defaultValue.set('apple');
      fixture.componentInstance.inputText.set('Apple');
      fixture.detectChanges();

      field().value = 'appl';
      field().dispatchEvent(new Event('input'));
      fixture.detectChanges();
      field().dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();

      expect(field().value).toBe('Apple');
      expect(fixture.componentInstance.refused()).toBe('appl');
    });

    it('takes the text as the value when the field allows one of its own', () => {
      const fixture = TestBed.createComponent(SettleHost);
      fixture.componentInstance.allowsCustomValue.set(true);
      fixture.detectChanges();

      field().value = 'kumquat';
      field().dispatchEvent(new Event('input'));
      fixture.detectChanges();
      field().dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();

      expect(field().value).toBe('kumquat');
      expect(fixture.componentInstance.requested()).toBe('kumquat');
      expect(fixture.componentInstance.refused()).toBeUndefined();
    });

    it('commits an option a reader typed in full rather than refusing it', () => {
      const fixture = TestBed.createComponent(SettleHost);
      fixture.detectChanges();

      field().value = 'Apple';
      field().dispatchEvent(new Event('input'));
      fixture.detectChanges();
      field().dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();

      expect(fixture.componentInstance.requested()).toBe('apple');
      expect(field().value).toBe('Apple');
    });
  });

  describe('defaultValue', () => {
    let fixture: ComponentFixture<Host>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [Host, BoundHost] }).compileComponents();
      fixture = TestBed.createComponent(Host);
    });

    it('seeds an unbound value once, and leaves the text alone', () => {
      fixture.componentInstance.defaultValue.set('blueberry');
      fixture.detectChanges();

      const combobox = fixture.debugElement.children[0]?.componentInstance as SlCombobox;
      expect(combobox.value()).toBe('blueberry');
      expect(combobox.inputValue()).toBe('');
      expect(field().value).toBe('');
    });

    it('is not read again after init', () => {
      fixture.componentInstance.defaultValue.set('blueberry');
      fixture.detectChanges();
      fixture.componentInstance.defaultValue.set('raspberry');
      fixture.detectChanges();

      const combobox = fixture.debugElement.children[0]?.componentInstance as SlCombobox;
      expect(combobox.value()).toBe('blueberry');
    });

    it('yields to a value the consumer bound', () => {
      const bound = TestBed.createComponent(BoundHost);
      bound.detectChanges();

      const combobox = bound.debugElement.children[0]?.componentInstance as SlCombobox;
      expect(combobox.value()).toBe('blueberry');
      expect(bound.componentInstance.value).toBe('blueberry');
    });
  });
});

@Component({
  standalone: true,
  imports: [SlCombobox, SlComboboxItem],
  template: `
    <sl-combobox aria-label="Reviewer" [portal]="false">
      <sl-combobox-item value="amanda" label="Amanda Okoro" icon="person" />
      <sl-combobox-item value="norman" label="Norman Vaz" />
    </sl-combobox>
  `,
})
class IconHost {}

/** The first column holds the glyph the icon input names; no stylesheet fills it. */
describe('SlCombobox, the icon column', () => {
  it('draws the named glyph in the first column, and prints no name there', async () => {
    await TestBed.configureTestingModule({ imports: [IconHost] }).compileComponents();
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    field().focus();
    field().dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
    fixture.detectChanges();

    const item = (value: string) =>
      document.querySelector(`[data-part='item'][data-value='${value}']`);
    const column = item('amanda')?.querySelector("[data-part='icon']");
    expect(column?.querySelector("[data-ui='icon'] > svg")?.getAttribute('data-glyph')).toBe(
      'person',
    );
    expect(column?.textContent?.trim()).toBe('');
    expect(item('norman')?.querySelector("[data-part='icon']")).toBeNull();
  });
});

@Component({
  standalone: true,
  imports: [SlCombobox, SlComboboxItem, SlComboboxItemIcon],
  template: `
    <sl-combobox aria-label="Reviewer" [portal]="false">
      <sl-combobox-item value="amanda" label="Amanda Okoro">
        <span slComboboxItemIcon><span data-ui="avatar" data-ui-avatar="">AO</span></span>
      </sl-combobox-item>
      <sl-combobox-item value="norman" label="Norman Vaz" />
    </sl-combobox>
  `,
})
class ProjectedIconHost {}

/**
 * The first column also takes an element of the consumer's own, as React's
 * `icon` prop does: an avatar beside a person's name is artwork no glyph names.
 */
describe("SlCombobox, an icon of the consumer's own", () => {
  it('projects the element marked slComboboxItemIcon into the first column', async () => {
    await TestBed.configureTestingModule({ imports: [ProjectedIconHost] }).compileComponents();
    const fixture = TestBed.createComponent(ProjectedIconHost);
    fixture.detectChanges();
    field().focus();
    field().dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
    fixture.detectChanges();

    const item = (value: string) =>
      document.querySelector(`[data-part='item'][data-value='${value}']`);
    const first = item('amanda')?.firstElementChild;
    expect(first?.getAttribute('data-part')).toBe('icon');
    expect(first?.querySelector(":scope > [data-ui='avatar']")?.textContent).toBe('AO');
    expect(item('amanda')?.querySelectorAll("[data-part='icon']").length).toBe(1);
    expect(item('norman')?.querySelector("[data-part='icon']")).toBeNull();
  });
});

@Component({
  standalone: true,
  imports: [SlCombobox, SlComboboxItem],
  template: `
    <sl-combobox aria-label="Fruit" autoHighlight [portal]="false">
      <sl-combobox-item value="blueberry" label="Blueberry" />
      <sl-combobox-item value="raspberry" label="Raspberry" />
      <sl-combobox-item value="grapefruit" label="Grapefruit" />
    </sl-combobox>
  `,
})
class AutoHighlightHost {}

/**
 * The contract's focus.onOpen: the highlight goes to the selected option, to
 * the first when autoHighlight is set. A press opens the popup before the
 * reader types, so the typing after it must still leave a match under Enter.
 */
describe('SlCombobox, autoHighlight after a press', () => {
  it('highlights the first option on a press, and the first match as the reader types', async () => {
    await TestBed.configureTestingModule({ imports: [AutoHighlightHost] }).compileComponents();
    const fixture = TestBed.createComponent(AutoHighlightHost);
    fixture.detectChanges();
    field().focus();
    field().click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(field().getAttribute('aria-activedescendant')).toBe(option('blueberry').id);

    field().value = 'fruit';
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(field().getAttribute('aria-activedescendant')).toBe(option('grapefruit').id);

    field().dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    fixture.detectChanges();
    expect(field().value).toBe('Grapefruit');
  });
});

@Component({
  standalone: true,
  imports: [SlCombobox, SlComboboxItem],
  template: `
    <sl-combobox aria-label="Time zone" autocomplete="both" [portal]="false">
      <sl-combobox-item value="america-chicago" label="America/Chicago" />
      <sl-combobox-item value="europe-london" label="Europe/London" />
      <sl-combobox-item value="europe-berlin" label="Europe/Berlin" />
    </sl-combobox>
  `,
})
class CompletionHost {}

/**
 * autocomplete="both" completes the first match on every character the reader
 * adds, including the ones typed while the popup is already open: the first
 * match is read from the options the new query kept, not from the list before
 * it.
 */
describe('SlCombobox, inline completion while the popup is open', () => {
  const typeInto = async (fixture: ComponentFixture<unknown>, text: string) => {
    field().value = text;
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await Promise.resolve();
  };

  it('completes the first match after a press opened the popup', async () => {
    await TestBed.configureTestingModule({ imports: [CompletionHost] }).compileComponents();
    const fixture = TestBed.createComponent(CompletionHost);
    fixture.detectChanges();
    field().focus();
    field().click();
    fixture.detectChanges();

    await typeInto(fixture, 'eu');
    expect(field().value).toBe('Europe/London');
    expect(field().selectionStart).toBe(2);
  });

  it('completes again on the second character typed', async () => {
    await TestBed.configureTestingModule({ imports: [CompletionHost] }).compileComponents();
    const fixture = TestBed.createComponent(CompletionHost);
    fixture.detectChanges();
    field().focus();

    await typeInto(fixture, 'e');
    await typeInto(fixture, 'eu');
    expect(field().value).toBe('Europe/London');
  });
});

/**
 * The name is the input's: it is the element with the combobox role. The root
 * is a generic element, which ARIA 1.2 does not let be named, and React's
 * \`Combobox\` root carries no name.
 */
describe('SlCombobox, the accessible name', () => {
  it('names the input and leaves the root unnamed', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const root = document.querySelector('[data-ui="combobox"]') as HTMLElement;
    expect(field().getAttribute('aria-label')).toBe('Fruit');
    expect(root.hasAttribute('aria-label')).toBe(false);
  });
});

/** The words come from the language in force, and follow a change of it in place. */
describe('SlCombobox, the language in force', () => {
  it('speaks pt-BR, and follows a change of locale without being created again', async () => {
    const locale = signal('pt-BR');
    await TestBed.configureTestingModule({
      imports: [IconHost],
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    }).compileComponents();
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    const trigger = () => document.querySelector("[data-part='trigger']");

    // language: pt-BR
    expect(trigger()?.getAttribute('aria-label')).toBe('Mostrar opções');
    // language: en-US

    locale.set('en-US');
    fixture.detectChanges();
    expect(trigger()?.getAttribute('aria-label')).toBe('Show options');
  });
});

const MANY = Array.from({ length: 40 }, (_, index) => ({
  value: `v${index}`,
  label: `Option ${index}`,
}));

@Component({
  standalone: true,
  imports: [SlCombobox, SlComboboxItem],
  template: `
    <sl-combobox aria-label="Many" [portal]="false" [(open)]="open">
      @for (row of rows; track row.value) {
        <sl-combobox-item [value]="row.value" [label]="row.label" />
      }
    </sl-combobox>
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
describe('SlCombobox, the cost of a long list', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ManyHost] }).compileComponents();
  });

  it('reads the collection a bounded number of times to open and to move the highlight', async () => {
    const reads = vi.spyOn(SlCombobox.prototype, 'options');
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
