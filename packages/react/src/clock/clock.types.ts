import type { PlainTime, TimeGranularity } from '@slotted/core/date';
import type { ClockMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** Which grid of the clock a press was made in: a unit of the time, or a whole one. */
export type ClockUnitName = 'hour' | 'minute' | 'second' | 'slot';

export type ClockHourCycle = 12 | 24;

/** A request to move to another time, and the grid it was made in. */
export interface ClockChangeRequest extends ChangeRequest<PlainTime | null> {
  readonly unit: ClockUnitName;
}

/** What `renderSlot` is handed: the state of one whole time. */
export interface ClockSlotState {
  readonly time: PlainTime;
  /** The whole time in the locale's shape, which is what the slot draws. */
  readonly label: string;
  readonly selected: boolean;
  readonly unavailable: boolean;
}

/** The imperative action a consumer cannot express declaratively. */
export interface ClockHandle {
  /** Puts focus on the chosen hour, or on the one the clock opens at. */
  focus(): void;
}

export interface ClockRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-granularity': TimeGranularity;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-slots'?: '' | undefined;
  'data-ui': string;
  ref?: Ref<HTMLElement> | undefined;
}

export interface ClockProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  /** Present means the consumer owns the value. */
  value?: PlainTime | null | undefined;
  defaultValue?: PlainTime | null | undefined;
  onValueChange?: ((value: PlainTime | null, request: ClockChangeRequest) => void) | undefined;

  min?: PlainTime | undefined;
  max?: PlainTime | undefined;
  isTimeUnavailable?: ((time: PlainTime) => boolean) | undefined;
  /** Seconds between two offered times, counted from `min` or from midnight. Defaults to 900. */
  step?: number | undefined;
  /**
   * The times to offer, stated rather than stepped: a clinic open at 09:00,
   * 09:20 and 13:45. The clock then draws whole times under the part of the
   * day each one is in.
   */
  options?: readonly PlainTime[] | undefined;
  /** What one whole time draws. The button around it is the family's. */
  renderSlot?: ((state: ClockSlotState) => ReactNode) | undefined;

  /** The finest unit drawn. Defaults to `minute`. */
  granularity?: TimeGranularity | undefined;
  hourCycle?: ClockHourCycle | undefined;
  /** The time it is, whose hour is outlined. Unset, no hour is. */
  now?: PlainTime | undefined;
  /** BCP 47. Unset, the language in force (`SlottedProvider`) decides. */
  locale?: string | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;

  /** Words laid over the catalog of the language in force, key by key. */
  messages?: PartialMessages<ClockMessages> | undefined;

  render?: ((props: ClockRootProps) => ReactNode) | undefined;
  ref?: Ref<ClockHandle> | undefined;
}
