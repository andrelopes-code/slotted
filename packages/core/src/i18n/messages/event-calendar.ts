import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `event-calendar` writes on its own. */
export interface EventCalendarMessages {
  readonly allDay: Message;
  readonly calendars: Message;
  readonly cancelled: Message;
  readonly continues: Message;
  readonly dayEvents: Message<{ day: string }>;
  readonly dropInvalid: Message<{ title: string }>;
  readonly empty: {
    readonly day: Message;
    readonly month: Message;
    readonly week: Message;
  };
  readonly eventDetail: Message;
  readonly events: Message<{ count: number }>;
  readonly from: Message<{ time: string }>;
  readonly loading: Message;
  readonly more: Message;
  readonly moreEvents: Message<{ count: number }>;
  readonly navigation: Message;
  readonly next: {
    readonly day: Message;
    readonly list: Message;
    readonly month: Message;
    readonly week: Message;
  };
  /** `{direction}` is `forward` or `back`; `{hours}` the whole hours the clocks move; `{at}` the local time. */
  readonly offsetChange: Message<{ direction: string; hours: number; at: string }>;
  readonly offsetChangeShort: Message<{ direction: string; hours: number; at: string }>;
  readonly previous: {
    readonly day: Message;
    readonly list: Message;
    readonly month: Message;
    readonly week: Message;
  };
  readonly recurring: Message;
  readonly selected: Message<{ text: string }>;
  readonly tentative: Message;
  readonly timed: Message;
  /** An event carried over from an earlier day, named where it continues. */
  readonly titleContinues: Message<{ title: string }>;
  readonly today: Message;
  readonly until: Message<{ time: string }>;
  readonly view: {
    readonly day: Message;
    readonly list: Message;
    readonly month: Message;
    readonly week: Message;
  };
  readonly views: Message;
  readonly weekNumber: Message;
}

export const en: EventCalendarMessages = {
  allDay: 'All day',
  calendars: 'Calendars',
  cancelled: 'canceled',
  continues: 'continues',
  dayEvents: 'Events on {day}',
  dropInvalid: '{title} cannot move there',
  empty: {
    day: 'No events this day.',
    month: 'No events this month.',
    week: 'No events this week.',
  },
  eventDetail: 'Event',
  events: '{count, plural, =0 {no events} one {# event} other {# events}}',
  from: 'from {time}',
  loading: 'Loading events',
  more: 'more',
  moreEvents: '{count, plural, one {# more event} other {# more events}}',
  navigation: 'Move the calendar',
  next: {
    day: 'Next day',
    list: 'Next period',
    month: 'Next month',
    week: 'Next week',
  },
  offsetChange:
    'Clocks go {direction, select, forward {forward} other {back}} {hours, plural, one {# hour} other {# hours}} at {at}',
  offsetChangeShort: '{direction, select, forward {+} other {−}}{hours} h at {at}',
  previous: {
    day: 'Previous day',
    list: 'Previous period',
    month: 'Previous month',
    week: 'Previous week',
  },
  recurring: 'repeats',
  selected: 'Selected {text}',
  tentative: 'tentative',
  timed: 'Timed events',
  titleContinues: '{title}, continues',
  today: 'Today',
  until: 'until {time}',
  view: {
    day: 'Day',
    list: 'List',
    month: 'Month',
    week: 'Week',
  },
  views: 'View',
  weekNumber: 'Week',
};

export const eventCalendarMessages: MessageFamily<'eventCalendar', EventCalendarMessages> = {
  name: 'eventCalendar',
  base: en,
};
