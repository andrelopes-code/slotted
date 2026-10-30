import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `column-manager` writes on its own. */
export interface ColumnManagerMessages {
  readonly apply: Message;
  readonly cancel: Message;
  readonly hiddenBySpace: Message;
  readonly hiddenCount: Message<{ count: number }>;
  readonly inRow: Message;
  readonly moved: Message<{ column: string; position: number }>;
  readonly noResults: Message;
  readonly pin: Message<{ column: string }>;
  readonly pinEnd: Message;
  readonly pinnedEnd: Message;
  readonly pinnedStart: Message;
  readonly pinStart: Message;
  readonly reorder: Message<{ column: string }>;
  readonly required: Message;
  readonly reset: Message;
  readonly search: Message;
  readonly showAll: Message;
  readonly title: Message;
  readonly unpin: Message;
  readonly unpinned: Message;
  readonly visibleCount: Message<{ visible: number; total: number }>;
}

export const en: ColumnManagerMessages = {
  apply: 'Apply',
  cancel: 'Cancel',
  hiddenBySpace: 'Hidden for space',
  hiddenCount: '{count, plural, one {# hidden column} other {# hidden columns}}',
  inRow: 'Shown in row',
  moved: '{column} moved to position {position}',
  noResults: 'No columns match',
  pin: 'Pin {column}',
  pinEnd: 'Pin to end',
  pinnedEnd: 'Pinned to end',
  pinnedStart: 'Pinned to start',
  pinStart: 'Pin to start',
  reorder: 'Reorder {column}',
  required: 'Required',
  reset: 'Restore defaults',
  search: 'Search columns',
  showAll: 'Show all',
  title: 'Columns',
  unpin: 'Unpin',
  unpinned: 'Columns',
  visibleCount: '{visible} of {total} shown',
};

export const columnManagerMessages: MessageFamily<'columnManager', ColumnManagerMessages> = {
  name: 'columnManager',
  base: en,
};
