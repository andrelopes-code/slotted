import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `time-picker` writes on its own. */
export interface TimePickerMessages {
  /**
   * The trigger's name once a time is chosen: focus returns to the trigger
   * when the surface closes, so the name carries the time.
   */
  readonly change: Message<{ time: string }>;
  /** The trigger's name while nothing is chosen. */
  readonly choose: Message;
  /** What the panel says of a time a bound or the predicate refuses. */
  readonly refused: Message;
}

export const en: TimePickerMessages = {
  change: 'Change time, {time}',
  choose: 'Choose time',
  refused: 'Not an accepted time',
};

export const timePickerMessages: MessageFamily<'timePicker', TimePickerMessages> = {
  name: 'timePicker',
  base: en,
};
