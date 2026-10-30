import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `switch` writes on its own. */
export interface SwitchMessages {
  readonly loading: Message;
}

export const en: SwitchMessages = {
  loading: 'Saving',
};

export const switchMessages: MessageFamily<'switch', SwitchMessages> = { name: 'switch', base: en };
