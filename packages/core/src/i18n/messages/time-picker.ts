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
  readonly empty: Message;
  readonly now: Message;
  readonly truncated: Message;
}

export const en: TimePickerMessages = {
  change: 'Change time, {time}',
  choose: 'Choose time',
  empty: 'No time available',
  now: 'Now',
  truncated: 'Only the first times are listed; type the rest into the field',
};

export const timePickerMessages: MessageFamily<'timePicker', TimePickerMessages> = {
  name: 'timePicker',
  base: en,
};
