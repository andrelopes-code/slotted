import { ORGANIZATION_TIMEZONE } from './common';

/**
 * Time helpers (section 53.6). Instants are UTC ISO-8601 strings; business
 * dates are `YYYY-MM-DD` in the organization timezone unless stated otherwise.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
export const DAY_MS = 24 * HOUR;

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let cached = formatterCache.get(timeZone);
  if (!cached) {
    cached = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    formatterCache.set(timeZone, cached);
  }
  return cached;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function zonedParts(instant: string | number, timeZone = ORGANIZATION_TIMEZONE): ZonedParts {
  const parts = formatter(timeZone).formatToParts(new Date(instant));
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '0';
  return {
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    hour: Number(read('hour')) % 24,
    minute: Number(read('minute')),
    second: Number(read('second')),
    weekday: WEEKDAYS.indexOf(read('weekday')),
  };
}

const offsetCache = new Map<string, number>();

/**
 * Offset of `timeZone` from UTC in milliseconds at the given instant. Cached
 * per UTC day at noon; the one-hour drift around a DST switch hour is
 * accepted for demo timestamps.
 */
export function zoneOffsetMs(instantMs: number, timeZone = ORGANIZATION_TIMEZONE): number {
  const day = Math.floor(instantMs / DAY_MS);
  const key = `${timeZone}|${day}`;
  const cached = offsetCache.get(key);
  if (cached !== undefined) return cached;
  const noon = day * DAY_MS + DAY_MS / 2;
  const parts = zonedParts(noon, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const offset = asUtc - Math.floor(noon / 1000) * 1000;
  offsetCache.set(key, offset);
  return offset;
}

/** Converts wall-clock components in `timeZone` to a UTC instant (ms). */
export function zonedToInstantMs(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  timeZone = ORGANIZATION_TIMEZONE,
): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  const candidate = guess - zoneOffsetMs(guess, timeZone);
  const offset = zoneOffsetMs(candidate, timeZone);
  return guess - offset;
}

export function toIsoInstant(ms: number): string {
  // Second precision: `YYYY-MM-DDTHH:mm:ssZ`.
  return `${new Date(ms).toISOString().slice(0, 19)}Z`;
}

export function instantMs(instant: string): number {
  return Date.parse(instant);
}

export function addMs(instant: string, ms: number): string {
  return toIsoInstant(instantMs(instant) + ms);
}

export function addHours(instant: string, hours: number): string {
  return addMs(instant, hours * HOUR);
}

export function addMinutes(instant: string, minutes: number): string {
  return addMs(instant, minutes * MINUTE);
}

/** Business date (`YYYY-MM-DD`) of an instant in the given timezone. */
export function businessDateOf(instant: string, timeZone = ORGANIZATION_TIMEZONE): string {
  const ms = instantMs(instant);
  const local = new Date(ms + zoneOffsetMs(ms, timeZone));
  return formatBusinessDate(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate());
}

export function formatBusinessDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseBusinessDate(date: string): { year: number; month: number; day: number } {
  return {
    year: Number(date.slice(0, 4)),
    month: Number(date.slice(5, 7)),
    day: Number(date.slice(8, 10)),
  };
}

const dayNumberCache = new Map<string, number>();
const dateByDayNumber = new Map<number, string>();

/** Days since the Unix epoch for a business date (cached; dates repeat heavily). */
export function dayNumber(date: string): number {
  const cached = dayNumberCache.get(date);
  if (cached !== undefined) return cached;
  const { year, month, day } = parseBusinessDate(date);
  const value = Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
  dayNumberCache.set(date, value);
  // Only a business date answers for its day number: an instant read here ("…T13:00:00Z") would
  // otherwise come back from `dateFromDayNumber`, and every date computed after it with it.
  if (date.length === 10) dateByDayNumber.set(value, date);
  return value;
}

