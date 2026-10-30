import { serializeFilterGroup } from '@slotted/core/filter';
import type { FilterGroup } from '@slotted/core/filter';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/filter-bar/contract.json';
import { SlottedProvider } from '../i18n';
import { FilterBar } from './filter-bar';
import { FilterBarDefaultsProvider } from './filter-bar-defaults';
import type { FilterBarField, FilterBarProps } from './filter-bar.types';

const FIELDS: FilterBarField[] = [
  {
    key: 'status',
    kind: 'set',
    label: 'Status',
    options: [
      { label: 'Paid', value: 'paid' },
      { label: 'Refunded', value: 'refunded' },
      { label: 'Draft', value: 'draft' },
    ],
    icon: 'circle',
    pinned: true,
  },
  { key: 'owner', kind: 'text', label: 'Owner', pinned: true },
  { key: 'amount', kind: 'number', label: 'Amount' },
  { key: 'customer', kind: 'text', label: 'Customer' },
  { key: 'created', kind: 'date', label: 'Created', section: 'Dates' },
  { key: 'note', kind: 'boolean', label: 'Has note' },
];

const TWO_VALUES: FilterGroup = {
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
};

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

function Orders(props: Partial<FilterBarProps>) {
  return <FilterBar count={128} fields={FIELDS} total={3412} {...props} />;
}

const root = () =>
  document.querySelector('[data-ui="filter-bar"][data-part="root"]') as HTMLElement;
const part = (name: string) => root().querySelector(`[data-part="${name}"]`) as HTMLElement;
const parts = (name: string) =>
  [...root().querySelectorAll(`[data-part="${name}"]`)] as HTMLElement[];

