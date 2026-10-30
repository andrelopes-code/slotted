import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `date-range-picker` writes on its own. */
export interface DateRangePickerMessages {
  /**
   * The trigger's name once a range is chosen: focus returns to the trigger
   * when the surface closes, so the name carries both ends and the length.
   */
  readonly change: Message<{ start: string; end: string; length: string }>;
  /** The trigger's name while nothing is chosen. */
  readonly choose: Message;
  readonly clear: Message;
  readonly end: Message;
  readonly start: Message;
  /**
   * The phrases that count a run in days, both ends included: its length, and
   * the three ways a length limit is stated.
   */
  readonly days: DateRangePickerCountMessages;
  /** The same phrases, counting nights. */
  readonly nights: DateRangePickerCountMessages;
}

/**
 * The phrases that count a run in one unit. A type literal rather than an
 * interface, so the group reads as a record of messages.
 */
export type DateRangePickerCountMessages = {
  /** "4 nights", said by the band while the run is drawn. */
  readonly length: Message<{ count: number }>;
  /** "2 to 7 nights". */
  readonly between: Message<{ min: number; max: number }>;
  /** "at least 2 nights". */
  readonly atLeast: Message<{ min: number }>;
  /** "at most 7 nights". */
  readonly atMost: Message<{ max: number }>;
};

export const en: DateRangePickerMessages = {
  change: 'Change range, {start} – {end}, {length}',
  choose: 'Choose range',
  clear: 'Clear range',
  end: 'End',
  start: 'Start',
  days: {
    length: '{count, plural, one {# day} other {# days}}',
    between: '{min} to {max, plural, one {# day} other {# days}}',
    atLeast: 'at least {min, plural, one {# day} other {# days}}',
    atMost: 'at most {max, plural, one {# day} other {# days}}',
  },
  nights: {
    length: '{count, plural, one {# night} other {# nights}}',
    between: '{min} to {max, plural, one {# night} other {# nights}}',
    atLeast: 'at least {min, plural, one {# night} other {# nights}}',
    atMost: 'at most {max, plural, one {# night} other {# nights}}',
  },
};

export const dateRangePickerMessages: MessageFamily<'dateRangePicker', DateRangePickerMessages> = {
  name: 'dateRangePicker',
  base: en,
};
