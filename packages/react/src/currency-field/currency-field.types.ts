import type { CurrencyChangeRequest, CurrencyUnit } from '@slotted/core/currency';
import type { CurrencyFieldMessages, PartialMessages } from '@slotted/core/i18n';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** The type step the control sits at, matching the field around it. */
export type CurrencyFieldSize = 'sm' | 'md' | 'lg';

/**
 * `control` is a field among fields, on the control scale. `display` is the
 * headline amount of an entry sheet: the figure at the 4xl step, the
 * currency's mark drawn apart from it and muted at a smaller step, and a rule
 * under it instead of a box.
 */
export type CurrencyFieldAppearance = 'control' | 'display';

/**
 * How much frame the control shows. The three every framed control in this
 * library ships: `outline` takes the ground it is placed on, `subtle` sinks
 * into the page, and `plain` shows nothing at rest, which is what a dense
 * table of amounts needs.
 */
export type CurrencyFieldVariant = 'outline' | 'subtle' | 'plain';

/**
 * How the reader types the amount.
 *
 * `cents` is the cash register: digits enter at the minor unit and shift left,
 * so `1234` is `R$ 12,34`. The separator is never typed and the caret has one
 * legal position.
 *
 * `natural` is the spreadsheet, and the model `number-field` uses: the text is
 * the reader's until a commit, and the separator is typed like any other
 * character. It is the right answer when an amount is edited rather than
 * entered.
 */
export type CurrencyFieldEntry = 'cents' | 'natural';

/**
 * Which edge the amount is set against. `end` by default: a column of amounts
 * is compared on its last digit, and the cents-first caret already lives there.
 */
export type CurrencyFieldAlign = 'end' | 'start';

/**
 * Where the two steppers sit, when a product asks for them. They are withdrawn
 * by default on this family: an invoice total is typed, not nudged.
 */
export type CurrencyFieldStepper = 'stacked' | 'split' | 'none';

/**
 * What happens to an amount outside `min`…`max`.
 *
 * `blur` lets the reader type anything and returns the amount to the range at
 * the commit. `strict` refuses the keystroke that would leave it. `none` keeps
 * the amount where the reader put it and reports `aria-invalid`.
 */
export type CurrencyFieldClamp = 'blur' | 'strict' | 'none';

/**
 * When the text takes the locale's shape, under `entry="natural"`.
 *
 * `change` regroups on every keystroke, so an amount is scannable while it is
 * being typed; `commit` holds the reader's own text until blur, `Enter` or a
 * step. It is `number-field`'s axis, and it is here because `entry="natural"`
 * is `number-field`'s model.
 *
 * Under `entry="cents"` the text is generated from the digits after every edit,
 * so it has always taken the locale's shape as it is typed and this decides
 * nothing.
 */
export type CurrencyFieldFormatOn = 'change' | 'commit';

/**
 * How the currency is written beside the amount, or `none` when it is not
 * written at all: the amount becomes a plain decimal with the currency's own
 * fraction digits, so the symbol can live in a `start` adornment instead of
 * inside the value.
 */
export type CurrencyFieldDisplay = 'symbol' | 'narrowSymbol' | 'code' | 'name' | 'none';

/**
 * The two actions a consumer cannot express by passing a value: a keyboard
 * shortcut elsewhere on the page that steps this field. Both report reason
 * `programmatic`.
 */
export interface CurrencyFieldHandle {
  increment(): void;
  decrement(): void;
}

/** What an application sets once for every currency field under it. */
export interface CurrencyFieldDefaults {
  align: CurrencyFieldAlign;
  clamp: CurrencyFieldClamp;
  /** The currency every field under the provider is in, unless it says otherwise. */
  currency: string | undefined;
  currencyDisplay: CurrencyFieldDisplay;
  entry: CurrencyFieldEntry;
  formatOn: CurrencyFieldFormatOn;
  size: CurrencyFieldSize;
  stepper: CurrencyFieldStepper;
  unit: CurrencyUnit;
  variant: CurrencyFieldVariant;
}

export interface CurrencyFieldDefaultsProviderProps extends Partial<CurrencyFieldDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives for the frame. Written against
 * `HTMLAttributes<HTMLElement>` so it can be spread onto any element, which is
 * what makes the substitution real.
 */
export interface CurrencyFieldRootProps extends HTMLAttributes<HTMLElement> {
  'data-align': CurrencyFieldAlign;
  'data-appearance': CurrencyFieldAppearance;
  'data-disabled'?: '' | undefined;
  'data-entry': CurrencyFieldEntry;
  'data-invalid'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-size': CurrencyFieldSize;
  'data-stepper': CurrencyFieldStepper;
  'data-ui': string;
  'data-variant': CurrencyFieldVariant;
}

/**
 * `size` is omitted and redeclared: on an `input` it is the visible character
 * count, and this family's axis is a type step. `value`, `defaultValue`, `min`,
 * `max` and `step` are omitted and redeclared as numbers in `unit`.
 *
 * Everything else is the element's and reaches the element: `autoComplete` —
 * `transaction-amount` is the token a payment amount belongs to —`inputMode`,
 * `placeholder`, `aria-*` and every handler. `className` and `style` are the
 * exception, and they reach the frame, because the frame is what a consumer
 * sees. `name` and `form` reach the hidden input that carries the raw number.
 */
