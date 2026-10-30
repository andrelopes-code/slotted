import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/listbox/contract.json';
import { SlListbox } from './listbox';
import { provideListboxDefaults } from './listbox-defaults';
import type { ListboxActiveRequest, ListboxChangeRequest } from './listbox';
import {
  SlListboxEmpty,
  SlListboxGroup,
  SlListboxIcon,
  SlListboxIndicator,
  SlListboxLabel,
  SlListboxLoader,
  SlListboxMeta,
  SlListboxOption,
  SlListboxOptionContent,
} from './listbox-parts';

const REGIONS = ['africa', 'asia', 'europe', 'oceania', 'americas'];

const CITIES = [
  { id: 'oslo', name: 'Oslo' },
  { id: 'bergen', name: 'Bergen' },
  { id: 'tromso', name: 'Tromsø' },
];

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlGlyph,
    SlIcon,
    SlListbox,
    SlListboxEmpty,
    SlListboxGroup,
    SlListboxIcon,
    SlListboxIndicator,
    SlListboxLabel,
    SlListboxLoader,
    SlListboxMeta,
    SlListboxOption,
    SlListboxOptionContent,
  ],
  template: `<div slListbox></div>`,
})
class Host {
  readonly regions = REGIONS;
  readonly cities = CITIES;
  readonly control = new FormControl<string | null>(null);
  readonly requests: ListboxChangeRequest[] = [];
  readonly activeRequests: ListboxActiveRequest[] = [];
  readonly loadMoreCalls: number[] = [];
  disabledKeys: string[] = [];
  value: string | readonly string[] | null | undefined = undefined;
  activeKey: string | null | undefined = undefined;

  readonly cityKey = (city: { id: string }) => city.id;
  readonly cityLabel = (city: { name: string }) => city.name;

  record(request: ListboxChangeRequest) {
    this.requests.push(request);
  }

  recordActive(request: ListboxActiveRequest) {
    this.activeRequests.push(request);
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

const box = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-ui="listbox"]') as HTMLElement;
const options = (fixture: Fixture) => [
  ...box(fixture).querySelectorAll<HTMLElement>('[data-part="option"]'),
];
const byKey = (fixture: Fixture, key: string) =>
  box(fixture).querySelector<HTMLElement>(`[data-key="${key}"]`) as HTMLElement;

const OPTIONS = `@for (region of regions; track region) {
  <div slListboxOption [value]="region" [disabled]="disabledKeys.includes(region)">
    <span slListboxIndicator></span>
    <span slListboxLabel>{{ region }}</span>
  </div>
}`;

const press = (element: HTMLElement, init: MouseEventInit = {}) => {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }));
};

const key = (fixture: Fixture, init: KeyboardEventInit) => {
  box(fixture).dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
  fixture.detectChanges();
};

const focusIn = (fixture: Fixture) => {
  const element = box(fixture);
  element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  fixture.detectChanges();
};

