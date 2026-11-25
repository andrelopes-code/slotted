import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** The words the panels of the date and time pickers share. */
export interface PickerPanelMessages {
  readonly apply: Message;
  readonly clear: Message;
  readonly presets: Message;
  readonly today: Message;
  readonly now: Message;
  /** The group of steps from the present: "+1 h". */
  readonly fromNow: Message;
  /** The group of lengths a run may be given. */
  readonly duration: Message;
  readonly time: Message;
  readonly chooseDay: Message;
  readonly chooseMonth: Message;
  readonly previousDay: Message;
  readonly nextDay: Message;
  readonly previousYear: Message;
  readonly nextYear: Message;
  /** The steppers of a run's length. */
  readonly decrease: Message;
  readonly increase: Message;
  /** The two ends of the ruler. */
  readonly startHandle: Message;
  readonly endHandle: Message;
  /** How far a date is from today, already in words, and the week it is in. */
  readonly dayInWeek: Message<{ day: string; week: number }>;
  /** What stands under an empty head. */
  readonly todayIs: Message<{ day: string }>;
  /** The head of a run: its two ends, and how many days it holds. */
  readonly runOfDays: Message<{ run: string; count: number }>;
  /** How far a time is from now, its length already written in the locale. */
  readonly ahead: Message<{ length: string }>;
  readonly behind: Message<{ length: string }>;
  /** How many days a set holds. */
  readonly days: Message<{ count: number }>;
  /** What the footer says when nothing is wrong: the step of a clock, the keys of a month. */
  readonly every: Message<{ length: string }>;
  readonly pageKeys: Message;
  readonly yearKeys: Message;
  /** The reason Apply is off: how much of a run is over its limit, or short of it. */
  readonly over: Message<{ length: string }>;
  readonly short: Message<{ length: string }>;
}

export const en: PickerPanelMessages = {
  apply: 'Apply',
  clear: 'Clear',
  presets: 'Shortcuts',
  today: 'Today',
  now: 'Now',
  fromNow: 'From now',
  duration: 'Duration',
  time: 'Time',
  chooseDay: 'Choose a day',
  chooseMonth: 'Choose a month',
  previousDay: 'Previous day',
  nextDay: 'Next day',
  previousYear: 'Previous year',
  nextYear: 'Next year',
  decrease: 'Shorten',
  increase: 'Lengthen',
  startHandle: 'Start',
  endHandle: 'End',
  dayInWeek: '{day}, week {week}',
  todayIs: 'Today: {day}',
  runOfDays: '{run}, {count, plural, one {# day} other {# days}}',
  ahead: 'in {length}',
  behind: '{length} ago',
  days: '{count, plural, one {# day} other {# days}}',
  every: 'Every {length}',
  pageKeys: 'Page Up and Page Down turn the month',
  yearKeys: 'Page Up and Page Down turn the year',
  over: '{length} over the limit',
  short: '{length} short of the minimum',
};

export const pickerPanelMessages: MessageFamily<'pickerPanel', PickerPanelMessages> = {
  name: 'pickerPanel',
  base: en,
};
