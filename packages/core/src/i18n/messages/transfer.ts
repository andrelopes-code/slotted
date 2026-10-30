import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `transfer` writes on its own. */
export interface TransferMessages {
  readonly actions: Message;
  readonly count: Message<{ total: number }>;
  readonly countFiltered: Message<{ shown: number; total: number }>;
  readonly countSelected: Message<{ selected: number; total: number }>;
  readonly empty: Message;
  readonly loading: Message;
  readonly moveAllToSource: Message;
  readonly moveAllToTarget: Message;
  readonly moved: Message<{ count: number; pane: string }>;
  readonly movedOne: Message<{ item: string; pane: string }>;
  readonly moveDown: Message;
  readonly moveToSource: Message;
  readonly moveToTarget: Message;
  readonly moveUp: Message;
  readonly noResults: Message;
  readonly paneCount: Message<{ pane: string; total: number }>;
  readonly panes: Message;
  readonly reorder: Message;
  readonly reordered: Message<{ item: string; position: number }>;
  readonly search: Message<{ pane: string }>;
  readonly selectAll: Message<{ pane: string }>;
  readonly source: Message;
  readonly target: Message;
}

export const en: TransferMessages = {
  actions: 'Move items',
  count: '{total, plural, one {# item} other {# items}}',
  countFiltered: '{shown} of {total} shown',
  countSelected: '{selected} of {total} selected',
  empty: 'No items',
  loading: 'Loading…',
  moveAllToSource: 'Remove all',
  moveAllToTarget: 'Add all',
  moved: '{count} moved to {pane}',
  movedOne: '{item} moved to {pane}',
  moveDown: 'Down',
  moveToSource: 'Remove',
  moveToTarget: 'Add',
  moveUp: 'Up',
  noResults: 'No matches',
  paneCount: '{pane} ({total})',
  panes: 'Lists',
  reorder: 'Order',
  reordered: '{item} moved to position {position}',
  search: 'Search {pane}',
  selectAll: 'Select all in {pane}',
  source: 'Available',
  target: 'Chosen',
};

export const transferMessages: MessageFamily<'transfer', TransferMessages> = {
  name: 'transfer',
  base: en,
};
