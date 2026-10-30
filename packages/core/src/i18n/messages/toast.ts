import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `toast` writes on its own. */
export interface ToastMessages {
  readonly close: Message;
  readonly label: Message;
}

export const en: ToastMessages = {
  close: 'Close',
  label: 'Notifications',
};

export const toastMessages: MessageFamily<'toast', ToastMessages> = { name: 'toast', base: en };