describe('SlListbox, identity and wiring', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);

    expect(box(fixture).tagName).toBe('DIV');
    expect(box(fixture)).toHaveProperty('dataset.ui', 'listbox');
    expect(box(fixture).getAttribute('role')).toBe('listbox');
    expect(options(fixture)).toHaveLength(5);
    expect(options(fixture)[0]?.getAttribute('role')).toBe('option');
  });

  /** The option's own artwork is content the column holds; no stylesheet fills it. */
  it('holds the artwork it is given in the icon column', () => {
    const fixture = renderTemplate(`<div slListbox aria-label="Region">
      <div slListboxOption value="europe">
        <span slListboxIcon><span slIcon><svg slGlyph name="dot"></svg></span></span>
        <span slListboxLabel>europe</span>
      </div>
    </div>`);
    const mark = byKey(fixture, 'europe').querySelector(
      '[data-part="icon"] > [data-ui="icon"] > svg',
    );
    expect(mark?.getAttribute('data-glyph')).toBe('dot');
  });

  /** The tick is an element, not a mask: an svg glyph inside the icon box. */
  it('draws the tick as a check glyph inside the indicator', () => {
    const fixture = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);
    const indicator = options(fixture)[0]?.querySelector('[data-part="indicator"]');
    expect(indicator?.querySelector('[data-ui="icon"] > svg[data-glyph="check"]')).not.toBeNull();
  });

  it('declares the axes it was given, so a stylesheet can reach every one', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" size="lg" variant="plain" orientation="horizontal" indicator="none">${OPTIONS}</div>`,
    );

    expect(box(fixture).getAttribute('data-size')).toBe('lg');
    expect(box(fixture).getAttribute('data-variant')).toBe('plain');
    expect(box(fixture).getAttribute('data-orientation')).toBe('horizontal');
    expect(box(fixture).getAttribute('data-indicator')).toBe('none');
    expect(box(fixture).getAttribute('aria-orientation')).toBe('horizontal');
  });

  /** `vertical` is the role's own default, so writing it says nothing twice. */
  it('writes aria-orientation only when the options are not vertical', () => {
    const fixture = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);
    expect(box(fixture).getAttribute('aria-orientation')).toBeNull();
  });

  it('says it takes more than one choice only when it does', () => {
    const single = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);
    expect(box(single).getAttribute('aria-multiselectable')).toBeNull();

    const multiple = renderTemplate(
      `<div slListbox aria-label="Region" selectionMode="multiple">${OPTIONS}</div>`,
    );
    expect(box(multiple).getAttribute('aria-multiselectable')).toBe('true');
  });

  /** The pattern forbids a listbox that carries both attributes. */
  it('indicates selection with aria-selected and never with aria-checked', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" defaultValue="europe">${OPTIONS}</div>`,
    );

    expect(byKey(fixture, 'europe').getAttribute('aria-selected')).toBe('true');
    expect(byKey(fixture, 'africa').getAttribute('aria-selected')).toBe('false');
    for (const option of options(fixture)) {
      expect(option.getAttribute('aria-checked')).toBeNull();
    }
  });

  it('keeps a role the consumer wrote themselves', () => {
    const fixture = renderTemplate(
      `<div slListbox role="tablist" aria-label="Region">${OPTIONS}</div>`,
    );
    expect(box(fixture).getAttribute('role')).toBe('tablist');
  });
});

