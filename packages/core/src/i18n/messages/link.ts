import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `link` writes on its own. */
export interface LinkMessages {
  readonly externalHint: Message;
}

export const en: LinkMessages = {
  externalHint: '(opens in a new tab)',
};

export const linkMessages: MessageFamily<'link', LinkMessages> = { name: 'link', base: en };
