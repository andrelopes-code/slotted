import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `currency-field` writes on its own. */
export interface CurrencyFieldMessages {
  readonly decrement: Message;
  readonly increment: Message;
}

export const en: CurrencyFieldMessages = {
  decrement: 'Decrease',
  increment: 'Increase',
};

export const currencyFieldMessages: MessageFamily<'currencyField', CurrencyFieldMessages> = {
  name: 'currencyField',
  base: en,
};