describe('SlListbox, selection', () => {
  /**
   * CB11 verified from this family's side: the root holds focus and
   * `aria-activedescendant` names the option, so the option refuses the press
   * that would take focus off it. The rule was already here; this is its guard.
   */
  it('refuses the press that would move focus off the root', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" defaultValue="africa">${OPTIONS}</div>`,
    );

    const moved = byKey(fixture, 'europe').dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
    );

    expect(moved).toBe(false);
    press(byKey(fixture, 'europe'));
    fixture.detectChanges();
    expect(byKey(fixture, 'europe').hasAttribute('data-selected')).toBe(true);
  });

  it('replaces whatever was chosen, in single selection', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" defaultValue="africa">${OPTIONS}</div>`,
    );

    press(byKey(fixture, 'europe'));
    fixture.detectChanges();
    expect(byKey(fixture, 'europe').hasAttribute('data-selected')).toBe(true);
    expect(byKey(fixture, 'africa').hasAttribute('data-selected')).toBe(false);
  });

  it('lets the reader unchoose, unless the consumer refuses it', () => {
    const free = renderTemplate(
      `<div slListbox aria-label="Region" defaultValue="europe">${OPTIONS}</div>`,
    );
    press(byKey(free, 'europe'));
    free.detectChanges();
    expect(byKey(free, 'europe').hasAttribute('data-selected')).toBe(false);

    const held = renderTemplate(
      `<div slListbox aria-label="Region" defaultValue="europe" disallowEmptySelection>${OPTIONS}</div>`,
    );
    press(byKey(held, 'europe'));
    held.detectChanges();
    expect(byKey(held, 'europe').hasAttribute('data-selected')).toBe(true);
  });

  it('adds and removes one at a time in multiple selection', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" selectionMode="multiple">${OPTIONS}</div>`,
    );

    press(byKey(fixture, 'asia'));
    fixture.detectChanges();
    press(byKey(fixture, 'europe'));
    fixture.detectChanges();
    expect(byKey(fixture, 'asia').hasAttribute('data-selected')).toBe(true);
    expect(byKey(fixture, 'europe').hasAttribute('data-selected')).toBe(true);
  });

  it('selects a range from the anchor with Shift held', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" selectionMode="multiple">${OPTIONS}</div>`,
    );

    press(byKey(fixture, 'asia'));
    fixture.detectChanges();
    press(byKey(fixture, 'oceania'), { shiftKey: true });
    fixture.detectChanges();
    for (const held of ['asia', 'europe', 'oceania']) {
      expect(byKey(fixture, held).hasAttribute('data-selected')).toBe(true);
    }
    expect(byKey(fixture, 'africa').hasAttribute('data-selected')).toBe(false);
  });

  /** The pattern's optional shortcut, and its optional second half. */
  it('selects everything with the accelerator, and clears on the second press', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" selectionMode="multiple">${OPTIONS}</div>`,
    );

    key(fixture, { key: 'a', ctrlKey: true });
    expect(options(fixture).every((option) => option.hasAttribute('data-selected'))).toBe(true);

    key(fixture, { key: 'a', ctrlKey: true });
    expect(options(fixture).some((option) => option.hasAttribute('data-selected'))).toBe(false);
  });

  it('makes a plain press the whole selection under the alternative model', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" selectionMode="multiple" selectionBehavior="replace">${OPTIONS}</div>`,
    );

    press(byKey(fixture, 'asia'));
    fixture.detectChanges();
    press(byKey(fixture, 'europe'));
    fixture.detectChanges();
    expect(byKey(fixture, 'asia').hasAttribute('data-selected')).toBe(false);

    press(byKey(fixture, 'africa'), { ctrlKey: true });
    fixture.detectChanges();
    expect(byKey(fixture, 'europe').hasAttribute('data-selected')).toBe(true);
    expect(byKey(fixture, 'africa').hasAttribute('data-selected')).toBe(true);
  });
});

