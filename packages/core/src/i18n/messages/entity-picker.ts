import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `entity-picker` writes on its own. */
export interface EntityPickerMessages {
  readonly added: Message<{ label: string; count: number }>;
  readonly chips: Message<{ label: string; count: number }>;
  readonly chosen: Message;
  readonly clear: Message;
  readonly complete: Message<{ max: number }>;
  readonly count: Message<{ count: number }>;
  readonly create: Message<{ query: string }>;
  readonly empty: Message;
  readonly error: Message;
  readonly favorites: Message;
  readonly loading: Message;
  /** A chip whose record is on its way, named by its id. */
  readonly loadingChip: Message<{ id: string }>;
  readonly minQuery: Message<{ count: number }>;
  readonly more: Message<{ count: number }>;
  readonly moreLabel: Message<{ count: number }>;
  readonly recent: Message;
  readonly remove: Message<{ label: string }>;
  readonly removed: Message<{ label: string; count: number }>;
  readonly results: Message;
  readonly retry: Message;
  readonly scope: Message;
  readonly trigger: Message;
  readonly unresolved: Message;
  /** A chip whose record the source could not find, named by its id. */
  readonly unresolvedChip: Message<{ id: string }>;
}

export const en: EntityPickerMessages = {
  added: '{label} added, {count} chosen',
  chips: '{label}, {count} chosen',
  chosen: 'Chosen',
  clear: 'Clear',
  complete: 'Limit of {max} reached',
  count: '{count, plural, one {# result} other {# results}}',
  create: 'Create “{query}”',
  empty: 'No results',
  error: 'Couldn’t load results',
  favorites: 'Favorites',
  loading: 'Loading…',
  loadingChip: 'Loading…, {id}',
  minQuery: 'Type {count, plural, one {# or more character} other {# or more characters}}',
  more: '+{count}',
  moreLabel: '{count} more chosen',
  recent: 'Recent',
  remove: 'Remove {label}',
  removed: '{label} removed, {count} chosen',
  results: 'Results',
  retry: 'Try again',
  scope: 'Search in',
  trigger: 'Show results',
  unresolved: 'Unavailable',
  unresolvedChip: 'Unavailable, {id}',
};

export const entityPickerMessages: MessageFamily<'entityPicker', EntityPickerMessages> = {
  name: 'entityPicker',
  base: en,
};
