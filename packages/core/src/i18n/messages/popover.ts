import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `popover` writes on its own. */
export interface PopoverMessages {
  readonly close: Message;
}

export const en: PopoverMessages = {
  close: 'Close',
};

export const popoverMessages: MessageFamily<'popover', PopoverMessages> = {
  name: 'popover',
  base: en,
};