describe('SlListbox, the keyboard', () => {
  it('lands on the chosen option when focus arrives, and on the first when none is', () => {
    const chosen = renderTemplate(
      `<div slListbox aria-label="Region" defaultValue="europe">${OPTIONS}</div>`,
    );
    focusIn(chosen);
    expect(byKey(chosen, 'europe').hasAttribute('data-current')).toBe(true);

    const empty = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);
    focusIn(empty);
    expect(byKey(empty, 'africa').hasAttribute('data-current')).toBe(true);
  });

  it('moves along the block axis and stops at the ends', () => {
    const fixture = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);
    focusIn(fixture);

    key(fixture, { key: 'ArrowDown' });
    expect(byKey(fixture, 'asia').hasAttribute('data-current')).toBe(true);

    key(fixture, { key: 'ArrowUp' });
    key(fixture, { key: 'ArrowUp' });
    expect(byKey(fixture, 'africa').hasAttribute('data-current')).toBe(true);
  });

  it('wraps only when the consumer asked it to', () => {
    const fixture = renderTemplate(`<div slListbox aria-label="Region" loop>${OPTIONS}</div>`);
    focusIn(fixture);

    key(fixture, { key: 'ArrowUp' });
    expect(byKey(fixture, 'americas').hasAttribute('data-current')).toBe(true);
  });

  it('goes to the ends, and travels a page at a time', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" pageSize="3">${OPTIONS}</div>`,
    );
    focusIn(fixture);

    key(fixture, { key: 'End' });
    expect(byKey(fixture, 'americas').hasAttribute('data-current')).toBe(true);

    key(fixture, { key: 'Home' });
    expect(byKey(fixture, 'africa').hasAttribute('data-current')).toBe(true);

    key(fixture, { key: 'PageDown' });
    expect(byKey(fixture, 'oceania').hasAttribute('data-current')).toBe(true);
  });

  it('chooses the active option with Space and with Enter', () => {
    const space = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);
    focusIn(space);
    key(space, { key: ' ' });
    expect(byKey(space, 'africa').hasAttribute('data-selected')).toBe(true);

    const enter = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);
    focusIn(enter);
    key(enter, { key: 'Enter' });
    expect(byKey(enter, 'africa').hasAttribute('data-selected')).toBe(true);
  });

  it('moves and toggles with Shift and an arrow', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" selectionMode="multiple">${OPTIONS}</div>`,
    );
    focusIn(fixture);

    key(fixture, { key: 'ArrowDown', shiftKey: true });
    expect(byKey(fixture, 'asia').hasAttribute('data-selected')).toBe(true);
    expect(byKey(fixture, 'africa').hasAttribute('data-selected')).toBe(false);
  });

  it('finds an option by the characters typed at it', () => {
    const fixture = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);
    focusIn(fixture);

    key(fixture, { key: 'e' });
    expect(byKey(fixture, 'europe').hasAttribute('data-current')).toBe(true);
  });

  /** A row is `columns` options away, which is one number rather than a layout read. */
  it('steps a row at a time in a two-dimensional arrangement', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" columns="2">${OPTIONS}</div>`,
    );
    focusIn(fixture);

    key(fixture, { key: 'ArrowDown' });
    expect(byKey(fixture, 'europe').hasAttribute('data-current')).toBe(true);
    key(fixture, { key: 'ArrowRight' });
    expect(byKey(fixture, 'oceania').hasAttribute('data-current')).toBe(true);
    expect(box(fixture).getAttribute('data-layout')).toBe('grid');
  });

  it('moves the selection with focus only when asked', () => {
    const quiet = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);
    focusIn(quiet);
    key(quiet, { key: 'ArrowDown' });
    expect(byKey(quiet, 'asia').hasAttribute('data-selected')).toBe(false);

    const following = renderTemplate(
      `<div slListbox aria-label="Region" selectOnFocus>${OPTIONS}</div>`,
    );
    focusIn(following);
    key(following, { key: 'ArrowDown' });
    expect(byKey(following, 'asia').hasAttribute('data-selected')).toBe(true);
  });
});

describe('SlListbox, disabled and read-only', () => {
  const withDisabled = (extra = '') =>
    renderTemplate(
      `<div slListbox aria-label="Region" ${extra}>
        @for (region of regions; track region) {
          <div slListboxOption [value]="region" [disabled]="region === 'asia'">
            <span slListboxLabel>{{ region }}</span>
          </div>
        }
      </div>`,
    );

  it('keeps a disabled option in the set and skips it by default', () => {
    const fixture = withDisabled();
    focusIn(fixture);

    expect(byKey(fixture, 'asia').getAttribute('aria-disabled')).toBe('true');
    expect(byKey(fixture, 'asia').hasAttribute('disabled')).toBe(false);
    key(fixture, { key: 'ArrowDown' });
    expect(byKey(fixture, 'europe').hasAttribute('data-current')).toBe(true);
  });

  it('lands on a disabled option when discoverability matters more', () => {
    const fixture = withDisabled('navigateDisabled');
    focusIn(fixture);

    key(fixture, { key: 'ArrowDown' });
    expect(byKey(fixture, 'asia').hasAttribute('data-current')).toBe(true);
    expect(byKey(fixture, 'asia').hasAttribute('data-selected')).toBe(false);
  });

  it('never chooses a disabled option, however it is pressed', () => {
    const fixture = withDisabled();
    press(byKey(fixture, 'asia'));
    fixture.detectChanges();
    expect(byKey(fixture, 'asia').hasAttribute('data-selected')).toBe(false);
  });

  /** `readonly` stays reachable; it is not `disabled` in a grey coat. */
  it('refuses a change while keeping every option reachable', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" readOnly defaultValue="africa">${OPTIONS}</div>`,
    );

    expect(box(fixture).getAttribute('aria-readonly')).toBe('true');
    press(byKey(fixture, 'asia'));
    fixture.detectChanges();
    expect(byKey(fixture, 'asia').hasAttribute('data-selected')).toBe(false);
    expect(byKey(fixture, 'asia').hasAttribute('data-current')).toBe(true);
  });

  it('answers nothing at all while the whole control is disabled', () => {
    const fixture = renderTemplate(`<div slListbox aria-label="Region" disabled>${OPTIONS}</div>`);

    expect(box(fixture).getAttribute('aria-disabled')).toBe('true');
    press(byKey(fixture, 'asia'));
    fixture.detectChanges();
    expect(byKey(fixture, 'asia').hasAttribute('data-selected')).toBe(false);
  });
});

