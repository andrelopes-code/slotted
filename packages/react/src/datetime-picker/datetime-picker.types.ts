import type { PlainDate, PlainDateTime, PlainTime, TimeGranularity } from '@slotted/core/date';
import type { DatetimePickerMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

import type {
  DateTimeFieldChangeRequest,
  DateTimeFieldHourCycle,
  DateTimeFieldSize,
  DateTimeFieldVariant,
} from '../datetime-field';

export type DateTimePickerSize = DateTimeFieldSize;
export type DateTimePickerVariant = DateTimeFieldVariant;
export type DateTimePickerHourCycle = DateTimeFieldHourCycle;

/** Where the panel hangs from the control. */
export type DateTimePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

/**
 * When the panel closes on a press.
 *
 * `auto` is the family's own rule, and it is what lets the panel need no
 * confirm button: it closes on the press that **completed** the value and stays
 * open otherwise — so a reader who opened a filled field to change both halves
 * is not shut out by their first press.
 */
export type DateTimePickerCloseOnSelect = 'auto' | 'always' | 'never';

/** Which surface focus lands on when the panel opens. */
export type DateTimePickerOpenTo = 'date' | 'time';

/** What a refused option does: stay and say so, or go. */
export type DateTimePickerUnavailableOptions = 'disable' | 'hide';

/**
 * Where the reader is in the panel.
 *
 * One highlight for two surfaces, because a two-surface panel has one answer to
 * that question and it is a datetime: the day the calendar has focused beside
 * the time the list has highlighted. Two models would be two names for one
 * place — and the contract schema holds one `current` capability for exactly
 * that reason.
 *
 * The time is `null` while the day the reader is on offers none, which is the
 * state the `empty` part draws.
 */
export interface DateTimePickerHighlight {
  readonly date: PlainDate;
  readonly time: PlainTime | null;
}

/** What one row of the list is handed when a consumer draws it. */
export interface DateTimePickerOptionRender {
  readonly time: PlainTime;
  readonly date: PlainDate;
  readonly label: string;
  readonly selected: boolean;
  readonly current: boolean;
  readonly unavailable: boolean;
}

/** What an application sets once for every datetime picker under it. */
export interface DateTimePickerDefaults {
  calendar: 'gregory';
  closeOnSelect: DateTimePickerCloseOnSelect;
  granularity: TimeGranularity;
  hourCycle: DateTimePickerHourCycle | undefined;
  /** How many rows the list may reach before it is cut. */
  maxOptions: number;
  openTo: DateTimePickerOpenTo;
  placement: DateTimePickerPlacement;
  size: DateTimePickerSize;
  /** Seconds between two offered times. */
  step: number;
  timeZone: string | undefined;
  unavailableOptions: DateTimePickerUnavailableOptions;
  variant: DateTimePickerVariant;
}

export interface DateTimePickerDefaultsProviderProps extends Partial<DateTimePickerDefaults> {
  children?: ReactNode | undefined;
}

export interface DateTimePickerRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-granularity': TimeGranularity;
  'data-invalid'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': DateTimePickerSize;
  'data-ui': string;
  'data-variant': DateTimePickerVariant;
  ref?: Ref<HTMLElement> | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface DateTimePickerHandle {
  focus(): void;
  open(): void;
  close(): void;
}

export interface DateTimePickerProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  value?: PlainDateTime | null | undefined;
  defaultValue?: PlainDateTime | null | undefined;
  onValueChange?:
    ((value: PlainDateTime | null, request: DateTimeFieldChangeRequest) => void) | undefined;

  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;

  /** Where the reader is in the panel: one highlight for both surfaces. */
  highlighted?: DateTimePickerHighlight | undefined;
  defaultHighlighted?: DateTimePickerHighlight | undefined;
  onHighlightedChange?:
    | ((
        highlighted: DateTimePickerHighlight,
        request: ChangeRequest<DateTimePickerHighlight>,
      ) => void)
    | undefined;

  /** The earliest whole value: where the range starts. */
  min?: PlainDateTime | undefined;
  /** The latest whole value: where the range ends. */
  max?: PlainDateTime | undefined;
  /** The earliest time of every day inside the range, beside `min`. */
  minTime?: PlainTime | undefined;
  /** The latest time of every day inside the range, beside `max`. */
  maxTime?: PlainTime | undefined;
  isDateUnavailable?: ((date: PlainDate) => boolean) | undefined;
  isTimeUnavailable?: ((time: PlainTime, date: PlainDate) => boolean) | undefined;

  /** Seconds between two offered times. The base is `min`'s time, or midnight. */
  step?: number | undefined;
  /**
   * The times the panel offers, stated rather than stepped.
   *
   * A step describes a regular list and a great many real ones are not: a
   * clinic open at 09:00, 09:20 and 13:45 cannot be written as a step, and a
   * predicate can only subtract from times that fall on one.
   */
  options?: readonly PlainTime[] | undefined;
  maxOptions?: number | undefined;
  unavailableOptions?: DateTimePickerUnavailableOptions | undefined;

  /** BCP 47. Writes the field, the grid, the list and the trigger's moment. Unset, the language in force decides. */
  locale?: string | undefined;
  timeZone?: string | undefined;
  hourCycle?: DateTimePickerHourCycle | undefined;
  granularity?: TimeGranularity | undefined;
  calendar?: 'gregory' | undefined;
  firstDayOfWeek?: number | undefined;
  /** How many months the calendar draws. */
  months?: number | undefined;
  weekNumbers?: boolean | undefined;
  /**
   * The datetime an empty field steps from, and the option the list opens on
   * when a day is pressed with the time half empty. One prop for both, because
   * they are the same question:
   * which datetime the family assumes where the reader has stated nothing.
   */
  referenceDateTime?: PlainDateTime | undefined;

  size?: DateTimePickerSize | undefined;
  variant?: DateTimePickerVariant | undefined;
  placement?: DateTimePickerPlacement | undefined;
  openTo?: DateTimePickerOpenTo | undefined;
  closeOnSelect?: DateTimePickerCloseOnSelect | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  clearable?: boolean | undefined;

  /** Whether `+`, `-` and `=` open the duration expression in the field. */
  relative?: boolean | undefined;

  name?: string | undefined;

  /**
   * Words laid over the catalog of the language in force, key by key: the
   * trigger's two names, the `now` button, what an empty day says and what a
   * cut list says.
   */
  messages?: PartialMessages<DatetimePickerMessages> | undefined;

  /** The consumer's own shortcuts, in the head beside `now`. */
  presets?: ReactNode | undefined;
  /** The consumer's own actions, under both surfaces. */
  footer?: ReactNode | undefined;
  /** What one row of the list holds. The row is the family's. */
  renderOption?: ((option: DateTimePickerOptionRender) => ReactNode) | undefined;

  render?: ((props: DateTimePickerRootProps) => ReactNode) | undefined;
  ref?: Ref<DateTimePickerHandle> | undefined;
}
