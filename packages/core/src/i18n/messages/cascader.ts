import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `cascader` writes on its own. */
export interface CascaderMessages {
  readonly back: Message<{ label: string }>;
  readonly breadcrumb: Message;
  readonly clear: Message;
  readonly empty: Message;
  readonly failed: Message<{ label: string }>;
  readonly loading: Message;
  readonly noResults: Message<{ query: string }>;
  readonly placeholder: Message;
  readonly remove: Message<{ label: string }>;
  readonly results: Message<{ count: number }>;
  readonly retry: Message;
  readonly root: Message;
  readonly search: Message;
  readonly searchPlaceholder: Message;
  readonly summary: Message<{ count: number }>;
}

export const en: CascaderMessages = {
  back: 'Back to {label}',
  breadcrumb: 'Path',
  clear: 'Clear selection',
  empty: 'Nothing here',
  failed: 'Could not load {label}.',
  loading: 'Loading…',
  noResults: 'Nothing matches “{query}”.',
  placeholder: 'Choose…',
  remove: 'Remove {label}',
  results: '{count, plural, one {# result} other {# results}}',
  retry: 'Try again',
  root: 'All',
  search: 'Search',
  searchPlaceholder: 'Search…',
  summary: '{count} selected',
};

export const cascaderMessages: MessageFamily<'cascader', CascaderMessages> = {
  name: 'cascader',
  base: en,
};
