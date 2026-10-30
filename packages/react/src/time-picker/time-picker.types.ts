import type { PlainTime, TimeGranularity, TimeOption } from '@slotted/core/date';
import type { PartialMessages, TimePickerMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type { TimeFieldChangeRequest, TimeFieldHourCycle } from '../time-field';

/** Where the surface opens, before the positioner has read the room. */
export type TimePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

/**
 * Whether choosing a time closes the surface. `auto` closes, because one press
 * chooses a whole time — there is no second half to come back for.
 */
export type TimePickerCloseOnSelect = 'auto' | 'always' | 'never';

/** What a time a bound or the predicate refuses looks like in the list. */
export type TimePickerUnavailableOptions = 'disable' | 'hide';

export type TimePickerSize = 'sm' | 'md' | 'lg';
export type TimePickerVariant = 'outline' | 'subtle' | 'plain';

/** What an application sets once for every time picker under it. */
export interface TimePickerDefaults {
  closeOnSelect: TimePickerCloseOnSelect;
  granularity: TimeGranularity;
  hourCycle: TimeFieldHourCycle | undefined;
  /** How many rows the list may reach before it is cut. */
  maxOptions: number;
  placement: TimePickerPlacement;
  size: TimePickerSize;
  /** Seconds between two offered times. */
  step: number;
  timeZone: string | undefined;
  unavailableOptions: TimePickerUnavailableOptions;
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

/** What `renderOption` receives: the row's own state, and the time it holds. */
export interface TimePickerOptionState {
  readonly time: PlainTime;
  /** The whole time in the locale's shape, which is what the row draws. */
  readonly label: string;
  readonly selected: boolean;
  readonly current: boolean;
  readonly unavailable: boolean;
}

export interface TimePickerProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  value?: PlainTime | null | undefined;
  defaultValue?: PlainTime | null | undefined;
  onValueChange?: ((value: PlainTime | null, request: TimeFieldChangeRequest) => void) | undefined;

  /** Present means the consumer owns whether the surface is showing. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;

  /** Where the reader is in the list. Present means the consumer owns it. */
  highlightedValue?: PlainTime | null | undefined;
  defaultHighlightedValue?: PlainTime | null | undefined;
  onHighlightedValueChange?:
    ((value: PlainTime | null, request: ChangeRequest<PlainTime | null>) => void) | undefined;

  min?: PlainTime | undefined;
  max?: PlainTime | undefined;
  isTimeUnavailable?: ((time: PlainTime) => boolean) | undefined;

  /** Seconds between two offered times. Ignored when `options` states the list. */
  step?: number | undefined;
  /**
   * The times to offer, stated rather than stepped.
   *
   * A step describes a regular list and a great many real ones are not: a
   * clinic open at 09:00, 09:20 and 13:45, a broadcast schedule, a set of
   * second-level marks. This is what makes every arrangement expressible, and
   * it is why the family needs no column panel.
   */
  options?: readonly PlainTime[] | undefined;
  /** How many rows the list may reach before it is cut. */
  maxOptions?: number | undefined;
  unavailableOptions?: TimePickerUnavailableOptions | undefined;

  /** BCP 47. Unset, the language in force (`SlottedProvider`) decides. */
  locale?: string | undefined;
  timeZone?: string | undefined;
  hourCycle?: TimeFieldHourCycle | undefined;
  granularity?: TimeGranularity | undefined;
  referenceTime?: PlainTime | undefined;

  size?: TimePickerSize | undefined;
  variant?: TimePickerVariant | undefined;
  placement?: TimePickerPlacement | undefined;
  closeOnSelect?: TimePickerCloseOnSelect | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;

  clearable?: boolean | undefined;
  relative?: boolean | undefined;
  name?: string | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's two names, the now control, and what the panel says when it is
   * empty or cut short.
   */
  messages?: PartialMessages<TimePickerMessages> | undefined;

  /** The consumer's own shortcuts, in a column beside the list. */
  presets?: ReactNode | undefined;
  /** The consumer's own actions, under the list. */
  footer?: ReactNode | undefined;
  /** What one row draws. The row is the family's; what is in it is not. */
  renderOption?: ((state: TimePickerOptionState) => ReactNode) | undefined;

  render?: ((props: TimePickerRootProps) => ReactNode) | undefined;
  ref?: Ref<TimePickerHandle> | undefined;
}

export type { TimeOption };
