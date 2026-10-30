import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `action-sheet` writes on its own. */
export interface ActionSheetMessages {
  readonly cancel: Message;
}

export const en: ActionSheetMessages = {
  cancel: 'Cancel',
};

export const actionSheetMessages: MessageFamily<'actionSheet', ActionSheetMessages> = {
  name: 'actionSheet',
  base: en,
};
