import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `scroll-area` writes on its own. */
export interface ScrollAreaMessages {
  readonly label: Message;
}

export const en: ScrollAreaMessages = {
  label: 'Scrollable content',
};

export const scrollAreaMessages: MessageFamily<'scrollArea', ScrollAreaMessages> = {
  name: 'scrollArea',
  base: en,
};
