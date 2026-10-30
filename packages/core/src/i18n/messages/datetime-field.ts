import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `datetime-field` writes on its own. */
export interface DatetimeFieldMessages {
  readonly clear: Message;
  readonly duration: Message;
  /** Each segment's name, the unit it holds; the placeholder is only drawn. */
  readonly day: Message;
  readonly month: Message;
  readonly year: Message;
  readonly hour: Message;
  readonly minute: Message;
  readonly second: Message;
  readonly dayPeriod: Message;
}

export const en: DatetimeFieldMessages = {
  clear: 'Clear',
  duration: 'Date and time as a duration from now',
  day: 'day',
  month: 'month',
  year: 'year',
  hour: 'hour',
  minute: 'minute',
  second: 'second',
  dayPeriod: 'AM/PM',
};

export const datetimeFieldMessages: MessageFamily<'datetimeField', DatetimeFieldMessages> = {
  name: 'datetimeField',
  base: en,
};
