import { InjectionToken, inject } from '@angular/core';
import type {
  TimelineConnector,
  TimelineGrowing,
  TimelineOrder,
  TimelinePlacement,
  TimelineSide,
  TimelineTimeFormat,
  TimestampValue,
} from '@slotted/core/timeline';

export type TimelineMode = 'list' | 'feed';
export type TimelineOrientation = 'vertical' | 'horizontal';
export type TimelineVariant = 'solid' | 'outline' | 'subtle' | 'plain';
export type TimelineTone = 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type TimelineSize = 'sm' | 'md' | 'lg';
export type TimelineLevel = 2 | 3 | 4 | 5 | 6;
export type TimelineOpenReason = 'pointer' | 'keyboard' | 'programmatic';
export type TimelineLoadMoreReason = 'pointer' | 'keyboard' | 'scroll';
export type TimelineRevealReason = 'pointer' | 'keyboard';
export type {
  TimelineConnector,
  TimelineGrowing,
  TimelineOrder,
  TimelinePlacement,
  TimelineSide,
  TimelineTimeFormat,
  TimestampValue,
};

export const TIMELINE_DEFAULT_MODE: TimelineMode = 'list';
export const TIMELINE_DEFAULT_ORIENTATION: TimelineOrientation = 'vertical';
export const TIMELINE_DEFAULT_PLACEMENT: TimelinePlacement = 'end';
export const TIMELINE_DEFAULT_ORDER: TimelineOrder = 'oldest-first';
export const TIMELINE_DEFAULT_VARIANT: TimelineVariant = 'subtle';
export const TIMELINE_DEFAULT_TONE: TimelineTone = 'secondary';
export const TIMELINE_DEFAULT_SIZE: TimelineSize = 'md';
export const TIMELINE_DEFAULT_GROWING: TimelineGrowing = 'none';
export const TIMELINE_DEFAULT_TIME_FORMAT: TimelineTimeFormat = 'absolute';
export const TIMELINE_DEFAULT_LEVEL: TimelineLevel = 3;

export interface TimelineDefaults {
  mode?: TimelineMode;
  orientation?: TimelineOrientation;
  placement?: TimelinePlacement;
  order?: TimelineOrder;
  variant?: TimelineVariant;
  tone?: TimelineTone;
  size?: TimelineSize;
  growing?: TimelineGrowing;
  timeFormat?: TimelineTimeFormat;
  timeZone?: string;
  /** The moment relative readings count from, in epoch milliseconds. */
  now?: number;
  level?: TimelineLevel;
}

export const TIMELINE_DEFAULTS_TOKEN = new InjectionToken<TimelineDefaults>(
  'slotted timeline defaults',
  { providedIn: 'root', factory: (): TimelineDefaults => ({}) },
);

/**
 * An application decides once which way its timelines run, which side the
 * events take, how a timestamp is written and in which zone, the moment a
 * relative reading counts from. A timeline that states any of those itself
 * still wins: an explicit input is never overridden by the token. Its words
 * and locale come from the language in force (`provideSlotted`).
 */
export function provideTimelineDefaults(defaults: TimelineDefaults) {
  return { provide: TIMELINE_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectTimelineDefaults(): TimelineDefaults {
  return inject(TIMELINE_DEFAULTS_TOKEN);
}
