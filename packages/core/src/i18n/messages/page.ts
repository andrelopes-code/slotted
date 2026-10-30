import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `page` writes on its own. */
export interface PageMessages {
  readonly footer: Message;
}

export const en: PageMessages = {
  footer: 'Page actions',
};

export const pageMessages: MessageFamily<'page', PageMessages> = { name: 'page', base: en };