describe('FilterBar', () => {
  it('is selected in public by the family identifier, and is a search landmark holding one toolbar of chips', () => {
    render(<Orders defaultValue={TREE} />);
    expect(root().dataset['ui']).toBe(contract.ui);
    expect(screen.getByRole('search', { name: 'Filter' })).toBe(root());
    expect(screen.getByRole('toolbar', { name: 'Filters' })).toBe(part('bar'));
    expect(screen.queryByRole('grid')).toBeNull();
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
    ]) {
      expect(part(name)).not.toBeNull();
    }
    for (const chip of parts('chip')) expect(chip.parentElement).toBe(part('bar'));
  });

  it('writes a condition as a chip of segments, and a pinned field without one as a pill', () => {
    render(<Orders defaultValue={TREE} />);
    const [status, amount] = parts('chip');
    expect(status!.getAttribute('role')).toBe('group');
    expect(status!.hasAttribute('data-pinned')).toBe(true);
    expect(amount!.hasAttribute('data-pinned')).toBe(false);
    expect(screen.getByRole('group', { name: 'Amount: greater than 100' })).toBe(amount);
    expect(amount!.querySelector('[data-part="chip-field"]')?.textContent).toBe('Amount');
    expect(amount!.querySelector('[data-part="chip-operator"]')?.textContent).toBe('greater than');
    expect(
      amount!.querySelector('[data-part="chip-operator"]')?.getAttribute('aria-haspopup'),
    ).toBe('menu');
    const value = amount!.querySelector('[data-part="chip-value"]') as HTMLElement;
    expect(value.getAttribute('aria-haspopup')).toBe('dialog');
    expect(value.getAttribute('aria-label')).toBe('greater than 100');
    expect(value.querySelector('[data-value]')?.textContent).toBe('100');
    expect(screen.getByRole('button', { name: 'Remove Amount' })).not.toBeNull();
    /* The field's glyph stands before its name. */
    expect(
      status!.querySelector('[data-part="chip-field"] svg[data-glyph]')?.getAttribute('data-glyph'),
    ).toBe('circle');
    const pills = parts('pill');
    expect(pills.map((pill) => pill.textContent)).toEqual(['Owner']);
    expect(pills[0]!.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('holds one tab stop for the whole bar, and walks every segment with the arrows', () => {
    render(<Orders defaultValue={TREE} />);
    const stops = () => [...part('bar').querySelectorAll<HTMLElement>('[tabindex]')];
    expect(stops().filter((stop) => stop.getAttribute('tabindex') === '0')).toHaveLength(1);
    const first = stops().find((stop) => stop.getAttribute('tabindex') === '0')!;
    first.focus();
    const walked = [first.getAttribute('data-part')];
    for (let step = 0; step < 5; step += 1) {
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
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
    const onValueChange = vi.fn();
    render(<Orders defaultValue={TREE} onValueChange={onValueChange} />);
    const amount = screen.getByRole('group', { name: 'Amount: greater than 100' });
    const value = amount.querySelector('[data-part="chip-value"]') as HTMLElement;
    value.focus();
    fireEvent.keyDown(value, { key: 'Delete' });
    await act(() => Promise.resolve());
    expect(onValueChange).toHaveBeenCalledTimes(1);
    const [next, request] = onValueChange.mock.calls[0]!;
    expect(request.reason).toBe('remove');
    expect(
      (next as FilterGroup).rules.map((rule) => ('field' in rule ? rule.field : 'group')),
    ).toEqual(['status', 'customer']);
    expect(document.activeElement?.getAttribute('data-part')).toBe('chip-value');
    expect(document.activeElement?.closest('[data-part="chip"]')?.getAttribute('data-field')).toBe(
      'customer',
    );
  });

  it('keeps the value where the consumer owns it, and asks', () => {
    const onValueChange = vi.fn();
    render(<Orders onValueChange={onValueChange} value={TREE} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Amount' }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(parts('chip')).toHaveLength(3);
  });

  it('clears everything back to the required defaults, and says so', () => {
    const onValueChange = vi.fn();
    const fields: FilterBarField[] = [
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
    ];
    render(<FilterBar defaultValue={TREE} fields={fields} onValueChange={onValueChange} />);
    fireEvent.click(part('bar').querySelector('[data-part="clear"]') as HTMLElement);
    const [next, request] = onValueChange.mock.calls[0]!;
    expect(request.reason).toBe('clear');
    expect(serializeFilterGroup(next as FilterGroup)).toBe('and(company~text~and~equals:acme)');
    /* A required field is pinned whether or not it says so, and its chip has no remove control. */
    const company = parts('chip').find((chip) => chip.dataset['field'] === 'company')!;
    expect(company.hasAttribute('data-pinned')).toBe(true);
    expect(company.querySelector('[data-part="chip-remove"]')).toBeNull();
  });

  it('draws a required field without its value as incomplete, and refuses to apply it', () => {
    const fields: FilterBarField[] = [
      { key: 'company', kind: 'text', label: 'Company', required: true },
    ];
    const value: FilterGroup = {
      join: 'and',
      rules: [
        {
          field: 'company',
          filter: { kind: 'text', join: 'and', conditions: [{ operator: 'contains' }] },
        },
      ],
    };
    render(<FilterBar apply="manual" defaultValue={value} fields={fields} />);
    const chip = part('chip');
    expect(chip.hasAttribute('data-incomplete')).toBe(true);
    expect(chip.getAttribute('aria-label')).toBe('Company: contains Select value, incomplete');
    expect(chip.querySelector('[data-part="chip-remove"]')).toBeNull();
    expect(part('apply').hasAttribute('disabled')).toBe(true);
  });

  it('starts a condition from add as an incomplete chip with its value open, and keeps it out of the value', () => {
    const onValueChange = vi.fn();
    render(<Orders defaultValue={TREE} onValueChange={onValueChange} />);
    fireEvent.click(part('add'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Has note' }));
    const chip = parts('chip').find((entry) => entry.dataset['field'] === 'note')!;
    expect(chip.hasAttribute('data-incomplete')).toBe(true);
    expect(chip.querySelector('[data-part="chip-value"]')?.getAttribute('aria-expanded')).toBe(
      'true',
    );
    expect(onValueChange).not.toHaveBeenCalled();
    /* Removing it takes nothing out of the value, because it was never in it. */
    fireEvent.click(screen.getByRole('button', { name: 'Remove Has note' }));
    expect(parts('chip').some((entry) => entry.dataset['field'] === 'note')).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('turns a pinned field’s pill into its chip, in the same place, when pressed', () => {
    render(<Orders defaultValue={TREE} />);
    fireEvent.click(parts('pill')[0]!);
    const chips = parts('chip');
    expect(chips[1]!.dataset['field']).toBe('owner');
    expect(chips[1]!.hasAttribute('data-pinned')).toBe(true);
    expect(chips[1]!.hasAttribute('data-incomplete')).toBe(true);
    expect(parts('pill')).toHaveLength(0);
  });

  it('changes the operator from its own segment, and keeps a rule that lost its operand in place as incomplete', () => {
    const onValueChange = vi.fn();
    render(<Orders defaultValue={TREE} onValueChange={onValueChange} />);
    const amount = () => parts('chip').find((chip) => chip.dataset['field'] === 'amount')!;
    fireEvent.click(amount().querySelector('[data-part="chip-operator"]') as HTMLElement);
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'less than' }));
    expect(onValueChange.mock.calls[0]![0].rules[1].filter.conditions[0]).toEqual({
      operator: 'lessThan',
      value: 100,
    });
    fireEvent.click(amount().querySelector('[data-part="chip-operator"]') as HTMLElement);
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'between' }));
    /* Between needs an end the rule lacks: the value loses it, the chip keeps its place. */
    const [next] = onValueChange.mock.calls.at(-1)!;
    expect(
      (next as FilterGroup).rules.some((rule) => 'field' in rule && rule.field === 'amount'),
    ).toBe(false);
    expect(parts('chip').map((chip) => chip.dataset['field'])).toEqual([
      'status',
      'amount',
      'customer',
    ]);
    expect(amount().hasAttribute('data-incomplete')).toBe(true);
  });

  it('debounces the query under live and clears it with Escape, each with its reason', () => {
    vi.useFakeTimers();
    try {
      const onQueryChange = vi.fn();
      render(<Orders onQueryChange={onQueryChange} queryDelay={100} />);
      const input = screen.getByRole('searchbox', { name: 'Search' }) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'ana' } });
      expect(onQueryChange).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(120);
      });
      expect(onQueryChange).toHaveBeenCalledTimes(1);
      expect(onQueryChange.mock.calls[0]![1].reason).toBe('keyboard');
      expect(input.value).toBe('ana');
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(onQueryChange).toHaveBeenCalledTimes(2);
      expect(onQueryChange.mock.calls[1]![0]).toBe('');
      expect(onQueryChange.mock.calls[1]![1].reason).toBe('clear');
    } finally {
      vi.useRealTimers();
    }
  });

  it('under manual edits a draft, marks the bar dirty, and applies with submit', () => {
    const onValueChange = vi.fn();
    const onQueryChange = vi.fn();
    render(
      <Orders
        apply="manual"
        defaultValue={TREE}
        onQueryChange={onQueryChange}
        onValueChange={onValueChange}
      />,
    );
    expect(root().dataset['apply']).toBe('manual');
    expect(root().hasAttribute('data-dirty')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Amount' }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(root().hasAttribute('data-dirty')).toBe(true);
    expect(parts('chip')).toHaveLength(2);
    fireEvent.click(part('apply'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]![1].reason).toBe('submit');
    expect(root().hasAttribute('data-dirty')).toBe(false);
  });

  it('under manual, Reset discards the draft', () => {
    render(<Orders apply="manual" defaultValue={TREE} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Amount' }));
    expect(parts('chip')).toHaveLength(2);
    fireEvent.click(part('reset'));
    expect(parts('chip')).toHaveLength(3);
    expect(root().hasAttribute('data-dirty')).toBe(false);
  });

  it('chooses a preset with select, replaces the value, and marks the bar dirty when the value leaves it', () => {
    const onPresetChange = vi.fn();
    const onValueChange = vi.fn();
    function Owner() {
      const [value, setValue] = useState<FilterGroup | null>(null);
      return (
        <Orders
          onPresetChange={onPresetChange}
          onValueChange={(next, request) => {
            onValueChange(next, request);
            setValue(next);
          }}
          presets={[{ key: 'paid', label: 'Paid orders', value: TREE }]}
          value={value}
        />
      );
    }
    render(<Owner />);
    const trigger = screen.getByRole('combobox', { name: 'Saved view' });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('option', { name: 'Paid orders' }));
    expect(onPresetChange.mock.calls[0]![0]).toBe('paid');
    expect(onPresetChange.mock.calls[0]![1].reason).toBe('select');
    expect(onValueChange.mock.calls[0]![1].reason).toBe('select');
    expect(root().hasAttribute('data-dirty')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Amount' }));
    expect(root().hasAttribute('data-dirty')).toBe(true);
  });

  it('folds the chips past the limit and reveals them on request', () => {
    const onRevealedChange = vi.fn();
    render(<Orders chipLimit={1} defaultValue={TREE} onRevealedChange={onRevealedChange} />);
    const chips = parts('chip');
    expect(chips[0]!.hasAttribute('data-folded')).toBe(false);
    expect(chips[1]!.hasAttribute('data-folded')).toBe(true);
    const more = part('more');
    expect(more.textContent).toBe('+2 more');
    fireEvent.click(more);
    expect(onRevealedChange.mock.calls[0]![0]).toBe(true);
    expect(part('bar').hasAttribute('data-revealed')).toBe(true);
    expect(part('more').textContent).toBe('Show less');
  });

  it('draws a rule over an unknown field as an invalid chip that can still be removed', () => {
    const onValueChange = vi.fn();
    const value: FilterGroup = {
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
    };
    render(<Orders defaultValue={value} onValueChange={onValueChange} />);
    const chip = parts('chip').find((entry) => entry.dataset['field'] === 'region')!;
    expect(chip.hasAttribute('data-invalid')).toBe(true);
    expect(chip.getAttribute('aria-label')).toBe('Unknown field region: is south');
    fireEvent.click(screen.getByRole('button', { name: 'Remove region' }));
    expect(onValueChange.mock.calls[0]![0]).toBeNull();
  });

  it('marks the field select of a builder rule over an unknown field invalid, so it draws its own edge', () => {
    const value: FilterGroup = {
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
    };
    render(<Orders defaultValue={value} />);
    fireEvent.click(part('summary'));
    const rule = document.querySelector(
      '[data-ui="filter-bar"][data-part="builder"] [data-part="rule"][data-invalid]',
    ) as HTMLElement;
    const select = rule.querySelector('[data-part="field"] [data-ui="select"][data-part="root"]');
    expect(select?.hasAttribute('data-invalid')).toBe(true);
  });

  it('opens the builder from the summary control and reports the reason', () => {
    const onOpenChange = vi.fn();
    render(<Orders defaultValue={TREE} onOpenChange={onOpenChange} />);
    fireEvent.click(part('summary'));
    expect(onOpenChange.mock.calls[0]![0]).toBe(true);
    expect(onOpenChange.mock.calls[0]![1].reason).toBe('pointer');
    expect(root().hasAttribute('data-open')).toBe(true);
    const builder = document.querySelector(
      '[data-ui="filter-bar"][data-part="builder"]',
    ) as HTMLElement;
    expect(builder).not.toBeNull();
    expect(builder.querySelectorAll('[data-part="rule"]')).toHaveLength(3);
    expect(builder.querySelector('[data-part="group"]')?.getAttribute('data-depth')).toBe('0');
  });

  /**
   * A rule's sentence heads its card in the builder's narrow form, and pressing
   * it expands the card; one card is expanded at a time.
   */
  it('expands one rule card at a time from its sentence', () => {
    render(<Orders defaultOpen defaultValue={TREE} />);
    const builder = document.querySelector(
      '[data-ui="filter-bar"][data-part="builder"]',
    ) as HTMLElement;
    const [first, second] = [
      ...builder.querySelectorAll<HTMLElement>('[data-part="rule-summary"]'),
    ];
    expect(first!.querySelector('[data-field]')?.textContent).toBe('Status');
    expect(first!.querySelector('[data-operator]')?.textContent).toBe('is');
    expect(first!.querySelector('[data-value]')?.textContent).toBe('Paid');
    fireEvent.click(first!);
    expect(first!.getAttribute('aria-expanded')).toBe('true');
    expect(first!.closest('[data-part="rule"]')!.hasAttribute('data-expanded')).toBe(true);
    fireEvent.click(second!);
    expect(first!.getAttribute('aria-expanded')).toBe('false');
    expect(second!.closest('[data-part="rule"]')!.hasAttribute('data-expanded')).toBe(true);
  });

  /* No stylesheet paints a glyph: each one is an `icon` holding the library's `Glyph`. */
  it('draws its glyphs as elements: magnifier, plus, crosses, and a bin on a group', () => {
    render(<Orders defaultOpen defaultValue={TREE} />);
    const glyph = (host: Element | null) =>
      host?.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');
    expect(glyph(part('search'))).toBe('search');
    expect(parts('pill').map(glyph)).toEqual(['plus']);
    expect(glyph(part('add'))).toBe('plus');
    expect(parts('chip-remove').map(glyph)).toEqual(['x', 'x', 'x']);
    const builder = document.querySelector(
      '[data-ui="filter-bar"][data-part="builder"]',
    ) as HTMLElement;
    const removes = [...builder.querySelectorAll('[data-part="rule"] > [data-part="remove"]')];
    expect(removes).toHaveLength(3);
    expect(removes.map(glyph)).toEqual(['x', 'x', 'x']);
    expect(glyph(builder.querySelector('[data-part="add-rule"]'))).toBe('plus');
    fireEvent.click(builder.querySelector('[data-part="add-group"]') as HTMLElement);
    expect(glyph(builder.querySelector('[data-part="remove-group"]'))).toBe('trash');
  });

  it('lets the builder add a group and applies the tree with submit', () => {
    const onValueChange = vi.fn();
    render(<Orders defaultOpen defaultValue={TREE} onValueChange={onValueChange} />);
    const builder = document.querySelector(
      '[data-ui="filter-bar"][data-part="builder"]',
    ) as HTMLElement;
    fireEvent.click(builder.querySelector('[data-part="add-group"]') as HTMLElement);
    expect(builder.querySelectorAll('[data-part="group"]')).toHaveLength(2);
    expect(builder.querySelectorAll('[data-part="group"]')[1]!.getAttribute('data-depth')).toBe(
      '1',
    );
    /* The rule the new group starts with opens as the expanded card. */
    expect(builder.querySelectorAll('[data-part="rule"][data-expanded]')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    /* The new group holds an unfinished rule, so the tree applied is the one it started with. */
    expect(onValueChange).not.toHaveBeenCalled();
    expect(root().hasAttribute('data-open')).toBe(false);
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
      render(<Orders defaultValue={TREE} />);
      const amount = screen.getByRole('group', { name: 'Amount: greater than 100' });
      fireEvent.click(amount.querySelector('[data-part="chip-value"]') as HTMLElement);
      expect(root().hasAttribute('data-open')).toBe(true);
      const builder = document.querySelector(
        '[data-ui="filter-bar"][data-part="builder"]',
      ) as HTMLElement;
      const expanded = builder.querySelector('[data-part="rule"][data-expanded]');
      expect(expanded?.querySelector('[data-field]')?.textContent).toBe('Amount');
    } finally {
      width.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('under readOnly lets every condition be reached and none be changed', () => {
    render(<Orders defaultValue={TREE} readOnly />);
    expect(root().hasAttribute('data-readonly')).toBe(true);
    expect(part('bar').getAttribute('aria-description')).toBe('Read only');
    for (const name of ['add', 'clear', 'pill', 'chip-remove']) {
      expect(part('bar').querySelector(`[data-part="${name}"]`)).toBeNull();
    }
    for (const segment of [...parts('chip-operator'), ...parts('chip-value')]) {
      expect(segment.getAttribute('aria-disabled')).toBe('true');
    }
    fireEvent.click(parts('chip-operator')[0]!);
    expect(screen.queryByRole('menu')).toBeNull();
    /* The arrows still reach a read-only segment. */
    const first = parts('chip-operator')[0]!;
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('data-part')).toBe('chip-value');
  });

  it('draws the count as a polite live region and a spinner while loading', () => {
    const { rerender } = render(<Orders />);
    expect(part('count').getAttribute('aria-live')).toBe('polite');
    expect(part('count').textContent).toBe('128 of 3,412');
    rerender(<Orders loading />);
    expect(part('count').getAttribute('aria-busy')).toBe('true');
    expect(part('count').querySelector('[data-ui="spinner"]')).not.toBeNull();
  });

  it('focuses the search on the shortcut, unless the reader is typing', () => {
    render(<Orders shortcut="/" />);
    const input = screen.getByRole('searchbox', { name: 'Search' });
    fireEvent.keyDown(document.body, { key: '/' });
    expect(document.activeElement).toBe(input);
    expect(root().querySelector('[data-ui="kbd"]')).not.toBeNull();
    const other = document.createElement('input');
    document.body.append(other);
    other.focus();
    fireEvent.keyDown(other, { key: '/' });
    expect(document.activeElement).toBe(other);
    other.remove();
  });

  it('reads defaults from the provider and lets a prop win', () => {
    render(
      <FilterBarDefaultsProvider apply="manual" chipLimit={1}>
        <Orders defaultValue={TREE} messages={{ add: 'New filter' }} />
      </FilterBarDefaultsProvider>,
    );
    expect(root().dataset['apply']).toBe('manual');
    /* With chips in the bar, add is its glyph alone and keeps the label as its name. */
    expect(part('add').getAttribute('aria-label')).toBe('New filter');
    expect(part('add').hasAttribute('data-compact')).toBe(true);
    expect(part('more')).not.toBeNull();
  });

  it('speaks the language in force, the count in its digits', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Orders defaultValue={TREE} />
      </SlottedProvider>,
    );
    expect(root().getAttribute('aria-label')).toBe('Filtro');
    expect(part('count').textContent).toBe('128 de 3.412');
    expect(screen.getByRole('button', { name: 'Remover Amount' })).not.toBeNull();
  });

  it('keeps add’s label while no chip is in the bar', () => {
    render(<Orders />);
    expect(part('add').textContent).toBe('Add filter');
    expect(part('add').hasAttribute('data-compact')).toBe(false);
  });

  it('passes native props through to the root and composes a consumer handler', () => {
    const onKeyDown = vi.fn();
    render(<Orders data-testid="orders" id="orders" onKeyDown={onKeyDown} />);
    expect(root().id).toBe('orders');
    fireEvent.keyDown(root(), { key: 'a' });
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('exposes focusSearch and open on the handle', () => {
    const handle = { current: null as null | { focusSearch: () => void; open: () => void } };
    render(<Orders ref={handle as never} />);
    act(() => handle.current?.focusSearch());
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Search' }));
    act(() => handle.current?.open());
    expect(root().hasAttribute('data-open')).toBe(true);
  });

  it('writes a chip from the same words the sentence uses, a long list as two values and a count', () => {
    const many: FilterGroup = {
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
    };
    render(<Orders defaultValue={many} messages={{ operators: { anyOf: 'is one of' } }} />);
    const status = part('chip');
    expect(status.querySelector('[data-part="chip-operator"]')?.textContent).toBe('is one of');
    const value = status.querySelector('[data-part="chip-value"]') as HTMLElement;
    expect(value.querySelector('[data-value]')?.textContent).toBe('Paid, Refunded +1');
    expect(value.getAttribute('title')).toBe('Paid, Refunded, Draft');
    expect(value.getAttribute('aria-label')).toBe('is one of Paid, Refunded, Draft');
  });

  /**
   * A list of one is the equality of that value, so the chip says so; the
   * condition is still `anyOf`, and a second value returns the list form.
   */
  it('reads a set of one as an equality and a set of two as a list', () => {
    const one = render(<Orders defaultValue={TREE} />);
    expect(part('chip-operator').textContent).toBe('is');
    one.unmount();
    render(<Orders defaultValue={TWO_VALUES} />);
    expect(part('chip-operator').textContent).toBe('any of');
    expect(part('chip-value').querySelector('[data-value]')?.textContent).toBe('Paid, Refunded');
  });

  /**
   * Measured inside the mount, the bar forced a layout of the page just
   * committed and a second render before the first paint, although the
   * observer reports a first size after layout anyway.
   */
  it('measures nothing while it mounts, and reads its box in the observer’s first report', () => {
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
    try {
      render(<FilterBar fields={FIELDS} sticky />);
      expect(rects).not.toHaveBeenCalled();
      act(() => reports.forEach((report) => report()));
      expect(rects).toHaveBeenCalled();
    } finally {
      rects.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('under sticky reads the page offset for itself and publishes the sum for what follows, once', () => {
    let notify: (() => void) | undefined;
    class Observer {
      constructor(callback: () => void) {
        notify = callback;
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', Observer);
    const height = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ height: 48 } as DOMRect);
    try {
      const { container, unmount } = render(
        <div style={{ '--slotted-page-sticky-top': '56px' } as React.CSSProperties}>
          <FilterBar fields={FIELDS} sticky />
        </div>,
      );
      const parent = container.firstElementChild as HTMLElement;
      const root = parent.firstElementChild as HTMLElement;
      act(() => notify?.());
      act(() => notify?.());
      expect(root.style.getPropertyValue('--slotted-page-sticky-top')).toBe('56px');
      expect(parent.style.getPropertyValue('--slotted-page-sticky-top')).toBe('calc(56px + 48px)');
      unmount();
      expect(parent.style.getPropertyValue('--slotted-page-sticky-top')).toBe('56px');
    } finally {
      height.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