describe('SlListbox, the controlled and uncontrolled pair', () => {
  it('waits for the consumer while it is controlled', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" [value]="'africa'" (valueChange)="record($event)">${OPTIONS}</div>`,
    );

    press(byKey(fixture, 'asia'));
    fixture.detectChanges();
    expect(byKey(fixture, 'africa').hasAttribute('data-selected')).toBe(true);
    expect(byKey(fixture, 'asia').hasAttribute('data-selected')).toBe(false);
    expect(fixture.componentInstance.requests).toHaveLength(1);
  });

  it('carries the reason, the value it replaces, and one key rather than a set', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" defaultValue="africa" (valueChange)="record($event)">${OPTIONS}</div>`,
    );

    press(byKey(fixture, 'asia'));
    fixture.detectChanges();
    const request = fixture.componentInstance.requests[0];
    expect(request?.reason).toBe('pointer');
    expect(request?.previous).toBe('africa');
    expect(request?.value).toBe('asia');
  });

  it('reports the set in the collection order in multiple selection', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" selectionMode="multiple" (valueChange)="record($event)">${OPTIONS}</div>`,
    );

    press(byKey(fixture, 'oceania'));
    fixture.detectChanges();
    press(byKey(fixture, 'africa'));
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)?.value).toEqual(['africa', 'oceania']);
  });

  it('holds the active option as a value of its own', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" [activeKey]="'europe'" (activeKeyChange)="recordActive($event)">${OPTIONS}</div>`,
    );

    expect(byKey(fixture, 'europe').hasAttribute('data-current')).toBe(true);
    key(fixture, { key: 'ArrowDown' });
    expect(fixture.componentInstance.activeRequests.at(-1)?.value).toBe('oceania');
    expect(byKey(fixture, 'europe').hasAttribute('data-current')).toBe(true);
  });
});

describe('SlListbox, the focus model', () => {
  it('roves the tab stop while the whole set is in the DOM', () => {
    const fixture = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);

    expect(box(fixture).getAttribute('data-focus-mode')).toBe('roving');
    expect(box(fixture).getAttribute('tabindex')).toBe('0');

    focusIn(fixture);
    expect(byKey(fixture, 'africa').getAttribute('tabindex')).toBe('0');
    expect(byKey(fixture, 'asia').getAttribute('tabindex')).toBe('-1');
    expect(box(fixture).getAttribute('aria-activedescendant')).toBeNull();
  });

  /**
   * The whole reason the axis exists: an element carrying `tabindex="0"` that
   * is recycled out of the DOM takes focus to the body with it.
   */
  it('names the active option instead of roving once the set is windowed', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Cities" virtual itemSize="32" [items]="cities" [getKey]="cityKey" [getLabel]="cityLabel" defaultActiveKey="bergen">
        <ng-template slListboxOptionContent let-city>
          <span slListboxLabel>{{ city.name }}</span>
        </ng-template>
      </div>`,
    );

    expect(box(fixture).getAttribute('data-focus-mode')).toBe('activedescendant');
    expect(box(fixture).getAttribute('tabindex')).toBe('0');
    expect(box(fixture).getAttribute('aria-activedescendant')).toBe(byKey(fixture, 'bergen').id);
  });

  it('takes the model the consumer states over the one it would have read', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" focusMode="activedescendant" defaultActiveKey="asia">${OPTIONS}</div>`,
    );

    expect(box(fixture).getAttribute('data-focus-mode')).toBe('activedescendant');
    expect(box(fixture).getAttribute('aria-activedescendant')).toBe(byKey(fixture, 'asia').id);
  });
});

