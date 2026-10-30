import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `datetime-picker` writes on its own. */
export interface DatetimePickerMessages {
  /** The trigger's name once a moment is chosen, carrying it in words. */
  readonly change: Message<{ date: string }>;
  /** The trigger's name while nothing is chosen. */
  readonly choose: Message;
  readonly empty: Message;
  readonly now: Message;
  readonly truncated: Message;
}

export const en: DatetimePickerMessages = {
  change: 'Change date and time, {date}',
  choose: 'Choose date and time',
  empty: 'No time is available on this day.',
  now: 'Now',
  truncated: 'The list is cut short. Times past the end are typed into the field.',
};

export const datetimePickerMessages: MessageFamily<'datetimePicker', DatetimePickerMessages> = {
  name: 'datetimePicker',
  base: en,
};
