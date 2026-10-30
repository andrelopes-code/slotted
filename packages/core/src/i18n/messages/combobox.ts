import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `combobox` writes on its own. */
export interface ComboboxMessages {
  readonly clear: Message;
  readonly count: Message<{ count: number }>;
  readonly create: Message<{ query: string }>;
  readonly empty: Message;
  readonly loading: Message;
  readonly trigger: Message;
}

export const en: ComboboxMessages = {
  clear: 'Clear',
  count: '{count, plural, one {# result} other {# results}}',
  create: 'Create “{query}”',
  empty: 'No matches',
  loading: 'Loading…',
  trigger: 'Show options',
};

export const comboboxMessages: MessageFamily<'combobox', ComboboxMessages> = {
  name: 'combobox',
  base: en,
};
