import type { FamilyTranslator, PartialMessages, TimelineMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type {
  TimelineConnector,
  TimelineGrowing,
  TimelineOrder,
  TimelinePlacement,
  TimelineSide,
  TimelineTimeFormat,
  TimestampValue,
} from '@slotted/core/timeline';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export type TimelineMode = 'list' | 'feed';
export type TimelineOrientation = 'vertical' | 'horizontal';
export type TimelineVariant = 'solid' | 'outline' | 'subtle' | 'plain';
export type TimelineTone = 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type TimelineSize = 'sm' | 'md' | 'lg';
export type TimelineLevel = 2 | 3 | 4 | 5 | 6;
export type TimelineOpenReason = 'pointer' | 'keyboard' | 'programmatic';
export type TimelineLoadMoreReason = 'pointer' | 'keyboard' | 'scroll';
export type TimelineRevealReason = 'pointer' | 'keyboard';
export type TimelineOpenRequest = ChangeRequest<boolean>;
export type {
  TimelineConnector,
  TimelineGrowing,
  TimelineOrder,
  TimelinePlacement,
  TimelineSide,
  TimelineTimeFormat,
  TimestampValue,
};

export interface TimelineDefaults {
  mode?: TimelineMode | undefined;
  orientation?: TimelineOrientation | undefined;
  placement?: TimelinePlacement | undefined;
  order?: TimelineOrder | undefined;
  variant?: TimelineVariant | undefined;
  tone?: TimelineTone | undefined;
  size?: TimelineSize | undefined;
  growing?: TimelineGrowing | undefined;
  timeFormat?: TimelineTimeFormat | undefined;
  timeZone?: string | undefined;
  /** The moment relative readings count from, in epoch milliseconds. */
  now?: number | undefined;
  level?: TimelineLevel | undefined;
}

export interface TimelineDefaultsProviderProps extends TimelineDefaults {
  children?: ReactNode;
}

export interface TimelineRootProps extends ComponentPropsWithRef<'div'> {
  'data-growing': TimelineGrowing;
  'data-loading': '' | undefined;
  'data-mode': TimelineMode;
  'data-order': TimelineOrder;
  'data-orientation': TimelineOrientation;
  'data-part': string;
  'data-placement': TimelinePlacement;
  'data-reflow': 'false' | undefined;
  'data-size': TimelineSize;
  'data-tone': TimelineTone;
  'data-ui': string;
  'data-variant': TimelineVariant;
}

export interface TimelineProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /**
   * Whether the events on the past side of the current one are finished. Off,
   * because reaching "in transit" has not said "packed" is done.
   */
  autoComplete?: boolean | undefined;
  children?: ReactNode;
  /** The total number of events, when the application knows it. */
  count?: number | undefined;
  /** What stands in for the list while it has no events. */
  empty?: ReactNode | undefined;
  /** How many events have arrived and are held back behind the pill. */
  freshCount?: number | undefined;
  growing?: TimelineGrowing | undefined;
  /** The accessible name of the list. */
  label?: string | undefined;
  /** The id of the element that names the list, in place of `label`. */
  labelledBy?: string | undefined;
  level?: TimelineLevel | undefined;
  /** Whether more events are on their way. */
  loading?: boolean | undefined;
  /** For the timestamps; defaults to the language in force (`SlottedProvider`). */
  locale?: string | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * more control, the waiting line, the fresh pill, the empty line, the
   * current event's mark and a folded group's trigger.
   */
  messages?: PartialMessages<TimelineMessages> | undefined;
  mode?: TimelineMode | undefined;
  /** The moment relative readings count from, in epoch milliseconds. */
  now?: number | undefined;
  /** Asked when the reader presses the more control, or scrolls to it. */
  onLoadMore?: ((reason: TimelineLoadMoreReason, event?: unknown) => void) | undefined;
  /** Asked when the reader presses the pill that holds fresh events. */
  onReveal?: ((reason: TimelineRevealReason, event?: unknown) => void) | undefined;
  order?: TimelineOrder | undefined;
  orientation?: TimelineOrientation | undefined;
  placement?: TimelinePlacement | undefined;
  /** Whether a horizontal or alternating timeline becomes a column when narrow. */
  reflow?: boolean | undefined;
  render?: ((props: TimelineRootProps) => ReactNode) | undefined;
  size?: TimelineSize | undefined;
  timeFormat?: TimelineTimeFormat | undefined;
  timeZone?: string | undefined;
  tone?: TimelineTone | undefined;
  variant?: TimelineVariant | undefined;
}

