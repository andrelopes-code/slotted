import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `table-of-contents` writes on its own. */
export interface TableOfContentsMessages {
  readonly navigation: Message;
}

export const en: TableOfContentsMessages = {
  navigation: 'On this page',
};

export const tableOfContentsMessages: MessageFamily<'tableOfContents', TableOfContentsMessages> = {
  name: 'tableOfContents',
  base: en,
};
