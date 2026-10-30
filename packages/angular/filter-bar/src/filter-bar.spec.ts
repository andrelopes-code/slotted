import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { serializeFilterGroup } from '@slotted/core/filter';
import type { FilterGroup, FilterRule } from '@slotted/core/filter';
import type { FilterBarMessages, PartialMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/filter-bar/contract.json';
import { SlFilterBar, SlFilterBarEnd, SlFilterBarOperand } from './filter-bar';
import {
  provideFilterBarDefaults,
  type FilterBarField,
  type FilterBarPreset,
} from './filter-bar.constants';

const FIELDS: FilterBarField[] = [
  {
    icon: 'circle',
    key: 'status',
    kind: 'set',
    label: 'Status',
    options: [
      { label: 'Paid', value: 'paid' },
      { label: 'Refunded', value: 'refunded' },
      { label: 'Draft', value: 'draft' },
    ],
    pinned: true,
  },
  { key: 'owner', kind: 'text', label: 'Owner', pinned: true },
  { key: 'amount', kind: 'number', label: 'Amount' },
  { key: 'customer', kind: 'text', label: 'Customer' },
  { key: 'created', kind: 'date', label: 'Created', section: 'Dates' },
  { key: 'note', kind: 'boolean', label: 'Has note' },
];

const TREE: FilterGroup = {
  join: 'and',
  rules: [
    {
      field: 'status',
      filter: { kind: 'set', join: 'and', conditions: [{ operator: 'anyOf', value: ['paid'] }] },
    },
    {
      field: 'amount',
      filter: {
        kind: 'number',
        join: 'and',
        conditions: [{ operator: 'greaterThan', value: 100 }],
      },
    },
    {
      field: 'customer',
      filter: { kind: 'text', join: 'and', conditions: [{ operator: 'contains', value: 'ana' }] },
    },
  ],
};

@Component({
  imports: [SlFilterBar, SlFilterBarEnd, SlFilterBarOperand],
  template: `<div
    slFilterBar
    #bar="slFilterBar"
    [fields]="fields()"
    [(value)]="value"
    [(query)]="query"
    [(preset)]="preset"
    [(open)]="open"
    [(revealed)]="revealed"
    [presets]="presets()"
    [apply]="apply()"
    [chipLimit]="chipLimit()"
    [queryDelay]="queryDelay()"
    [shortcut]="shortcut()"
    [count]="count()"
    [total]="total()"
    [loading]="loading()"
    [readOnly]="readOnly()"
    [messages]="messages()"
    (valueChangeRequest)="onValue($event)"
    (queryChangeRequest)="onQuery($event)"
    (presetChangeRequest)="onPreset($event)"
    (openChangeRequest)="onOpen($event)"
    (revealedChangeRequest)="onRevealed($event)"
  >
    <button slFilterBarEnd type="button">Sort</button>
  </div>`,
})
class TestHost {
  readonly fields = signal<FilterBarField[]>(FIELDS);
  readonly value = signal<FilterGroup | null>(TREE);
  readonly query = signal('');
  readonly preset = signal<string | null>(null);
  readonly open = signal(false);
  readonly revealed = signal(false);
  readonly presets = signal<FilterBarPreset[] | undefined>(undefined);
  readonly apply = signal<'live' | 'manual' | undefined>(undefined);
  readonly chipLimit = signal<number | undefined>(undefined);
  readonly queryDelay = signal<number | undefined>(undefined);
  readonly shortcut = signal<string | null | undefined>(undefined);
  readonly count = signal<number | undefined>(128);
  readonly total = signal<number | undefined>(3412);
  readonly loading = signal(false);
  readonly readOnly = signal(false);
  readonly messages = signal<PartialMessages<FilterBarMessages> | undefined>(undefined);
  readonly onValue = vi.fn();
  readonly onQuery = vi.fn();
  readonly onPreset = vi.fn();
  readonly onOpen = vi.fn();
  readonly onRevealed = vi.fn();
}

function setup(providers: unknown[] = [], prepare?: (host: TestHost) => void) {
  TestBed.configureTestingModule({ imports: [TestHost], providers: providers as never[] });
  const fixture = TestBed.createComponent(TestHost);
  prepare?.(fixture.componentInstance);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector(
    '[data-ui="filter-bar"][data-part="root"]',
  ) as HTMLElement;
  const part = (name: string) => root.querySelector(`[data-part="${name}"]`) as HTMLElement;
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    part,
    parts: (name: string) => [...root.querySelectorAll(`[data-part="${name}"]`)] as HTMLElement[],
    chip: (field: string) =>
      root.querySelector(`[data-part="chip"][data-field="${field}"]`) as HTMLElement,
    settle: () => fixture.detectChanges(),
    builder: () =>
      document.querySelector('[data-ui="filter-bar"][data-part="builder"]') as HTMLElement,
  };
}

