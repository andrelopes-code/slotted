import { daysBetween } from './plain-date';
import type { PlainDate } from './plain-date';

/** A shortcut of a picker: its name, and the value it writes or how to resolve it. */
export interface PickerPreset<V> {
  readonly label: string;
  readonly value: V | (() => V);
}

/** How far a date is from another, in words: "in 5 days", "yesterday", "today". */
export function relativeDays(from: PlainDate, to: PlainDate, locale?: string | undefined): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    daysBetween(from, to),
    'day',
  );
}

/** A preset resolved now: "in 30 days" is a different date every day. */
export function presetValue<V>(preset: PickerPreset<V>): V {
  return typeof preset.value === 'function' ? (preset.value as () => V)() : preset.value;
}
