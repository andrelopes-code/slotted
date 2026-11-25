import type { ClockModel } from './clock';
import { plainTime, SECONDS_PER_DAY, secondsOfDay, timeOfSeconds } from './plain-time';
import type { PlainTime } from './plain-time';
import { createTimeFormat } from './time-format';
import type { TimeFormat } from './time-format';

const HOUR = 3600;

/** A key of a ruler's handle, and the direction the document reads in. */
interface RulerKey {
  readonly key: string;
  readonly rtl: boolean;
}

/** Where a key moves a handle of the ruler: one step, one hour, or an end of the day. */
export function rulerKeyTarget(
  { key, rtl }: RulerKey,
  held: PlainTime,
  model: ClockModel,
  step: number,
): PlainTime | null {
  const at = secondsOfDay(held);
  const later = (by: number) => model.nearest(inDay(at + by), at + 1);
  const earlier = (by: number) => model.nearest(inDay(at - by), 0, at);

  switch (key) {
    case rtl ? 'ArrowLeft' : 'ArrowRight':
    case 'ArrowUp':
      return later(step);
    case rtl ? 'ArrowRight' : 'ArrowLeft':
    case 'ArrowDown':
      return earlier(step);
    case 'PageUp':
      return later(HOUR);
    case 'PageDown':
      return earlier(HOUR);
    case 'Home':
      return model.nearest(inDay(0));
    case 'End':
      return model.nearest(inDay(SECONDS_PER_DAY - 1));
    default:
      return null;
  }
}

/** The accepted time at a share of the day, counted from where the day starts. */
export function rulerTimeAt(share: number, model: ClockModel): PlainTime | null {
  return model.nearest(inDay(share * SECONDS_PER_DAY));
}

/** Every second hour as the scale writes it: "08:00", and "8 AM" where the day has halves. */
export function rulerScale(format: TimeFormat): string[] {
  const halves = format.hourCycle === 'h11' || format.hourCycle === 'h12';
  const hours = halves
    ? createTimeFormat({ granularity: 'hour', hourCycle: 12, locale: format.locale })
    : format;

  return Array.from({ length: 12 }, (_, index) => hours.format(plainTime(index * 2)));
}

/** Where a time stands on the day, as a percentage. */
export function rulerShare(time: PlainTime): number {
  return (secondsOfDay(time) / SECONDS_PER_DAY) * 100;
}

/** A time inside the day: a step past either end is the end. */
function inDay(seconds: number): PlainTime {
  return timeOfSeconds(Math.max(0, Math.min(SECONDS_PER_DAY - 1, Math.round(seconds))));
}
