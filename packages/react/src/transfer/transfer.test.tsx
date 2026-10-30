import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, within } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { Transfer } from './transfer';
import { TransferDefaultsProvider } from './transfer-defaults';
import type {
  TransferHandle,
  TransferItem,
  TransferMoveRequest,
  TransferProps,
  TransferSelectionRequest,
} from './transfer.types';

const ITEMS: TransferItem[] = [
  { key: 'ana', label: 'Ana Souza', description: 'Design' },
  { key: 'bruno', label: 'Bruno Lima' },
  { key: 'carla', label: 'Carla Day' },
  { key: 'elisa', label: 'Elise Pratt', disabled: true },
  // language: pt-BR
  { key: 'fabio', label: 'Fábio Nunes' },
  // language: en-US
];

type MoveSpy = ReturnType<
  typeof vi.fn<(keys: readonly string[], request: TransferMoveRequest) => void>
>;
type SelectSpy = ReturnType<
  typeof vi.fn<(keys: readonly string[], request: TransferSelectionRequest) => void>
>;

function mount(props: Partial<TransferProps> = {}) {
  const onTargetKeysChange: MoveSpy = vi.fn();
  const onSelectedKeysChange: SelectSpy = vi.fn();
  const view = render(
    <Transfer
      aria-label="Members"
      items={ITEMS}
      onSelectedKeysChange={onSelectedKeysChange}
      onTargetKeysChange={onTargetKeysChange}
      {...props}
    />,
  );
  return { ...view, onTargetKeysChange, onSelectedKeysChange };
}

const pane = (side: 'source' | 'target') =>
  document.querySelector<HTMLElement>(`[data-part="pane"][data-side="${side}"]`)!;
const list = (side: 'source' | 'target') =>
  pane(side).querySelector<HTMLElement>('[data-ui="listbox"]')!;
const keysIn = (side: 'source' | 'target') =>
  [...list(side).querySelectorAll<HTMLElement>('[data-part="option"]')].map(
    (node) => node.dataset['key'],
  );
const option = (key: string) =>
  document.querySelector<HTMLElement>(`[data-part="option"][data-key="${key}"]`)!;
const button = (part: string) =>
  document.querySelector<HTMLButtonElement>(`[data-part="${part}"]`)!;

