import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `date-field` writes on its own. */
export interface DateFieldMessages {
  readonly clear: Message;
  /** Each segment's name, the unit it holds; the placeholder is only drawn. */
  readonly day: Message;
  readonly month: Message;
  readonly year: Message;
}

export const en: DateFieldMessages = {
  clear: 'Clear',
  day: 'day',
  month: 'month',
  year: 'year',
};

export const dateFieldMessages: MessageFamily<'dateField', DateFieldMessages> = {
  name: 'dateField',
  base: en,
};
