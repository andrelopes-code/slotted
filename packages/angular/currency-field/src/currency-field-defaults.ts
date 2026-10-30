import { inject, InjectionToken } from '@angular/core';
import type { Signal } from '@angular/core';
import type { CurrencyAffix, CurrencyUnit } from '@slotted/core/currency';

/** The type step the control sits at, matching the field around it. */
export type CurrencyFieldSize = 'sm' | 'md' | 'lg';

/**
 * How much frame the control shows. The three every framed control in this
 * library ships: `outline` takes the ground it is placed on, `subtle` sinks
 * into the page, and `plain` shows nothing at rest, which is what a dense
 * table of amounts needs.
 */
export type CurrencyFieldVariant = 'outline' | 'subtle' | 'plain';

/**
 * `control` is a field among fields, on the control scale. `display` is the
 * headline amount of an entry sheet: the figure at the 4xl step, the
 * currency's mark drawn apart from it and muted at a smaller step, and a rule
 * under it instead of a box.
 */
export type CurrencyFieldAppearance = 'control' | 'display';

/**
 * How the reader types the amount.
 *
 * `cents` is the cash register: digits enter at the minor unit and shift left,
 * so `1234` is `R$ 12,34`. The separator is never typed and the caret has one
 * legal position. `natural` is the spreadsheet, and the model `number-field`
 * uses: the text is the reader's until a commit.
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
 * What happens to an amount outside `min`…`max`. `blur` returns it to the range
 * at the commit, `strict` refuses the keystroke that would leave it, and `none`
 * keeps the amount where the reader put it and reports `aria-invalid`.
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
 * fraction digits, so the symbol can live in a `slCurrencyFieldStart` adornment
 * instead of inside the value.
 */
export type CurrencyFieldDisplay = 'symbol' | 'narrowSymbol' | 'code' | 'name' | 'none';

export interface CurrencyFieldDefaults {
  align: CurrencyFieldAlign;
  clamp: CurrencyFieldClamp;
  /** The currency every field under the token is in, unless it says otherwise. */
  currency: string | undefined;
  currencyDisplay: CurrencyFieldDisplay;
  entry: CurrencyFieldEntry;
  formatOn: CurrencyFieldFormatOn;
  size: CurrencyFieldSize;
  stepper: CurrencyFieldStepper;
  unit: CurrencyUnit;
  variant: CurrencyFieldVariant;
}

const FALLBACK: CurrencyFieldDefaults = {
  align: 'end',
  clamp: 'blur',
  currency: undefined,
  currencyDisplay: 'symbol',
  entry: 'cents',
  formatOn: 'change',
  size: 'md',
  stepper: 'none',
  unit: 'major',
  variant: 'outline',
};

export const CURRENCY_FIELD_DEFAULTS = new InjectionToken<CurrencyFieldDefaults>(
  'slotted currency field defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once which currency it charges in and how its
 * amounts are typed, rather than repeating the same inputs on every amount in a
 * form. A control that states any of them itself still wins. The locale and the
 * two buttons' words come from the language in force (`provideSlotted`).
 *
 * `currency` is the one worth setting first, and the only one a field cannot be
 * built without: a product has one currency in nine screens out of ten, and the
 * tenth states its own.
 */
export function provideCurrencyFieldDefaults(defaults: Partial<CurrencyFieldDefaults>) {
  return {
    provide: CURRENCY_FIELD_DEFAULTS,
    useFactory: (): CurrencyFieldDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a currency field renders as here, before it states anything of its own. */
export function injectCurrencyFieldDefaults(): CurrencyFieldDefaults {
  return inject(CURRENCY_FIELD_DEFAULTS);
}

/**
 * What the frame needs to know about the control inside it, and what the
 * control needs the frame to call.
 *
 * It is an abstract class rather than an import so the two directives can
 * depend on each other without a cycle — the shape `field`, `text-field` and
 * `number-field` already have. The input provides itself as this, and the
 * frame queries it.
 */
export abstract class SlCurrencyFieldControl {
  /** The identifier the steppers point `aria-controls` at. */
  abstract readonly controlId: Signal<string | null>;
  /** Whether a step up would leave the range, which is what disables a button. */
  abstract readonly atMax: Signal<boolean>;
  /** Whether a step down would. */
  abstract readonly atMin: Signal<boolean>;
  /** The submission name the frame's hidden input carries, if there is one. */
  abstract readonly submissionName: Signal<string | null>;
  /** The form that hidden input belongs to, when it is not the ancestor one. */
  abstract readonly submissionForm: Signal<string | null>;
  /** The amount in major units. */
  abstract readonly numberValue: Signal<number | null>;
  /** The amount in `unit`, for the hidden input the frame renders. */
  abstract readonly submittedValue: Signal<number | null>;
  abstract readonly resolvedDisabled: Signal<boolean | undefined>;
  abstract readonly resolvedReadOnly: Signal<boolean | undefined>;
  abstract readonly resolvedInvalid: Signal<boolean | undefined>;
  /** How the reader types, which the frame paints and the control owns. */
  abstract readonly resolvedEntry: Signal<CurrencyFieldEntry>;
  /** Moves the amount by one step and returns focus to it. */
  abstract stepBy(direction: 1 | -1, source: Event | undefined): void;
  /**
   * Moves the amount by whole steps a `scrub` drag travelled, signed, by the
   * large step under `Shift` and the small one under `Alt`.
   */
  abstract scrubBy(steps: number, source: PointerEvent): void;
  /** The native element, which a scrub focuses and reads the direction from. */
  abstract readonly inputElement: HTMLInputElement;
  /** The currency's mark the frame draws apart from the digits, at the display appearance. */
  abstract readonly affix: Signal<CurrencyAffix | null>;
}
