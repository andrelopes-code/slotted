import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `clock` writes on its own. */
export interface ClockMessages {
  readonly hours: Message;
  readonly minutes: Message;
  readonly seconds: Message;
  /** The name of the grid of whole times, when the times are stated. */
  readonly times: Message;
  /** The four parts of the day a twenty-four hour clock is cut into. */
  readonly night: Message;
  readonly morning: Message;
  readonly afternoon: Message;
  readonly evening: Message;
  /** What a clock with no time to offer says. */
  readonly empty: Message;
}

export const en: ClockMessages = {
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  times: 'Times',
  night: 'Night',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  empty: 'No time available',
};

export const clockMessages: MessageFamily<'clock', ClockMessages> = { name: 'clock', base: en };