describe('SlListbox, a collection it was handed', () => {
  const cities = (extra = '') =>
    renderTemplate(
      `<div slListbox aria-label="Cities" [items]="cities" [getKey]="cityKey" [getLabel]="cityLabel" ${extra}>
        <ng-template slListboxOptionContent let-city>
          <span slListboxLabel>{{ city.name }}</span>
        </ng-template>
      </div>`,
    );

  it('renders one option per item, keyed by what the consumer said', () => {
    const fixture = cities();
    expect(options(fixture)).toHaveLength(3);
    expect(byKey(fixture, 'tromso').textContent).toContain('Tromsø');
  });

  /**
   * The pattern asks for the pair exactly when the whole set is not in the DOM,
   * which is what a `totalCount` says and what windowing produces.
   */
  it('tells the reader how large the set is when only part of it has loaded', () => {
    const fixture = cities('totalCount="4000"');
    expect(byKey(fixture, 'oslo').getAttribute('aria-setsize')).toBe('4000');
    expect(byKey(fixture, 'tromso').getAttribute('aria-posinset')).toBe('3');
  });

  it('writes neither when the whole set is already in the DOM', () => {
    const fixture = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);
    expect(options(fixture)[0]?.getAttribute('aria-setsize')).toBeNull();
    expect(options(fixture)[0]?.getAttribute('aria-posinset')).toBeNull();
  });

  it('names a group built from a collection, and keeps the two index spaces apart', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Fruit" [sections]="[{ key: 'pome', label: 'Pome', items: [{ id: 'apple', name: 'Apple' }] }, { key: 'berry', label: 'Berry', items: [{ id: 'fig', name: 'Fig' }] }]" [getKey]="cityKey" [getLabel]="cityLabel" totalCount="2">
        <ng-template slListboxOptionContent let-item>
          <span slListboxLabel>{{ item.name }}</span>
        </ng-template>
      </div>`,
    );

    const groups = [...box(fixture).querySelectorAll<HTMLElement>('[data-part="group"]')];
    expect(groups).toHaveLength(2);
    expect(groups[0]?.getAttribute('role')).toBe('group');
    expect(groups[0]?.querySelector('[data-part="group-label"]')?.textContent?.trim()).toBe('Pome');
    expect(byKey(fixture, 'fig').getAttribute('aria-posinset')).toBe('2');
  });
});

describe('SlListbox, forms', () => {
  it('is a Reactive Forms control, writing and reading a scalar in single selection', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" [formControl]="control">${OPTIONS}</div>`,
    );

    fixture.componentInstance.control.setValue('europe');
    fixture.detectChanges();
    expect(byKey(fixture, 'europe').hasAttribute('data-selected')).toBe(true);

    press(byKey(fixture, 'asia'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('asia');
  });

  it('answers the form when the form disables it', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" [formControl]="control">${OPTIONS}</div>`,
    );

    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(box(fixture).getAttribute('aria-disabled')).toBe('true');
  });

  /** "Choose one" is a fact about the collection and about no single option. */
  it('owns the required validity the set has and an option cannot see', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" required [formControl]="control">${OPTIONS}</div>`,
    );

    expect(fixture.componentInstance.control.errors).toEqual({ required: true });
    press(byKey(fixture, 'asia'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.errors).toBeNull();
  });

  it('says it is required and invalid when it is', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Region" required invalid>${OPTIONS}</div>`,
    );

    expect(box(fixture).getAttribute('aria-required')).toBe('true');
    expect(box(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(box(fixture).hasAttribute('data-required')).toBe(true);
    expect(box(fixture).hasAttribute('data-invalid')).toBe(true);
  });
});

