import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `tag` writes on its own. */
export interface TagMessages {
  readonly remove: Message;
}

export const en: TagMessages = {
  remove: 'Remove',
};

export const tagMessages: MessageFamily<'tag', TagMessages> = { name: 'tag', base: en };
