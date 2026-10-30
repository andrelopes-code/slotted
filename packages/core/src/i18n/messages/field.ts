import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `field` writes on its own. */
export interface FieldMessages {
  readonly help: Message;
  readonly optional: Message;
  readonly required: Message;
}

export const en: FieldMessages = {
  help: 'More information',
  optional: '(optional)',
  required: '(required)',
};

export const fieldMessages: MessageFamily<'field', FieldMessages> = { name: 'field', base: en };
