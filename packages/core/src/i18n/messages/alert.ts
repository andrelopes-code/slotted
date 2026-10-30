import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `alert` writes on its own. */
export interface AlertMessages {
  readonly dismiss: Message;
}

export const en: AlertMessages = {
  dismiss: 'Dismiss',
};

export const alertMessages: MessageFamily<'alert', AlertMessages> = { name: 'alert', base: en };
