import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `dialog` writes on its own. */
export interface DialogMessages {
  readonly close: Message;
  readonly fullScreen: Message;
}

export const en: DialogMessages = {
  close: 'Close',
  fullScreen: 'Full screen',
};

export const dialogMessages: MessageFamily<'dialog', DialogMessages> = { name: 'dialog', base: en };
