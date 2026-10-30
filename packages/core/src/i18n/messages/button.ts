import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `button` writes on its own. */
export interface ButtonMessages {
  readonly loading: Message;
}

export const en: ButtonMessages = {
  loading: 'Loading',
};

export const buttonMessages: MessageFamily<'button', ButtonMessages> = { name: 'button', base: en };
