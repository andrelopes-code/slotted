import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `prose` writes on its own. */
export interface ProseMessages {
  readonly scroll: Message;
}

export const en: ProseMessages = {
  scroll: 'Scrollable content',
};

export const proseMessages: MessageFamily<'prose', ProseMessages> = { name: 'prose', base: en };
