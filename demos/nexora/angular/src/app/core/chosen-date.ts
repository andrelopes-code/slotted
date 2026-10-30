import type { CalendarValue } from '@slotted/angular/calendar';
import type { PlainDate } from '@slotted/core/date';

/**
 * The one date a single-mode `slDatePicker` holds. Its `valueChange` carries the calendar's
 * value for every selection mode, so a form that asks for one date narrows it here.
 */
export const chosenDate = (value: CalendarValue | undefined): PlainDate | null =>
  !value || Array.isArray(value) || 'start' in value ? null : value;
