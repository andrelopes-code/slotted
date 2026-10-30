import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `number-field` writes on its own. */
export interface NumberFieldMessages {
  readonly decrement: Message;
  readonly increment: Message;
}

export const en: NumberFieldMessages = {
  decrement: 'Decrease',
  increment: 'Increase',
};

export const numberFieldMessages: MessageFamily<'numberField', NumberFieldMessages> = {
  name: 'numberField',
  base: en,
};
