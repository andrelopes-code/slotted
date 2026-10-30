import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `tags-input` writes on its own. */
export interface TagsInputMessages {
  readonly added: Message<{ label: string; count: number }>;
  /** A value that went in although it fails the rule, with the reason it fails. */
  readonly addedInvalid: Message<{ label: string; count: number; reason: string }>;
  readonly clear: Message;
  readonly copied: Message<{ count: number }>;
  readonly count: Message<{ count: number }>;
  /** The control's own name followed by how many values it holds. */
  readonly countNamed: Message<{ label: string; count: number }>;
  readonly counter: Message<{ count: number; max: number }>;
  readonly duplicate: Message<{ label: string }>;
  /** The hint of a control whose values are also edited in place. */
  readonly editHint: Message;
  readonly hint: Message;
  readonly invalid: Message;
  readonly remove: Message<{ label: string }>;
  readonly removed: Message<{ label: string; count: number }>;
  readonly reorder: Message<{ label: string; position: number; count: number }>;
  /** The name of the list of suggestions under the field. */
  readonly suggestions: Message;
}

export const en: TagsInputMessages = {
  added: '{label} added, {count}',
  addedInvalid: '{label} added, {count}. {reason}',
  clear: 'Clear',
  copied: '{count} copied',
  count: '{count, plural, one {# value} other {# values}}',
  countNamed: '{label}, {count, plural, one {# value} other {# values}}',
  counter: '{count} of {max}',
  duplicate: '{label} is already in the list',
  editHint: 'Press Delete to remove a value. Press Enter to edit a value.',
  hint: 'Press Delete to remove a value.',
  invalid: 'Not a valid value',
  remove: 'Remove {label}',
  removed: '{label} removed, {count}',
  reorder: '{label}, position {position} of {count}',
  suggestions: 'Suggestions',
};

export const tagsInputMessages: MessageFamily<'tagsInput', TagsInputMessages> = {
  name: 'tagsInput',
  base: en,
};