export interface TimelineGroupRootProps extends ComponentPropsWithRef<'li'> {
  'data-open': '' | undefined;
  'data-part': string;
}

export interface TimelineGroupProps extends Omit<ComponentPropsWithRef<'li'>, 'children'> {
  children?: ReactNode;
  /** Whether the heading is a trigger that folds the group. */
  collapsible?: boolean | undefined;
  /** Where an uncontrolled group starts, read once. */
  defaultOpen?: boolean | undefined;
  /** The period's name, as the heading. */
  label: ReactNode;
  level?: TimelineLevel | undefined;
  /** Called before the group moves, with the request that carries the reason. */
  onOpenChange?: ((open: boolean, request: TimelineOpenRequest) => void) | undefined;
  /** Present means controlled, for the life of the group. */
  open?: boolean | undefined;
  render?: ((props: TimelineGroupRootProps) => ReactNode) | undefined;
}

export interface TimelineItemRootProps extends ComponentPropsWithRef<'li'> {
  'data-complete': '' | undefined;
  'data-connector': TimelineConnector | undefined;
  'data-current': '' | undefined;
  'data-loading': '' | undefined;
  'data-part': string;
  'data-side': TimelineSide | undefined;
  'data-tone': TimelineTone | undefined;
  'data-variant': TimelineVariant;
}

export interface TimelineItemProps extends Omit<ComponentPropsWithRef<'li'>, 'children' | 'title'> {
  /** The row of controls under the description. */
  actions?: ReactNode | undefined;
  /** Who did it: an avatar and a name. */
  actor?: ReactNode | undefined;
  /** More of the body, after the description and before the actions. */
  children?: ReactNode;
  /** Whether this event is finished. Outranks the derivation. */
  complete?: boolean | undefined;
  /** The line after this event; `dashed` is derived for the future side. */
  connector?: TimelineConnector | undefined;
  /** Whether this is the event the reader is at. */
  current?: boolean | undefined;
  description?: ReactNode | undefined;
  /** Whether this event is still arriving; the marker turns the ring. */
  loading?: boolean | undefined;
  /** What the marker holds in place of the dot: a glyph, an avatar. */
  marker?: ReactNode | undefined;
  /** What stands on the other side of the rail. */
  opposite?: ReactNode | undefined;
  render?: ((props: TimelineItemRootProps) => ReactNode) | undefined;
  /** Which side the body takes in `alternate`; parity otherwise. */
  side?: TimelineSide | undefined;
  /** When it happened. Written to `datetime` and formatted for the reader. */
  time?: TimestampValue | undefined;
  /** What the reader sees in place of the formatted time. */
  timeLabel?: ReactNode | undefined;
  title?: ReactNode | undefined;
  tone?: TimelineTone | undefined;
  variant?: TimelineVariant | undefined;
}

export interface TimelineTimeProps extends Omit<ComponentPropsWithRef<'time'>, 'children'> {
  /** What the reader sees in place of the formatted value. */
  children?: ReactNode;
  format?: TimelineTimeFormat | undefined;
  locale?: string | undefined;
  now?: number | undefined;
  timeZone?: string | undefined;
  value: TimestampValue;
}

/** What the timeline tells the parts inside it, and what `useTimeline` returns. */
export interface TimelineContextValue {
  autoComplete: boolean;
  /** The total, when the application stated it. */
  count: number | undefined;
  /** Moves keyboard focus to the article at an index, in feed mode. */
  focusItem: (index: number) => void;
  growing: TimelineGrowing;
  ids: { item: (index: number, part: string) => string; list: string };
  level: TimelineLevel;
  loading: boolean;
  locale: string;
  mode: TimelineMode;
  now: number | undefined;
  order: TimelineOrder;
  orientation: TimelineOrientation;
  placement: TimelinePlacement;
  size: TimelineSize;
  /** The family's words in the language in force, with this timeline's `messages` laid over them. */
  t: FamilyTranslator<TimelineMessages>;
  timeFormat: TimelineTimeFormat;
  timeZone: string | undefined;
  tone: TimelineTone;
  variant: TimelineVariant;
}

/** What the list that laid the events out tells every one of them. */
export interface TimelineListContextValue {
  /** The index of the event marked current, in DOM order, or -1. */
  currentIndex: number;
  /** How many events are laid out. */
  loaded: number;
}

/** What one event is told by the list or group that laid it out. */
export interface TimelineItemContextValue {
  index: number;
  /** Whether this is the last event of its own list, which draws no connector. */
  last: boolean;
}