const text = (element: Element | null | undefined) => element?.textContent?.trim();

const segment = (chip: HTMLElement, name: string) =>
  chip.querySelector(`[data-part="${name}"]`) as HTMLElement;

const removeOf = (root: HTMLElement, label: string) =>
  root.querySelector(`[data-part="chip-remove"][aria-label="Remove ${label}"]`) as HTMLElement;

const press = (target: Element, key: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }));

/** An item of the menu that is open now, by its role and its words. */
const menuItem = (role: 'menuitem' | 'menuitemradio', name: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-ui="menu"][data-open] [role="${role}"]`)].find(
    (item) => text(item) === name,
  ) as HTMLElement;

const glyph = (host: Element | null) =>
  host?.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');

describe('SlFilterBar', () => {
  it('is selected in public by the family identifier, and is a search landmark holding one toolbar of chips', () => {
    const { root, part, parts } = setup();
    expect(root.getAttribute('data-ui')).toBe(contract.ui);
    expect(root.getAttribute('role')).toBe('search');
    expect(root.getAttribute('aria-label')).toBe('Filter');
    expect(part('bar').getAttribute('role')).toBe('toolbar');
    expect(part('bar').getAttribute('aria-label')).toBe('Filters');
    expect(root.querySelector('[role="grid"]')).toBeNull();
    for (const name of [
      'frame',
      'search',
      'pill',
      'add',
      'clear',
      'chip',
      'chip-field',
      'chip-operator',
      'chip-value',
      'chip-remove',
      'count',
      'summary',
      'end',
    ]) {
      expect(part(name)).not.toBeNull();
    }
    for (const chip of parts('chip')) expect(chip.parentElement).toBe(part('bar'));
    /* The consumer's control survives in the end slot. */
    expect(part('end').textContent).toContain('Sort');
    /* A button of this family's carries its part over the button directive's. */
    expect(part('add').getAttribute('data-ui')).toBe('button');
  });

  it('writes a condition as a chip of segments, and a pinned field without one as a pill', () => {
    const { chip, parts, root } = setup();
    const status = chip('status');
    const amount = chip('amount');
    expect(status.getAttribute('role')).toBe('group');
    expect(status.hasAttribute('data-pinned')).toBe(true);
    expect(amount.hasAttribute('data-pinned')).toBe(false);
    expect(amount.getAttribute('aria-label')).toBe('Amount: greater than 100');
    expect(text(segment(amount, 'chip-field'))).toBe('Amount');
    expect(text(segment(amount, 'chip-operator'))).toBe('greater than');
    expect(segment(amount, 'chip-operator').getAttribute('aria-haspopup')).toBe('menu');
    const value = segment(amount, 'chip-value');
    expect(value.getAttribute('aria-haspopup')).toBe('dialog');
    expect(value.getAttribute('aria-label')).toBe('greater than 100');
    expect(text(value.querySelector('[data-value]'))).toBe('100');
    expect(removeOf(root, 'Amount')).not.toBeNull();
    /* The field's glyph stands before its name, and the field segment is never a stop. */
    expect(
      status.querySelector('[data-part="chip-field"] svg[data-glyph]')?.getAttribute('data-glyph'),
    ).toBe('circle');
    expect(segment(status, 'chip-field').querySelector('button, [tabindex]')).toBeNull();
    const pills = parts('pill');
    expect(pills.map((pill) => text(pill))).toEqual(['Owner']);
    expect(pills[0]!.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('holds one tab stop for the whole bar, and walks every segment with the arrows', () => {
    const { part } = setup();
    const stops = () => [...part('bar').querySelectorAll<HTMLElement>('[tabindex]')];
    expect(stops().filter((stop) => stop.getAttribute('tabindex') === '0')).toHaveLength(1);
    const first = stops().find((stop) => stop.getAttribute('tabindex') === '0')!;
    first.focus();
    const walked = [first.getAttribute('data-part')];
    for (let step = 0; step < 5; step += 1) {
      press(document.activeElement!, 'ArrowRight');
      walked.push(document.activeElement!.getAttribute('data-part'));
    }
    expect(walked).toEqual([
      'summary',
      'chip-operator',
      'chip-value',
      'chip-remove',
      'pill',
      'chip-operator',
    ]);
  });

  it('removes a condition with Delete on any segment, and moves focus to the same segment of the next chip', async () => {
    const { chip, fixture, host, settle } = setup();
    const value = segment(chip('amount'), 'chip-value');
    value.focus();
    press(value, 'Delete');
    settle();
    await fixture.whenStable();
    expect(host.onValue).toHaveBeenCalledTimes(1);
    expect(host.onValue.mock.calls[0]![0].reason).toBe('remove');
    expect(host.value()!.rules.map((rule) => ('field' in rule ? rule.field : 'group'))).toEqual([
      'status',
      'customer',
    ]);
    expect(document.activeElement?.getAttribute('data-part')).toBe('chip-value');
    expect(document.activeElement?.closest('[data-part="chip"]')?.getAttribute('data-field')).toBe(
      'customer',
    );
  });

  it('keeps the value where the consumer refuses the request', () => {
    const { host, root, parts, settle } = setup();
    host.onValue.mockImplementation((request: { cancel(): void }) => request.cancel());
    removeOf(root, 'Amount').click();
    settle();
    expect(host.onValue).toHaveBeenCalledTimes(1);
    expect(host.value()).toBe(TREE);
    expect(parts('chip')).toHaveLength(3);
  });

  it('clears everything back to the required defaults', () => {
    const { chip, host, part, settle } = setup();
    host.fields.set([
      ...FIELDS,
      {
        defaultValue: {
          kind: 'text',
          join: 'and',
          conditions: [{ operator: 'equals', value: 'acme' }],
        },
        key: 'company',
        kind: 'text',
        label: 'Company',
        required: true,
      },
    ]);
    settle();
    (part('bar').querySelector('[data-part="clear"]') as HTMLElement).click();
    settle();
    expect(host.onValue.mock.calls[0]![0].reason).toBe('clear');
    expect(serializeFilterGroup(host.value())).toBe('and(company~text~and~equals:acme)');
    /* A required field is pinned whether or not it says so, and its chip has no remove control. */
    const company = chip('company');
    expect(company.hasAttribute('data-pinned')).toBe(true);
    expect(segment(company, 'chip-remove')).toBeNull();
  });

  it('draws a required field without its value as incomplete, and refuses to apply it', () => {
    const { chip, host, part, root, settle } = setup([], (host) => {
      host.apply.set('manual');
      host.fields.set([{ key: 'company', kind: 'text', label: 'Company', required: true }]);
      host.value.set({
        join: 'and',
        rules: [
          {
            field: 'company',
            filter: { kind: 'text', join: 'and', conditions: [{ operator: 'contains' }] },
          },
        ],
      });
    });
    const company = chip('company');
    expect(company.hasAttribute('data-incomplete')).toBe(true);
    expect(company.getAttribute('aria-label')).toBe('Company: contains Select value, incomplete');
    expect(segment(company, 'chip-remove')).toBeNull();
    expect(part('apply').hasAttribute('disabled')).toBe(true);
    /* A draft that differs makes Apply available, and the missing value refuses it. */
    const input = root.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'acme';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    settle();
    part('apply').click();
    settle();
    expect(host.onValue).not.toHaveBeenCalled();
    expect(chip('company').hasAttribute('data-invalid')).toBe(true);
  });

  it('starts a condition from add as an incomplete chip with its value open, and keeps it out of the value', () => {
    const { chip, host, part, root, settle } = setup();
    part('add').click();
    settle();
    menuItem('menuitem', 'Has note').click();
    settle();
    const note = chip('note');
    expect(note.hasAttribute('data-incomplete')).toBe(true);
    expect(segment(note, 'chip-value').getAttribute('aria-expanded')).toBe('true');
    expect(host.onValue).not.toHaveBeenCalled();
    /* Removing it takes nothing out of the value, because it was never in it. */
    removeOf(root, 'Has note').click();
    settle();
    expect(chip('note')).toBeNull();
    expect(host.onValue).not.toHaveBeenCalled();
  });

  it('turns a pinned field’s pill into its chip, in the same place, when pressed', () => {
    const { parts, settle } = setup();
    parts('pill')[0]!.click();
    settle();
    const chips = parts('chip');
    expect(chips[1]!.getAttribute('data-field')).toBe('owner');
    expect(chips[1]!.hasAttribute('data-pinned')).toBe(true);
    expect(chips[1]!.hasAttribute('data-incomplete')).toBe(true);
    expect(parts('pill')).toHaveLength(0);
  });

  it('changes the operator from its own segment, and keeps a rule that lost its operand in place as incomplete', () => {
    const { chip, host, parts, settle } = setup();
    segment(chip('amount'), 'chip-operator').click();
    settle();
    menuItem('menuitemradio', 'less than').click();
    settle();
    const first = host.onValue.mock.calls[0]![0].value as FilterGroup;
    expect((first.rules[1] as FilterRule).filter).toMatchObject({
      conditions: [{ operator: 'lessThan', value: 100 }],
    });
    segment(chip('amount'), 'chip-operator').click();
    settle();
    menuItem('menuitemradio', 'between').click();
    settle();
    /* Between needs an end the rule lacks: the value loses it, the chip keeps its place. */
    const last = host.onValue.mock.calls.at(-1)![0].value as FilterGroup;
    expect(last.rules.some((rule) => 'field' in rule && rule.field === 'amount')).toBe(false);
    expect(parts('chip').map((entry) => entry.getAttribute('data-field'))).toEqual([
      'status',
      'amount',
      'customer',
    ]);
    expect(chip('amount').hasAttribute('data-incomplete')).toBe(true);
    /* The operator wants an operand the rule lacks, so the value popover opens. */
    expect(segment(chip('amount'), 'chip-value').getAttribute('aria-expanded')).toBe('true');
  });

  it('debounces the query under live and clears it with Escape, each with its reason', () => {
    vi.useFakeTimers();
    try {
      const { host, root, settle } = setup();
      host.queryDelay.set(100);
      settle();
      const input = root.querySelector('input[type="search"]') as HTMLInputElement;
      input.value = 'ana';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      settle();
      expect(host.onQuery).not.toHaveBeenCalled();
      vi.advanceTimersByTime(120);
      settle();
      expect(host.onQuery).toHaveBeenCalledTimes(1);
      expect(host.onQuery.mock.calls[0]![0].reason).toBe('keyboard');
      expect(host.query()).toBe('ana');
      press(input, 'Escape');
      settle();
      expect(host.onQuery.mock.calls[1]![0].value).toBe('');
      expect(host.onQuery.mock.calls[1]![0].reason).toBe('clear');
    } finally {
      vi.useRealTimers();
    }
  });

  it('under manual edits a draft, marks the bar dirty, and applies with submit', () => {
    const { host, root, part, parts, settle } = setup();
    host.apply.set('manual');
    settle();
    expect(root.getAttribute('data-apply')).toBe('manual');
    expect(root.hasAttribute('data-dirty')).toBe(false);
    removeOf(root, 'Amount').click();
    settle();
    expect(host.onValue).not.toHaveBeenCalled();
    expect(root.hasAttribute('data-dirty')).toBe(true);
    expect(parts('chip')).toHaveLength(2);
    part('apply').click();
    settle();
    expect(host.onValue).toHaveBeenCalledTimes(1);
    expect(host.onValue.mock.calls[0]![0].reason).toBe('submit');
    expect(root.hasAttribute('data-dirty')).toBe(false);
  });

  it('under manual, Reset discards the draft', () => {
    const { host, root, part, parts, settle } = setup();
    host.apply.set('manual');
    settle();
    removeOf(root, 'Amount').click();
    settle();
    expect(parts('chip')).toHaveLength(2);
    part('reset').click();
    settle();
    expect(parts('chip')).toHaveLength(3);
    expect(root.hasAttribute('data-dirty')).toBe(false);
  });

  /** With no view chosen the select says so, as the React binding's does; an empty trigger named nothing. */
  it('draws the preset select with the no-view words while none is chosen', () => {
    const { host, part, settle } = setup();
    host.value.set(null);
    host.presets.set([{ key: 'paid', label: 'Paid orders', value: TREE }]);
    settle();
    const trigger = part('preset').querySelector('[data-part="trigger"]') as HTMLElement;
    expect(trigger.textContent).toContain('No saved view');
  });

  it('chooses a preset with select and marks the bar dirty when the value leaves it', () => {
    const { host, root, part, settle } = setup();
    host.value.set(null);
    host.presets.set([{ key: 'paid', label: 'Paid orders', value: TREE }]);
    settle();
    const trigger = part('preset').querySelector('[data-part="trigger"]') as HTMLElement;
    trigger.click();
    settle();
    const option = document.querySelector('[role="option"]') as HTMLElement;
    option.click();
    settle();
    expect(host.onPreset.mock.calls[0]![0].value).toBe('paid');
    expect(host.onPreset.mock.calls[0]![0].reason).toBe('select');
    expect(host.onValue.mock.calls[0]![0].reason).toBe('select');
    expect(root.hasAttribute('data-dirty')).toBe(false);
    removeOf(root, 'Amount').click();
    settle();
    expect(root.hasAttribute('data-dirty')).toBe(true);
  });

  /** Leaving a view is the select's own clear; without it the one way out was deleting the view. */
  it('leaves a chosen preset through the select clear and keeps the value standing', () => {
    const { host, part, settle } = setup();
    host.value.set(null);
    host.presets.set([{ key: 'paid', label: 'Paid orders', value: TREE }]);
    host.preset.set('paid');
    settle();
    const clear = part('preset').querySelector('[data-part="clear"]') as HTMLElement;
    expect(clear).toBeTruthy();
    clear.click();
    settle();
    const last = host.onPreset.mock.calls.at(-1)![0];
    expect(last.value).toBe(null);
    expect(last.reason).toBe('clear');
    expect(host.onValue.mock.calls.length).toBe(0);
  });

  it('folds the chips past the limit and reveals them on request', () => {
    const { host, part, parts, settle } = setup();
    host.chipLimit.set(1);
    settle();
    const chips = parts('chip');
    expect(chips[0]!.hasAttribute('data-folded')).toBe(false);
    expect(chips[1]!.hasAttribute('data-folded')).toBe(true);
    expect(text(part('more'))).toBe('+2 more');
    part('more').click();
    settle();
    expect(host.onRevealed.mock.calls[0]![0].value).toBe(true);
    expect(host.revealed()).toBe(true);
    expect(part('bar').hasAttribute('data-revealed')).toBe(true);
    expect(text(part('more'))).toBe('Show less');
  });

  it('draws a rule over an unknown field as an invalid chip that can still be removed', () => {
    const { chip, host, root, settle } = setup();
    host.value.set({
      join: 'and',
      rules: [
        {
          field: 'region',
          filter: {
            kind: 'set',
            join: 'and',
            conditions: [{ operator: 'anyOf', value: ['south'] }],
          },
        },
      ],
    });
    settle();
    const region = chip('region');
    expect(region.hasAttribute('data-invalid')).toBe(true);
    expect(region.getAttribute('aria-label')).toBe('Unknown field region: is south');
    removeOf(root, 'region').click();
    settle();
    expect(host.value()).toBeNull();
  });

  it('keeps the space between the summary word and its count', () => {
    const { part } = setup();
    expect(text(part('summary'))).toMatch(/^\S+ \(\d+\)$/);
    expect(glyph(part('summary'))).toBe('funnel');
  });

  it('marks the field select of a builder rule over an unknown field invalid, so it draws its own edge', () => {
    const { builder, host, part, settle } = setup();
    host.value.set({
      join: 'and',
      rules: [
        {
          field: 'region',
          filter: {
            kind: 'set',
            join: 'and',
            conditions: [{ operator: 'anyOf', value: ['south'] }],
          },
        },
      ],
    });
    settle();
    part('summary').click();
    settle();
    const rule = builder().querySelector('[data-part="rule"][data-invalid]') as HTMLElement;
    const select = rule.querySelector('[data-part="field"] [data-ui="select"][data-part="root"]');
    expect(select?.hasAttribute('data-invalid')).toBe(true);
  });

  it('opens the builder from the summary control and reports the reason', () => {
    const { builder, host, root, part, settle } = setup();
    part('summary').click();
    settle();
    expect(host.onOpen.mock.calls[0]![0].value).toBe(true);
    expect(host.onOpen.mock.calls[0]![0].reason).toBe('pointer');
    expect(host.open()).toBe(true);
    expect(root.hasAttribute('data-open')).toBe(true);
    expect(builder()).not.toBeNull();
    expect(builder().querySelectorAll('[data-part="rule"]')).toHaveLength(3);
    expect(builder().querySelector('[data-part="group"]')?.getAttribute('data-depth')).toBe('0');
  });

  /**
   * A rule's sentence heads its card in the builder's narrow form, and pressing
   * it expands the card; one card is expanded at a time.
   */
  it('expands one rule card at a time from its sentence', () => {
    const { builder, settle } = setup([], (host) => host.open.set(true));
    const [first, second] = [
      ...builder().querySelectorAll<HTMLElement>('[data-part="rule-summary"]'),
    ];
    expect(text(first!.querySelector('[data-field]'))).toBe('Status');
    expect(text(first!.querySelector('[data-operator]'))).toBe('is');
    expect(text(first!.querySelector('[data-value]'))).toBe('Paid');
    expect(glyph(first!)).toBe('chevron-down');
    const controls = first!.getAttribute('aria-controls')!.split(' ');
    const rule = first!.closest('[data-part="rule"]')!;
    expect(
      controls.map((id) => rule.querySelector(`[id="${id}"]`)?.getAttribute('data-part')),
    ).toEqual(['field', 'operator', 'operand']);
    first!.click();
    settle();
    expect(first!.getAttribute('aria-expanded')).toBe('true');
    expect(rule.hasAttribute('data-expanded')).toBe(true);
    second!.click();
    settle();
    expect(first!.getAttribute('aria-expanded')).toBe('false');
    expect(second!.closest('[data-part="rule"]')!.hasAttribute('data-expanded')).toBe(true);
    expect(builder().querySelectorAll('[data-part="rule"][data-expanded]')).toHaveLength(1);
  });

  /* No stylesheet paints a glyph: each one is an `icon` holding the library's `Glyph`. */
  it('draws its glyphs as elements: magnifier, plus, crosses, and a bin on a group', () => {
    const { builder, part, parts, settle } = setup([], (host) => host.open.set(true));
    expect(glyph(part('search'))).toBe('search');
    expect(parts('pill').map(glyph)).toEqual(['plus']);
    expect(glyph(part('add'))).toBe('plus');
    expect(parts('chip-remove').map(glyph)).toEqual(['x', 'x', 'x']);
    const removes = [...builder().querySelectorAll('[data-part="rule"] > [data-part="remove"]')];
    expect(removes).toHaveLength(3);
    expect(removes.map(glyph)).toEqual(['x', 'x', 'x']);
    expect(glyph(builder().querySelector('[data-part="add-rule"]'))).toBe('plus');
    (builder().querySelector('[data-part="add-group"]') as HTMLElement).click();
    settle();
    const removeGroup = builder().querySelector('[data-part="remove-group"]') as HTMLElement;
    expect(glyph(removeGroup)).toBe('trash');
    expect(removeGroup.getAttribute('aria-label')).toBe('Remove group');
    expect(text(removeGroup)).toBe('');
  });

  it('lets the builder add a group, expands its rule, and applies the tree with submit', () => {
    const { builder, host, root, settle } = setup([], (host) => host.open.set(true));
    (builder().querySelector('[data-part="add-group"]') as HTMLElement).click();
    settle();
    const groups = builder().querySelectorAll('[data-part="group"]');
    expect(groups).toHaveLength(2);
    expect(groups[1]!.getAttribute('data-depth')).toBe('1');
    /* The rule the new group starts with opens as the expanded card. */
    const expanded = builder().querySelectorAll('[data-part="rule"][data-expanded]');
    expect(expanded).toHaveLength(1);
    expect(groups[1]!.contains(expanded[0]!)).toBe(true);
    /* The action pair is outlined at the root and quiet inside a nested group. */
    expect(
      groups[0]!
        .querySelector(':scope > [data-part="actions"] > [data-part="add-rule"]')
        ?.getAttribute('data-variant'),
    ).toBe('outline');
    expect(groups[1]!.querySelector('[data-part="add-rule"]')?.getAttribute('data-variant')).toBe(
      'ghost',
    );
    const apply = [...document.querySelectorAll<HTMLElement>('[slDrawerFooter] button')].find(
      (button) => text(button) === 'Apply',
    )!;
    apply.click();
    settle();
    /* The new group holds an unfinished rule, so the tree applied is the one it started with. */
    expect(host.onValue).not.toHaveBeenCalled();
    expect(root.hasAttribute('data-open')).toBe(false);
  });

  it('clears the builder’s draft back to the required baseline from its own clear control', () => {
    const { builder, settle } = setup([], (host) => host.open.set(true));
    const actions = () =>
      builder().querySelector(':scope > [data-part="group"] > [data-part="actions"]')!;
    const clear = actions().querySelector('[data-part="clear"]') as HTMLElement;
    expect(text(clear)).toBe('Clear all');
    clear.click();
    settle();
    expect(builder().querySelectorAll('[data-part="rule"]')).toHaveLength(0);
    expect(actions().querySelector('[data-part="clear"]')).toBeNull();
  });

  it('under the narrow breakpoint sends an edit to the builder, with the rule’s card expanded', () => {
    class Observer {
      constructor(private readonly callback: () => void) {}
      observe() {
        this.callback();
      }
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', Observer);
    const width = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ height: 34, width: 320 } as DOMRect);
    try {
      const { builder, chip, root, settle } = setup();
      settle();
      segment(chip('amount'), 'chip-value').click();
      settle();
      expect(root.hasAttribute('data-open')).toBe(true);
      const expanded = builder().querySelector('[data-part="rule"][data-expanded]');
      expect(text(expanded?.querySelector('[data-field]'))).toBe('Amount');
    } finally {
      width.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('under readOnly lets every condition be reached and none be changed', () => {
    const { part, parts, root, settle } = setup([], (host) => host.readOnly.set(true));
    expect(root.hasAttribute('data-readonly')).toBe(true);
    expect(part('bar').getAttribute('aria-description')).toBe('Read only');
    for (const name of ['add', 'clear', 'pill', 'chip-remove']) {
      expect(part('bar').querySelector(`[data-part="${name}"]`)).toBeNull();
    }
    for (const stop of [...parts('chip-operator'), ...parts('chip-value')]) {
      expect(stop.getAttribute('aria-disabled')).toBe('true');
    }
    /* Each segment keeps its stop: the arrows reach them. */
    const operator = parts('chip-operator')[0]!;
    operator.focus();
    press(operator, 'ArrowRight');
    expect(document.activeElement).toBe(parts('chip-value')[0]);
    operator.click();
    settle();
    expect(document.querySelector('[data-ui="menu"][data-open]')).toBeNull();
    parts('chip-value')[0]!.click();
    settle();
    expect(root.hasAttribute('data-open')).toBe(false);
  });

  it('draws the count as a polite live region with the reader’s figures, and a spinner while loading', () => {
    const { host, part, settle } = setup();
    expect(part('count').getAttribute('aria-live')).toBe('polite');
    expect(text(part('count'))).toBe('128 of 3,412');
    host.loading.set(true);
    settle();
    expect(part('count').getAttribute('aria-busy')).toBe('true');
    expect(part('count').querySelector('[data-ui="spinner"]')).not.toBeNull();
  });

  it('focuses the search on the shortcut, unless the reader is typing', () => {
    const { host, root, settle } = setup();
    host.shortcut.set('/');
    settle();
    const input = root.querySelector('input[type="search"]') as HTMLInputElement;
    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: '/' }));
    expect(document.activeElement).toBe(input);
    expect(root.querySelector('[data-ui="kbd"]')).not.toBeNull();
    const other = document.createElement('input');
    document.body.append(other);
    other.focus();
    other.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: '/' }));
    expect(document.activeElement).toBe(other);
    other.remove();
  });

  it('reads defaults from the token and lets an input win', () => {
    const { root, part } = setup(
      [provideFilterBarDefaults({ apply: 'manual', chipLimit: 1 })],
      (host) => host.messages.set({ add: 'New filter' }),
    );
    expect(root.getAttribute('data-apply')).toBe('manual');
    /* With chips in the bar, add is its glyph alone and keeps the label as its name. */
    expect(part('add').getAttribute('aria-label')).toBe('New filter');
    expect(part('add').getAttribute('title')).toBe('New filter');
    expect(part('add').hasAttribute('data-compact')).toBe(true);
    expect(part('add').getAttribute('data-shape')).toBe('circle');
    expect(part('more')).not.toBeNull();
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const { part, root, settle } = setup([
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);
    expect(root.getAttribute('aria-label')).toBe('Filtro');
    expect(text(part('count'))).toBe('128 de 3.412');

    locale.set('en-US');
    settle();
    expect(root.getAttribute('aria-label')).toBe('Filter');
    expect(text(part('count'))).toBe('128 of 3,412');
  });

  it('keeps add’s label while no chip is in the bar', () => {
    const { part } = setup([], (host) => host.value.set(null));
    expect(text(part('add'))).toBe('Add filter');
    expect(part('add').hasAttribute('data-compact')).toBe(false);
  });

  it('exposes focusSearch and openBuilder through exportAs, and opens a rule’s card by its path', () => {
    const { builder, fixture, host, root, settle } = setup();
    const bar = fixture.debugElement
      .query((node) => node.attributes['slFilterBar'] !== undefined)
      ?.injector.get(SlFilterBar) as SlFilterBar;
    bar.focusSearch();
    expect(document.activeElement).toBe(root.querySelector('input[type="search"]'));
    bar.openBuilder([1]);
    settle();
    expect(host.open()).toBe(true);
    expect(host.onOpen.mock.calls[0]![0].reason).toBe('programmatic');
    const expanded = builder().querySelector('[data-part="rule"][data-expanded]');
    expect(text(expanded?.querySelector('[data-field]'))).toBe('Amount');
  });

  it('writes a chip from the same words the sentence uses, a long list as two values and a count', () => {
    const { chip } = setup([], (host) => {
      host.messages.set({ operators: { anyOf: 'is one of' } });
      host.value.set({
        join: 'and',
        rules: [
          {
            field: 'status',
            filter: {
              kind: 'set',
              join: 'and',
              conditions: [{ operator: 'anyOf', value: ['paid', 'refunded', 'draft'] }],
            },
          },
        ],
      });
    });
    const status = chip('status');
    expect(text(segment(status, 'chip-operator'))).toBe('is one of');
    const value = segment(status, 'chip-value');
    expect(text(value.querySelector('[data-value]'))).toBe('Paid, Refunded +1');
    expect(value.getAttribute('title')).toBe('Paid, Refunded, Draft');
    expect(value.getAttribute('aria-label')).toBe('is one of Paid, Refunded, Draft');
  });

  /**
   * A list of one is the equality of that value, so the chip says so; the
   * condition is still `anyOf`, and a second value returns the list form.
   */
  it('reads a set of one as an equality and a set of two as a list', () => {
    const { chip, host, settle } = setup();
    expect(text(segment(chip('status'), 'chip-operator'))).toBe('is');
    host.value.set({
      join: 'and',
      rules: [
        {
          field: 'status',
          filter: {
            kind: 'set',
            join: 'and',
            conditions: [{ operator: 'anyOf', value: ['paid', 'refunded'] }],
          },
        },
      ],
    });
    settle();
    expect(text(segment(chip('status'), 'chip-operator'))).toBe('any of');
    expect(text(segment(chip('status'), 'chip-value').querySelector('[data-value]'))).toBe(
      'Paid, Refunded',
    );
  });

  it('renders the consumer’s operand template for a field', () => {
    @Component({
      imports: [SlFilterBar, SlFilterBarOperand],
      template: `<div slFilterBar [fields]="fields" [value]="value" [open]="true">
        <ng-template slFilterBarOperand="amount" let-context
          ><input data-custom [attr.aria-label]="context.label"
        /></ng-template>
      </div>`,
    })
    class Custom {
      readonly fields = FIELDS;
      readonly value = TREE;
    }
    TestBed.configureTestingModule({ imports: [Custom] });
    const fixture = TestBed.createComponent(Custom);
    fixture.detectChanges();
    expect(document.querySelector('[data-part="builder"] [data-custom]')).not.toBeNull();
  });

  it('starts an unbound bar from the default inputs, and moves on its own', () => {
    @Component({
      imports: [SlFilterBar],
      template: `<div
        slFilterBar
        [fields]="fields"
        [defaultValue]="value"
        defaultQuery="ana"
        defaultOpen
        [chipLimit]="1"
        defaultRevealed
      ></div>`,
    })
    class Uncontrolled {
      readonly fields = FIELDS;
      readonly value = TREE;
    }
    TestBed.configureTestingModule({ imports: [Uncontrolled] });
    const fixture = TestBed.createComponent(Uncontrolled);
    fixture.detectChanges();
    const root = document.querySelector('[data-ui="filter-bar"]') as HTMLElement;
    const bar = root.querySelector('[data-part="bar"]') as HTMLElement;
    expect(root.hasAttribute('data-open')).toBe(true);
    expect((root.querySelector('input[type="search"]') as HTMLInputElement).value).toBe('ana');
    expect(bar.hasAttribute('data-revealed')).toBe(true);
    expect(text(root.querySelector('[data-part="more"]'))).toBe('Show less');
    (root.querySelector('[data-part="more"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(bar.hasAttribute('data-revealed')).toBe(false);
  });

  /**
   * Measured right after the first render, the bar forced a layout of the
   * page just rendered, although the observer reports a first size after
   * layout anyway.
   */
  it('measures nothing while it renders, and reads its box in the observer’s first report', async () => {
    const reports: (() => void)[] = [];
    class Observer {
      constructor(callback: () => void) {
        reports.push(callback);
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', Observer);
    const rects = vi
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockReturnValue({ height: 48, width: 320 } as DOMRect);
    @Component({
      imports: [SlFilterBar],
      template: `<div slFilterBar [fields]="fields" sticky></div>`,
    })
    class Measured {
      readonly fields = FIELDS;
    }
    try {
      TestBed.configureTestingModule({ imports: [Measured] });
      const fixture = TestBed.createComponent(Measured);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(rects).not.toHaveBeenCalled();
      reports.forEach((report) => report());
      expect(rects).toHaveBeenCalled();
      fixture.destroy();
    } finally {
      rects.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('under sticky reads the page offset for itself and publishes the sum for what follows, once', () => {
    const notify: (() => void)[] = [];
    class Observer {
      constructor(callback: () => void) {
        notify.push(callback);
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', Observer);
    const height = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ height: 48 } as DOMRect);
    @Component({
      imports: [SlFilterBar],
      template: `<div style="--slotted-page-sticky-top: 56px">
        <div slFilterBar [fields]="fields" sticky></div>
      </div>`,
    })
    class Sticky {
      readonly fields = FIELDS;
    }
    try {
      TestBed.configureTestingModule({ imports: [Sticky] });
      const fixture = TestBed.createComponent(Sticky);
      fixture.detectChanges();
      const parent = fixture.nativeElement.firstElementChild as HTMLElement;
      const root = parent.firstElementChild as HTMLElement;
      notify.forEach((callback) => callback());
      notify.forEach((callback) => callback());
      expect(root.style.getPropertyValue('--slotted-page-sticky-top')).toBe('56px');
      expect(parent.style.getPropertyValue('--slotted-page-sticky-top')).toBe('calc(56px + 48px)');
      fixture.destroy();
      expect(parent.style.getPropertyValue('--slotted-page-sticky-top')).toBe('56px');
    } finally {
      height.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
