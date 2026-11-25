import type { PickerPreset, PlainTime, TimeGranularity } from '@slotted/core/date';
import type { PartialMessages, TimePickerMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type { ClockSlotState } from '../clock';
import type { TimeFieldHourCycle } from '../time-field';

/** Where the surface opens, before the positioner has read the room. */
export type TimePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

export type TimePickerSize = 'sm' | 'md' | 'lg';
export type TimePickerVariant = 'outline' | 'subtle' | 'plain';

/** What an application sets once for every time picker under it. */
export interface TimePickerDefaults {
  /** Whether the panel keeps a draft until Apply. */
  confirm: boolean;
  granularity: TimeGranularity;
  hourCycle: TimeFieldHourCycle | undefined;
  placement: TimePickerPlacement;
  size: TimePickerSize;
  /** Seconds between two offered times. */
  step: number;
  timeZone: string | undefined;
  variant: TimePickerVariant;
}

export interface TimePickerDefaultsProviderProps extends Partial<TimePickerDefaults> {
  children?: ReactNode | undefined;
}

export interface TimePickerRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-granularity': TimeGranularity;
  'data-invalid'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': TimePickerSize;
  'data-ui': string;
  'data-variant': TimePickerVariant;
  ref?: Ref<HTMLElement> | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface TimePickerHandle {
  /** Puts focus on the first segment of the field. */
  focus(): void;
  open(): void;
  close(): void;
}

export interface TimePickerProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  value?: PlainTime | null | undefined;
  defaultValue?: PlainTime | null | undefined;
  onValueChange?:
    ((value: PlainTime | null, request: ChangeRequest<PlainTime | null>) => void) | undefined;

  /** Present means the consumer owns whether the surface is showing. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;

  min?: PlainTime | undefined;
  max?: PlainTime | undefined;
  isTimeUnavailable?: ((time: PlainTime) => boolean) | undefined;

  /** Seconds between two offered times. Ignored when `options` states the list. */
  step?: number | undefined;
  /**
   * The times to offer, stated rather than stepped: a clinic open at 09:00,
   * 09:20 and 13:45, a broadcast schedule, a set of second-level marks.
   */
  options?: readonly PlainTime[] | undefined;
  /** What one whole time of `options` draws. The button around it is the clock's. */
  renderSlot?: ((state: ClockSlotState) => ReactNode) | undefined;

  /** BCP 47. Unset, the language in force (`SlottedProvider`) decides. */
  locale?: string | undefined;
  timeZone?: string | undefined;
  hourCycle?: TimeFieldHourCycle | undefined;
  granularity?: TimeGranularity | undefined;
  referenceTime?: PlainTime | undefined;

  size?: TimePickerSize | undefined;
  variant?: TimePickerVariant | undefined;
  placement?: TimePickerPlacement | undefined;
  /**
   * Whether the panel keeps a draft until Apply. `false` writes the value on
   * the press that completes the time, and closes. On by default.
   */
  confirm?: boolean | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;

  clearable?: boolean | undefined;
  relative?: boolean | undefined;
  name?: string | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's two names, and what the panel says of a refused time.
   */
  messages?: PartialMessages<TimePickerMessages> | undefined;

  /** The consumer's own shortcuts, after `Now`. The panel writes what each one is. */
  presets?: readonly PickerPreset<PlainTime>[] | undefined;
  /** Steps from now, in seconds. An empty list draws none. */
  offsets?: readonly number[] | undefined;
  /** What the footer says when nothing is wrong. */
  footer?: ReactNode | undefined;

  render?: ((props: TimePickerRootProps) => ReactNode) | undefined;
  ref?: Ref<TimePickerHandle> | undefined;
}
