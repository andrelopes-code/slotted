import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `tree` writes on its own. */
export interface TreeMessages {
  readonly loaded: Message<{ label: string; count: number }>;
}

export const en: TreeMessages = {
  loaded: '{label}: {count, plural, one {# item} other {# items}} loaded',
};

export const treeMessages: MessageFamily<'tree', TreeMessages> = {
  name: 'tree',
  base: en,
};
