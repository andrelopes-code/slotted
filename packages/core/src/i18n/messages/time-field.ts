import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `time-field` writes on its own. */
export interface TimeFieldMessages {
  readonly clear: Message;
  readonly duration: Message;
  /** The preview of a duration that ran past midnight: the time it lands on, the next day. */
  readonly nextDay: Message<{ time: string }>;
  /** Each segment's name, the unit it holds; the placeholder is only drawn. */
  readonly hour: Message;
  readonly minute: Message;
  readonly second: Message;
  readonly dayPeriod: Message;
}

export const en: TimeFieldMessages = {
  clear: 'Clear',
  duration: 'Time as a duration from now',
  nextDay: '{time} next day',
  hour: 'hour',
  minute: 'minute',
  second: 'second',
  dayPeriod: 'AM/PM',
};

export const timeFieldMessages: MessageFamily<'timeField', TimeFieldMessages> = {
  name: 'timeField',
  base: en,
};