export interface CurrencyFieldProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'defaultValue' | 'max' | 'min' | 'size' | 'step' | 'type' | 'value'
> {
  /** Which edge the amount is set against. Defaults to the provider, then `end`. */
  align?: CurrencyFieldAlign | undefined;
  /**
   * A field among fields, or the headline amount of an entry sheet. Defaults
   * to `control`. `display` sets its own type step and draws a rule rather
   * than a box, so `size` and `variant` do not apply to it.
   */
  appearance?: CurrencyFieldAppearance | undefined;
  /**
   * Whether an emptied control holds nothing, or nought.
   *
   * Off, because an amount is not an optional number: a total, a price and a
   * balance are all nought when nothing is in them. Cleared, the control shows
   * `0,00` and emits `0`. On, it can be left empty and emits `null`.
   */
  allowEmpty?: boolean | undefined;
  /** Where an amount outside the range goes, and when. Defaults to the provider, then `blur`. */
  clamp?: CurrencyFieldClamp | undefined;
  /**
   * An ISO 4217 code: `BRL`, `USD`, `JPY`. It decides the symbol, the minor
   * units and therefore how far a digit shifts under cents-first entry.
   * Required here or on the provider: a currency field with no currency cannot
   * decide how many digits a cent has.
   */
  currency?: string | undefined;
  /** How the currency is written. Defaults to the provider, then `symbol`. */
  currencyDisplay?: CurrencyFieldDisplay | undefined;
  /** The amount an uncontrolled control starts from, read once, in `unit`. `null` is empty. */
  defaultValue?: number | null | undefined;
  /**
   * Unstated rather than `false`, so the control defers to the field around it.
   * Stated, it wins, and it is the native attribute.
   */
  disabled?: boolean | undefined;
  /** An adornment after the amount in the reading direction. */
  end?: ReactNode | undefined;
  /** How the reader types. Defaults to the provider, then `cents`. */
  entry?: CurrencyFieldEntry | undefined;
  /**
   * Any other `Intl.NumberFormatOptions` — `currencySign`, `signDisplay`,
   * `useGrouping`, `roundingMode`. Every key here wins over the family's own;
   * `style` and `currency` are the family's, because a currency field that
   * formatted a percentage would not be one.
   */
  format?: Intl.NumberFormatOptions | undefined;
  /**
   * When the text takes that shape under `entry="natural"`. Defaults to the
   * provider, then `change`. Cents-first entry generates the text after every
   * edit, so it decides nothing there.
   */
  formatOn?: CurrencyFieldFormatOn | undefined;
  /** Overrides the currency's own minor units, for a unit price quoted finer. */
  fractionDigits?: number | undefined;
  /** Reaches `increment()` and `decrement()`. `ref` reaches the input itself. */
  handle?: Ref<CurrencyFieldHandle> | undefined;
  /**
   * Unstated rather than `false`. Writes `aria-invalid` on the control and
   * `data-invalid` on the frame.
   */
  invalid?: boolean | undefined;
  /** The amount `Shift` and the page keys move by. Defaults to `step * 10`. */
  largeStep?: number | undefined;
  /**
   * BCP 47. Decides the separators and the numbering system, never the symbol.
   * Defaults to the language in force (`SlottedProvider`).
   */
  locale?: string | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * `increment` and `decrement` buttons' accessible names.
   */
  messages?: PartialMessages<CurrencyFieldMessages> | undefined;
  /** The largest amount the control holds, in `unit`. `End` goes here. */
  max?: number | undefined;
  /** The smallest amount the control holds. `Home` goes here, and it is what refuses a negative. */
  min?: number | undefined;
  /**
   * Called before the amount moves, with the request that carries the reason,
   * the currency and the exact integer of minor units.
   */
  onValueChange?: ((value: number | null, request: CurrencyChangeRequest) => void) | undefined;
  /** Unstated rather than `false`. Writes the native `readonly`. */
  readOnly?: boolean | undefined;
  /** Renders the frame into another element. */
  render?: ((props: CurrencyFieldRootProps) => ReactNode) | undefined;
  /** Defaults to the field, then to the provider, then to `md`. */
  size?: CurrencyFieldSize | undefined;
  /** The amount `Alt` moves by. Defaults to `step / 10`. */
  smallStep?: number | undefined;
  /** An adornment before the amount in the reading direction. */
  start?: ReactNode | undefined;
  /** The amount the arrows and the buttons move by, in `unit`. One major unit by default. */
  step?: number | undefined;
  /** Where an empty control starts stepping from. Defaults to `min`, then to nought. */
  stepFrom?: number | undefined;
  /** Where the two steppers sit. Defaults to the provider, then `none`. */
  stepper?: CurrencyFieldStepper | undefined;
  /**
   * The unit `value`, `defaultValue`, `min`, `max`, the steps, `stepFrom`,
   * `onValueChange` and the submitted amount are in. `major` is `12.34`;
   * `minor` is the integer `1234` of the currency's minor unit, which
   * `fractionDigits` decides when set. Entry, format and appearance do not
   * change. Defaults to the provider, then `major`.
   */
  unit?: CurrencyUnit | undefined;
  /** Present means controlled, for the life of the component. `null` is empty. */
  value?: number | null | undefined;
  /** Defaults to the provider, then to `outline`. */
  variant?: CurrencyFieldVariant | undefined;
  /**
   * Lets the wheel move the amount while the control has focus and the pointer
   * is over it. Off by default: a reader scrolling a form must not change an
   * amount by passing over it.
   */
  wheel?: boolean | undefined;
}

/**
 * A mark in `start` or `end` that moves the amount when it is dragged
 * sideways. A native `span`: every prop reaches it.
 */
export interface CurrencyFieldScrubProps extends ComponentPropsWithRef<'span'> {
  /** Pixels of horizontal travel per step. Defaults to 2. */
  sensitivity?: number | undefined;
}
