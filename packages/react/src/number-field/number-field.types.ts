import type { NumberFieldMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** The type step the control sits at, matching the field around it. */
export type NumberFieldSize = 'sm' | 'md' | 'lg';

/**
 * How much frame the control shows. The three `text-field` ships, unchanged:
 * `outline` takes the ground it is placed on, `subtle` sinks into the page, and
 * `plain` shows nothing at rest, which is what a dense table needs.
 */
export type NumberFieldVariant = 'outline' | 'subtle' | 'plain';

/**
 * Where the two steppers sit.
 *
 * `stacked` is one column at the inline end, which is what a form expects.
 * `split` puts decrement at the inline start and increment at the inline end —
 * the quantity picker's arrangement, and the only one whose targets clear the
 * WCAG 2.2 minimum in both axes at every step. `none` withdraws them, for a
 * dense table where an amount is typed and never spun.
 */
export type NumberFieldStepper = 'stacked' | 'split' | 'none';

/**
 * What happens to a value outside `min`…`max`.
 *
 * `blur` lets the reader type anything and returns the value to the range at
 * the commit. `strict` refuses the keystroke that would leave it. `none` keeps
 * the value where the reader put it and reports `aria-invalid`, which is what
 * the APG asks for when invalid input cannot be blocked.
 */
export type NumberFieldClamp = 'blur' | 'strict' | 'none';

/**
 * When the text takes the locale's shape.
 *
 * `change` regroups on every keystroke, so `1234567` reads as `1.234.567` while
 * it is being typed. Grouping exists to make a long number scannable, and the
 * moment a reader most needs to check a magnitude is the moment they are
 * getting it wrong. `commit` holds the reader's own text until blur, `Enter`, a
 * stepper press or a key step — the model React Aria, Base UI, Zag, Carbon and
 * Fluent ship, and the one to reach for when a value is pasted and audited
 * rather than typed.
 *
 * Neither decides when the *number* moves. It moves on every keystroke that
 * parses, under both.
 */
export type NumberFieldFormatOn = 'change' | 'commit';

/** Why the value moved. */
export type NumberFieldValueReason = Extract<
  ChangeRequest<number | null>['reason'],
  'keyboard' | 'pointer' | 'blur' | 'programmatic'
>;

/**
 * The two actions a consumer cannot express by passing a value: a keyboard
 * shortcut elsewhere on the page that steps this field. Both report reason
 * `programmatic`.
 */
export interface NumberFieldHandle {
  increment(): void;
  decrement(): void;
}

/** What an application sets once for every number field under it. */
export interface NumberFieldDefaults {
  clamp: NumberFieldClamp;
  formatOn: NumberFieldFormatOn;
  size: NumberFieldSize;
  stepper: NumberFieldStepper;
  variant: NumberFieldVariant;
}

export interface NumberFieldDefaultsProviderProps extends Partial<NumberFieldDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives for the frame. Written against
 * `HTMLAttributes<HTMLElement>` so it can be spread onto any element, which is
 * what makes the substitution real.
 */
export interface NumberFieldRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-size': NumberFieldSize;
  'data-stepper': NumberFieldStepper;
  'data-ui': string;
  'data-variant': NumberFieldVariant;
}

/**
 * `size` is omitted and redeclared: on an `input` it is the visible character
 * count, and this family's axis is a type step. `value`, `defaultValue`, `min`,
 * `max` and `step` are omitted and redeclared as numbers, because the contract's
 * value is a number and the element's own types admit strings.
 *
 * Everything else is the element's and reaches the element: `autoComplete`,
 * `inputMode`, `enterKeyHint`, `placeholder`, `aria-*` and every handler.
 * `className` and `style` are the exception, and they reach the frame, because
 * the frame is what a consumer sees. `name` and `form` reach the hidden input
 * that carries the raw number.
 */
export interface NumberFieldProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'defaultValue' | 'max' | 'min' | 'size' | 'step' | 'type' | 'value'
> {
  /** Where a value outside the range goes, and when. Defaults to the provider, then `blur`. */
  clamp?: NumberFieldClamp | undefined;
  /** The value an uncontrolled control starts from, read once. `null` is empty. */
  defaultValue?: number | null | undefined;
  /**
   * Unstated rather than `false`, so the control defers to the field around it.
   * Stated, it wins, and it is the native attribute.
   */
  disabled?: boolean | undefined;
  /** An adornment after the value in the reading direction. */
  end?: ReactNode | undefined;
  /**
   * How the value is written and read back, through `Intl.NumberFormat`.
   * Currency and percent are formattings of one numeric type, not types of
   * their own, and `maximumFractionDigits` is where precision is stated.
   */
  format?: Intl.NumberFormatOptions | undefined;
  /** When the text takes that shape. Defaults to the provider, then `change`. */
  formatOn?: NumberFieldFormatOn | undefined;
  /** Reaches `increment()` and `decrement()`. `ref` reaches the input itself. */
  handle?: Ref<NumberFieldHandle> | undefined;
  /**
   * Unstated rather than `false`. Writes `aria-invalid` on the control and
   * `data-invalid` on the frame.
   */
  invalid?: boolean | undefined;
  /** The amount `Shift` and the page keys move by. Defaults to `step * 10`. */
  largeStep?: number | undefined;
  /** BCP 47. Defaults to the language in force (`SlottedProvider`). */
  locale?: string | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * `increment` and `decrement` buttons' accessible names.
   */
  messages?: PartialMessages<NumberFieldMessages> | undefined;
  /** The largest value the control holds. `End` goes here. */
  max?: number | undefined;
  /** The smallest value the control holds. `Home` goes here. */
  min?: number | undefined;
  /** Called before the value moves, with the request that carries the reason. */
  onValueChange?:
    ((value: number | null, request: ChangeRequest<number | null>) => void) | undefined;
  /** Unstated rather than `false`. Writes the native `readonly`. */
  readOnly?: boolean | undefined;
  /** Renders the frame into another element. */
  render?: ((props: NumberFieldRootProps) => ReactNode) | undefined;
  /** Defaults to the field, then to the provider, then to `md`. */
  size?: NumberFieldSize | undefined;
  /** The amount `Alt` moves by. Defaults to `step / 10`. */
  smallStep?: number | undefined;
  /** Rounds a stepped value to a multiple of `step`, measured from `min`. */
  snapToStep?: boolean | undefined;
  /** An adornment before the value in the reading direction. */
  start?: ReactNode | undefined;
  /** The amount the arrows and the buttons move by. */
  step?: number | undefined;
  /** Where an empty control starts stepping from. Defaults to `min`, then to nought. */
  stepFrom?: number | undefined;
  /** Where the two steppers sit. Defaults to the provider, then `stacked`. */
  stepper?: NumberFieldStepper | undefined;
  /** Present means controlled, for the life of the component. `null` is empty. */
  value?: number | null | undefined;
  /** Defaults to the provider, then to `outline`. */
  variant?: NumberFieldVariant | undefined;
  /**
   * Lets the wheel move the value while the control has focus and the pointer
   * is over it. Off by default: a reader scrolling a form must not change an
   * amount by passing over it.
   */
  wheel?: boolean | undefined;
}

/**
 * A mark in `start` or `end` that moves the number when it is dragged
 * sideways. A native `span`: every prop reaches it.
 */
export interface NumberFieldScrubProps extends ComponentPropsWithRef<'span'> {
  /** Pixels of horizontal travel per step. Defaults to 2. */
  sensitivity?: number | undefined;
}