export function dateFromDayNumber(value: number): string {
  const cached = dateByDayNumber.get(value);
  if (cached !== undefined) return cached;
  const shifted = new Date(value * DAY_MS);
  const date = formatBusinessDate(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
  dateByDayNumber.set(value, date);
  dayNumberCache.set(date, value);
  return date;
}

/** Calendar-day arithmetic on business dates (no timezone involved). */
export function addDays(date: string, days: number): string {
  return dateFromDayNumber(dayNumber(date) + days);
}

export function diffDays(later: string, earlier: string): number {
  return dayNumber(later) - dayNumber(earlier);
}

export function compareDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function weekdayOf(date: string): number {
  // 1970-01-01 was a Thursday (4).
  return (((dayNumber(date) + 4) % 7) + 7) % 7;
}

export function isBusinessDay(date: string): boolean {
  const weekday = weekdayOf(date);
  return weekday !== 0 && weekday !== 6;
}

export function addBusinessDays(date: string, days: number): string {
  let current = date;
  let remaining = days;
  const step = days < 0 ? -1 : 1;
  while (remaining !== 0) {
    current = addDays(current, step);
    if (isBusinessDay(current)) remaining -= step;
  }
  return current;
}

export function lastBusinessDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let date = formatBusinessDate(year, month, lastDay);
  while (!isBusinessDay(date)) date = addDays(date, -1);
  return date;
}

/** Instant for a business date at a wall-clock time in the organization timezone. */
export function businessDateToInstant(
  date: string,
  hour = 9,
  minute = 0,
  timeZone = ORGANIZATION_TIMEZONE,
): string {
  const { year, month, day } = parseBusinessDate(date);
  return toIsoInstant(zonedToInstantMs(year, month, day, hour, minute, 0, timeZone));
}

export const BUSINESS_DAY_START_HOUR = 8;
export const BUSINESS_DAY_END_HOUR = 18;

interface DayBounds {
  weekday: number;
  dayStart: number;
  dayEnd: number;
  nextDay: number;
  nextDayStart: number;
}

const dayBoundsCache = new Map<number, DayBounds>();

/** Business-hour bounds of the organization-timezone day containing `instantMs`. */
function dayBoundsAt(instantMs: number): DayBounds {
  const offset = zoneOffsetMs(instantMs);
  const localDay = Math.floor((instantMs + offset) / DAY_MS);
  const cached = dayBoundsCache.get(localDay);
  if (cached) return cached;
  const local = new Date(localDay * DAY_MS);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth() + 1;
  const day = local.getUTCDate();
  const bounds: DayBounds = {
    weekday: local.getUTCDay(),
    dayStart: zonedToInstantMs(year, month, day, BUSINESS_DAY_START_HOUR),
    dayEnd: zonedToInstantMs(year, month, day, BUSINESS_DAY_END_HOUR),
    nextDay: zonedToInstantMs(year, month, day + 1, 0),
    nextDayStart: zonedToInstantMs(year, month, day + 1, BUSINESS_DAY_START_HOUR),
  };
  dayBoundsCache.set(localDay, bounds);
  return bounds;
}

/**
 * Business minutes between two instants, counting Monday–Friday 08:00–18:00
 * in the organization timezone (section 68.3).
 */
export function businessMinutesBetween(start: string, end: string): number {
  let cursor = instantMs(start);
  const finish = instantMs(end);
  if (finish <= cursor) return 0;
  let minutes = 0;
  while (cursor < finish) {
    const bounds = dayBoundsAt(cursor);
    if (bounds.weekday === 0 || bounds.weekday === 6 || cursor >= bounds.dayEnd) {
      cursor = bounds.nextDay;
      continue;
    }
    const from = Math.max(cursor, bounds.dayStart);
    const to = Math.min(finish, bounds.dayEnd);
    if (to > from) minutes += (to - from) / MINUTE;
    cursor = bounds.nextDay;
  }
  return Math.round(minutes);
}

/** Adds business minutes to an instant, skipping nights and weekends. */
export function addBusinessMinutes(start: string, businessMinutes: number): string {
  let cursor = instantMs(start);
  let remaining = businessMinutes;
  for (let guard = 0; guard < 10_000; guard += 1) {
    const bounds = dayBoundsAt(cursor);
    if (bounds.weekday === 0 || bounds.weekday === 6 || cursor >= bounds.dayEnd) {
      cursor = bounds.nextDayStart;
      continue;
    }
    if (cursor < bounds.dayStart) cursor = bounds.dayStart;
    const availableMinutes = (bounds.dayEnd - cursor) / MINUTE;
    if (remaining <= availableMinutes) return toIsoInstant(cursor + remaining * MINUTE);
    remaining -= availableMinutes;
    cursor = bounds.nextDayStart;
  }
  throw new RangeError('addBusinessMinutes exceeded its iteration guard');
}

export function addBusinessHours(start: string, hours: number): string {
  return addBusinessMinutes(start, hours * 60);
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function startOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
