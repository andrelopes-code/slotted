import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `date-picker` writes on its own. */
export interface DatePickerMessages {
  /**
   * The trigger's name once a date is chosen: focus returns to the trigger
   * when the surface closes, so the name carries the date (several joined by
   * dashes in a set).
   */
  readonly change: Message<{ date: string }>;
  /** The trigger's name while nothing is chosen. */
  readonly choose: Message;
}

export const en: DatePickerMessages = {
  change: 'Change date, {date}',
  choose: 'Choose date',
};

export const datePickerMessages: MessageFamily<'datePicker', DatePickerMessages> = {
  name: 'datePicker',
  base: en,
};