describe('SlListbox, composition and escape hatches', () => {
  it('takes an application default and still lets an instance win', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="One">${OPTIONS}</div>
       <div slListbox aria-label="Two" size="lg">${OPTIONS}</div>`,
      [provideListboxDefaults({ size: 'sm', variant: 'plain' })],
    );

    const boxes = [
      ...fixture.nativeElement.querySelectorAll('[data-ui="listbox"]'),
    ] as HTMLElement[];
    expect(boxes[0]?.getAttribute('data-size')).toBe('sm');
    expect(boxes[0]?.getAttribute('data-variant')).toBe('plain');
    expect(boxes[1]?.getAttribute('data-size')).toBe('lg');
  });

  it('reaches the instance from the template, and the three imperative actions', () => {
    const fixture = renderTemplate(
      `<div slListbox #listbox="slListbox" aria-label="Region" defaultActiveKey="europe">${OPTIONS}</div>`,
    );

    const instance = fixture.debugElement
      .query((node: { name: string }) => node.name === 'div')
      .injector.get(SlListbox);
    expect(instance.getActiveKey()).toBe('europe');
    instance.scrollToKey('asia');
    expect(box(fixture).getAttribute('data-focus-mode')).toBe('roving');
  });

  it('names the group a consumer wrote, and holds its options inside it', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Fruit">
        <div slListboxGroup label="Pome">
          <div slListboxOption value="apple"><span slListboxLabel>Apple</span></div>
        </div>
      </div>`,
    );

    const group = box(fixture).querySelector<HTMLElement>('[data-part="group"]') as HTMLElement;
    expect(group.getAttribute('role')).toBe('group');
    const labelId = group.getAttribute('aria-labelledby');
    expect(group.querySelector(`#${labelId}`)?.textContent?.trim()).toBe('Pome');
  });

  it('renders the message and the loader as the parts the contract declares', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Results">
        <div slListboxEmpty>No region matches that name.</div>
        <div slListboxLoader>Loading more…</div>
      </div>`,
    );

    expect(box(fixture).querySelector('[data-part="empty"]')?.textContent).toContain('No region');
    const loader = box(fixture).querySelector<HTMLElement>('[data-part="loader"]') as HTMLElement;
    expect(loader.getAttribute('role')).toBe('option');
    expect(loader.getAttribute('aria-disabled')).toBe('true');
  });

  it('carries the option value and the label a reader hears', () => {
    const fixture = renderTemplate(
      `<div slListbox aria-label="Plans">
        <div slListboxOption value="pro" textValue="Professional">
          <span slListboxLabel>Pro</span>
          <span slListboxMeta>$20</span>
        </div>
      </div>`,
    );

    expect(byKey(fixture, 'pro').dataset['textValue']).toBe('Professional');
    expect(byKey(fixture, 'pro').querySelector('[data-part="meta"]')?.textContent).toBe('$20');
  });
});

describe('SlListbox, the contract it answers', () => {
  it('agrees with the contract about its defaults', () => {
    const fixture = renderTemplate(`<div slListbox aria-label="Region">${OPTIONS}</div>`);
    const declared = contract.members.listbox.defaults;

    expect(box(fixture).getAttribute('data-size')).toBe(declared.size);
    expect(box(fixture).getAttribute('data-variant')).toBe(declared.variant);
    expect(box(fixture).getAttribute('data-orientation')).toBe(declared.orientation);
    expect(box(fixture).getAttribute('data-indicator')).toBe(declared.indicator);
    expect(box(fixture).getAttribute('data-focus-mode')).toBe('roving');
  });
});
