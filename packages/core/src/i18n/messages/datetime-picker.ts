import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `datetime-picker` writes on its own. */
export interface DatetimePickerMessages {
  /** The trigger's name once a moment is chosen, carrying it in words. */
  readonly change: Message<{ date: string }>;
  /** The trigger's name while nothing is chosen. */
  readonly choose: Message;
  /** What the panel says of a moment a bound or a predicate refuses. */
  readonly refused: Message;
}

export const en: DatetimePickerMessages = {
  change: 'Change date and time, {date}',
  choose: 'Choose date and time',
  refused: 'Not an accepted date and time',
};

export const datetimePickerMessages: MessageFamily<'datetimePicker', DatetimePickerMessages> = {
  name: 'datetimePicker',
  base: en,
};
