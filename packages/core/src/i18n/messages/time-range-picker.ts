import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `time-range-picker` writes on its own. */
export interface TimeRangePickerMessages {
  readonly bounds: Message;
  /**
   * The trigger's name once a run in order is chosen: focus returns to the
   * trigger when the surface closes, so the name carries both ends and the
   * duration.
   */
  readonly change: Message<{ start: string; end: string; length: string }>;
  /** The trigger's name once both ends are chosen out of order, which have no duration. */
  readonly changeReversed: Message<{ start: string; end: string }>;
  /** The trigger's name while nothing is chosen. */
  readonly choose: Message;
  readonly clear: Message;
  readonly end: Message;
  /** The length limits, each duration already written in the locale. */
  readonly limit: TimeRangePickerLimitMessages;
  readonly order: Message;
  readonly start: Message;
  readonly unavailable: Message;
}

/**
 * The three ways a length limit is stated. A type literal rather than an
 * interface, so the group reads as a record of messages.
 */
export type TimeRangePickerLimitMessages = {
  /** "30 min to 4 hr". */
  readonly between: Message<{ min: string; max: string }>;
  /** "at least 30 min". */
  readonly atLeast: Message<{ min: string }>;
  /** "at most 4 hr". */
  readonly atMost: Message<{ max: string }>;
};

export const en: TimeRangePickerMessages = {
  bounds: 'Outside the allowed range',
  change: 'Change range, {start} – {end}, {length}',
  changeReversed: 'Change range, {start} – {end}',
  choose: 'Choose range',
  clear: 'Clear range',
  end: 'End',
  limit: {
    between: '{min} to {max}',
    atLeast: 'at least {min}',
    atMost: 'at most {max}',
  },
  order: 'The end must come after the start',
  start: 'Start',
  unavailable: 'Crosses an unavailable time',
};

export const timeRangePickerMessages: MessageFamily<'timeRangePicker', TimeRangePickerMessages> = {
  name: 'timeRangePicker',
  base: en,
};