describe('Transfer', () => {
  it('draws the two panes from one collection and the target keys', () => {
    mount({ defaultTargetKeys: ['carla'] });
    expect(keysIn('source')).toEqual(['ana', 'bruno', 'elisa', 'fabio']);
    expect(keysIn('target')).toEqual(['carla']);
    expect(list('source')).toHaveAttribute('aria-multiselectable', 'true');
    expect(list('source')).toHaveAttribute(
      'aria-labelledby',
      pane('source').getAttribute('aria-labelledby'),
    );
    expect(document.querySelector('[data-ui="transfer"]')).toHaveAttribute('role', 'group');
  });

  it('asks to move the selection with the direction, the keys and the reason of the press', () => {
    const { onTargetKeysChange, onSelectedKeysChange } = mount({
      defaultSelectedKeys: ['fabio', 'ana'],
    });
    fireEvent.click(button('move-to-target'), { detail: 1 });
    expect(onTargetKeysChange).toHaveBeenCalledTimes(1);
    const [keys, request] = onTargetKeysChange.mock.calls[0]!;
    expect(keys).toEqual(['ana', 'fabio']);
    expect(request.direction).toBe('target');
    expect(request.keys).toEqual(['ana', 'fabio']);
    expect(request.reason).toBe('pointer');
    expect(request.previous).toEqual([]);
    expect(keysIn('target')).toEqual(['ana', 'fabio']);
    /* The keys that moved leave the selection in the same gesture. */
    expect(onSelectedKeysChange.mock.calls.at(-1)![0]).toEqual([]);
  });

  it('waits for the consumer in controlled mode', () => {
    const { onTargetKeysChange } = mount({ targetKeys: [], defaultSelectedKeys: ['ana'] });
    fireEvent.click(button('move-to-target'));
    expect(onTargetKeysChange).toHaveBeenCalledTimes(1);
    expect(keysIn('target')).toEqual([]);
  });

  it('commits nothing when the move is cancelled', () => {
    const { onSelectedKeysChange } = mount({
      defaultSelectedKeys: ['ana'],
      onTargetKeysChange: (_keys, request) => request.cancel(),
    });
    fireEvent.click(button('move-to-target'));
    expect(keysIn('target')).toEqual([]);
    expect(onSelectedKeysChange).not.toHaveBeenCalled();
  });

  it('moves every visible enabled item and leaves a disabled one where it is', () => {
    mount();
    fireEvent.click(button('move-all-to-target'));
    expect(keysIn('source')).toEqual(['elisa']);
    expect(keysIn('target')).toEqual(['ana', 'bruno', 'carla', 'fabio']);
    fireEvent.click(button('move-all-to-source'));
    expect(keysIn('target')).toEqual([]);
  });

  it('keeps a move button reachable when it has nothing to move', () => {
    mount();
    const add = button('move-to-target');
    expect(add).toHaveAttribute('aria-disabled', 'true');
    expect(add).not.toHaveAttribute('disabled');
    expect(add).toHaveAttribute('aria-keyshortcuts', 'Enter');
    expect(button('move-to-source')).toHaveAttribute('aria-keyshortcuts', 'Delete');
  });

  /** Every mark the family owns is the Glyph element, in the slot it points from. */
  it('draws the chevrons, the search glyph and the empty mark with the Glyph element', () => {
    mount({ reorderable: true });
    const glyph = (scope: Element | null, slot: string) =>
      scope
        ?.querySelector(`${slot} > [data-ui="icon"] > svg[data-glyph]`)
        ?.getAttribute('data-glyph');
    expect(glyph(button('move-to-target'), '[data-part="end"]')).toBe('chevron-right');
    expect(glyph(button('move-all-to-target'), '[data-part="end"]')).toBe('chevrons-right');
    expect(glyph(button('move-to-source'), '[data-part="start"]')).toBe('chevron-right');
    expect(glyph(button('move-all-to-source'), '[data-part="start"]')).toBe('chevrons-right');
    expect(glyph(button('move-up'), '[data-part="start"]')).toBe('chevron-down');
    expect(glyph(button('move-down'), '[data-part="start"]')).toBe('chevron-down');
    expect(glyph(pane('source'), '[data-part="search-icon"]')).toBe('search');
    expect(glyph(pane('target'), '[data-part="empty"]')).toBe('inbox');

    const search = pane('target').querySelector<HTMLInputElement>('input[type="search"]')!;
    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(glyph(pane('target'), '[data-part="empty"][data-query]')).toBe('search-x');
  });

  it('moves the selection with Enter and back with Delete, from inside the list', () => {
    const { onTargetKeysChange } = mount({ defaultSelectedKeys: ['bruno'] });
    fireEvent.keyDown(option('bruno'), { key: 'Enter' });
    expect(keysIn('target')).toEqual(['bruno']);
    expect(onTargetKeysChange.mock.calls[0]![1].reason).toBe('keyboard');

    act(() => option('bruno').focus());
    fireEvent.keyDown(option('bruno'), { key: 'Delete' });
    expect(keysIn('target')).toEqual([]);
  });

  it('moves the active option when nothing is selected', () => {
    mount();
    act(() => option('carla').focus());
    fireEvent.keyDown(option('carla'), { key: 'Enter' });
    expect(keysIn('target')).toEqual(['carla']);
  });

  it('moves toward the inline end with Control+ArrowRight', () => {
    mount({ defaultSelectedKeys: ['ana'] });
    fireEvent.keyDown(option('ana'), { key: 'ArrowRight', ctrlKey: true });
    expect(keysIn('target')).toEqual(['ana']);
    act(() => option('ana').focus());
    fireEvent.keyDown(option('ana'), { key: 'ArrowLeft', metaKey: true });
    expect(keysIn('target')).toEqual([]);
  });

  it('selects the visible enabled items of one pane from its select-all box', () => {
    const { onSelectedKeysChange } = mount();
    const box = pane('source').querySelector<HTMLInputElement>('[data-part="select-all"] input')!;
    fireEvent.click(box);
    const [keys, request] = onSelectedKeysChange.mock.calls[0]!;
    expect(keys).toEqual(['ana', 'bruno', 'carla', 'fabio']);
    expect(request.reason).toBe('select');
    expect(box.checked).toBe(true);
  });

  it('marks the select-all box indeterminate when part of the pane is selected', () => {
    mount({ defaultSelectedKeys: ['ana'] });
    const box = pane('source').querySelector<HTMLInputElement>('[data-part="select-all"] input')!;
    expect(box.indeterminate).toBe(true);
    expect(within(pane('source')).getByText('1 of 5 selected')).toBeInTheDocument();
  });

  it('filters a pane by label and description, without accents', () => {
    mount();
    const search = pane('source').querySelector<HTMLInputElement>('input[type="search"]')!;
    fireEvent.change(search, { target: { value: 'fabio' } });
    expect(keysIn('source')).toEqual(['fabio']);
    fireEvent.change(search, { target: { value: 'design' } });
    expect(keysIn('source')).toEqual(['ana']);
    expect(within(pane('source')).getByText('1 of 5 shown')).toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(pane('source').querySelector('[data-part="empty"][data-query]')).toHaveTextContent(
      'No matches',
    );
  });

  it('leaves a selected item the query hides where it is', () => {
    mount({ defaultSelectedKeys: ['ana', 'bruno'] });
    const search = pane('source').querySelector<HTMLInputElement>('input[type="search"]')!;
    fireEvent.change(search, { target: { value: 'bruno' } });
    fireEvent.click(button('move-to-target'));
    expect(keysIn('target')).toEqual(['bruno']);
  });

  it('draws the target in the collection order unless it can be reordered', () => {
    mount({ defaultTargetKeys: ['fabio', 'ana'] });
    expect(keysIn('target')).toEqual(['ana', 'fabio']);
    expect(button('move-up')).toBeNull();
  });

  it('reorders the target selection with the buttons and with Alt+ArrowUp', () => {
    const { onTargetKeysChange } = mount({
      reorderable: true,
      defaultTargetKeys: ['ana', 'bruno', 'carla'],
      defaultSelectedKeys: ['carla'],
    });
    fireEvent.click(button('move-up'));
    expect(keysIn('target')).toEqual(['ana', 'carla', 'bruno']);
    expect(onTargetKeysChange.mock.calls[0]![1].direction).toBe('reorder');

    fireEvent.keyDown(option('carla'), { key: 'ArrowUp', altKey: true });
    expect(keysIn('target')).toEqual(['carla', 'ana', 'bruno']);
  });

  it('appends a move at the end of a reorderable target', () => {
    mount({ reorderable: true, defaultTargetKeys: ['fabio'], defaultSelectedKeys: ['ana'] });
    fireEvent.click(button('move-to-target'));
    expect(keysIn('target')).toEqual(['fabio', 'ana']);
  });

  it('keeps a target key the collection does not hold, and marks it', () => {
    mount({ defaultTargetKeys: ['ghost'] });
    expect(keysIn('target')).toEqual(['ghost']);
    expect(
      option('ghost').querySelector('[data-part="indicator"][data-unresolved]'),
    ).not.toBeNull();
  });

  it('refuses every move when read-only or disabled', () => {
    const { onTargetKeysChange } = mount({ readOnly: true, defaultSelectedKeys: ['ana'] });
    fireEvent.click(button('move-to-target'));
    fireEvent.keyDown(option('ana'), { key: 'Enter' });
    expect(onTargetKeysChange).not.toHaveBeenCalled();
    expect(document.querySelector('[data-ui="transfer"]')).toHaveAttribute('data-readonly');
  });

  it('asks for the pane the switch names', () => {
    const onPaneChange = vi.fn();
    mount({ layout: 'steps', onPaneChange });
    const root = document.querySelector('[data-ui="transfer"]')!;
    expect(root).toHaveAttribute('data-layout', 'steps');
    expect(root).toHaveAttribute('data-pane', 'source');
    expect(pane('source')).toHaveAttribute('data-current');
    const radio = document.querySelector<HTMLInputElement>(
      '[data-part="switch"] input[value="target"]',
    )!;
    fireEvent.click(radio);
    expect(onPaneChange).toHaveBeenCalledTimes(1);
    expect(root).toHaveAttribute('data-pane', 'target');
    expect(pane('target')).toHaveAttribute('data-current');
  });

  it('submits one hidden input per target key under the name', () => {
    mount({ name: 'members', defaultTargetKeys: ['bruno', 'ana'] });
    const inputs = [...document.querySelectorAll<HTMLInputElement>('input[name="members"]')];
    expect(inputs.map((input) => input.value)).toEqual(['ana', 'bruno']);
  });

  it('takes its look from the defaults provider, and its own messages over the language', () => {
    render(
      <TransferDefaultsProvider size="sm">
        <Transfer items={ITEMS} messages={{ target: 'Granted', moveToTarget: 'Grant' }} />
      </TransferDefaultsProvider>,
    );
    expect(within(pane('source')).getByText('Available')).toBeInTheDocument();
    expect(within(pane('target')).getByText('Granted')).toBeInTheDocument();
    expect(button('move-to-target')).toHaveTextContent('Grant');
    expect(document.querySelector('[data-ui="transfer"]')).toHaveAttribute('data-size', 'sm');
  });

  it('speaks the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Transfer items={ITEMS} />
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(within(pane('source')).getByText('Disponíveis')).toBeInTheDocument();
    // language: en-US
    // language: pt-BR
    expect(button('move-to-target')).toHaveTextContent('Adicionar');
    // language: en-US
  });

  it('is named and disabled by the field around it, and its lists are not', () => {
    render(
      <Field disabled>
        <FieldLabel>Members</FieldLabel>
        <Transfer items={ITEMS} />
      </Field>,
    );
    const root = document.querySelector('[data-ui="transfer"]')!;
    const labelId = document.querySelector('[data-ui="field"] label, [data-part="label"]')?.id;
    expect(root).toHaveAttribute('aria-labelledby', labelId);
    expect(root).toHaveAttribute('data-disabled');
    expect(list('source')).toHaveAttribute(
      'aria-labelledby',
      pane('source').getAttribute('aria-labelledby'),
    );
  });

  it('reaches the lists through the handle', () => {
    let handle: TransferHandle | null = null;
    function Host() {
      const ref = useRef<TransferHandle>(null);
      handle = null;
      return (
        <Transfer
          handleRef={(value) => {
            ref.current = value;
            handle = value;
          }}
          items={ITEMS}
        />
      );
    }
    render(<Host />);
    act(() => handle!.focus('source'));
    expect(list('source').contains(document.activeElement)).toBe(true);
    expect(handle!.element).toBe(document.querySelector('[data-ui="transfer"]'));
  });

  it('hands focus to the other list when its own list empties', () => {
    mount({ items: ITEMS.slice(0, 2), defaultTargetKeys: ['bruno'] });
    act(() => option('ana').focus());
    fireEvent.keyDown(option('ana'), { key: 'Enter' });
    expect(keysIn('source')).toEqual([]);
    expect(list('target').contains(document.activeElement)).toBe(true);
  });

  it('announces what moved and where', async () => {
    mount({ defaultSelectedKeys: ['ana', 'bruno'] });
    fireEvent.click(button('move-to-target'));
    await vi.waitFor(() => expect(document.body.textContent).toContain('2 moved to Chosen'));
  });
});
