import { inject, InjectionToken } from '@angular/core';
import type { Signal } from '@angular/core';

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
 * WCAG 2.2 minimum in both axes at every step. `none` withdraws them.
 */
export type NumberFieldStepper = 'stacked' | 'split' | 'none';

/**
 * What happens to a value outside `min`…`max`. `blur` returns it to the range
 * at the commit, `strict` refuses the keystroke that would leave it, and `none`
 * keeps the value where the reader put it and reports `aria-invalid`.
 */
export type NumberFieldClamp = 'blur' | 'strict' | 'none';

/**
 * When the text takes the locale's shape.
 *
 * `change` regroups on every keystroke, so `1234567` reads as `1.234.567` while
 * it is being typed. Grouping exists to make a long number scannable, and the
 * moment a reader most needs to check a magnitude is the moment they are
 * getting it wrong. `commit` holds the reader's own text until blur, `Enter`, a
 * stepper press or a key step.
 *
 * Neither decides when the *number* moves. It moves on every keystroke that
 * parses, under both.
 */
export type NumberFieldFormatOn = 'change' | 'commit';

export interface NumberFieldDefaults {
  clamp: NumberFieldClamp;
  formatOn: NumberFieldFormatOn;
  size: NumberFieldSize;
  stepper: NumberFieldStepper;
  variant: NumberFieldVariant;
}

const FALLBACK: NumberFieldDefaults = {
  clamp: 'blur',
  formatOn: 'change',
  size: 'md',
  stepper: 'stacked',
  variant: 'outline',
};

export const NUMBER_FIELD_DEFAULTS = new InjectionToken<NumberFieldDefaults>(
  'slotted number field defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what its number fields look like, rather than
 * repeating the same inputs on every amount in a form. A control that states
 * any of them itself still wins.
 *
 * The locale and the two buttons' words come from the language in force
 * (`provideSlotted`): one locale for the whole application decides the decimal
 * separator, the grouping and the numbering system, and a form where one field
 * reads `1.234` as a thousand and another as one point two three four is a
 * form that loses money.
 */
export function provideNumberFieldDefaults(defaults: Partial<NumberFieldDefaults>) {
  return {
    provide: NUMBER_FIELD_DEFAULTS,
    useFactory: (): NumberFieldDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a number field renders as here, before it states anything of its own. */
export function injectNumberFieldDefaults(): NumberFieldDefaults {
  return inject(NUMBER_FIELD_DEFAULTS);
}

/**
 * What the frame needs to know about the control inside it, and what the
 * control needs the frame to call.
 *
 * It is an abstract class rather than an import so the two directives can
 * depend on each other without a cycle — the shape `field` and `text-field`
 * already have. The input provides itself as this, and the frame queries it.
 */
export abstract class SlNumberFieldControl {
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
  /** The raw number the family holds, for the hidden input the frame renders. */
  abstract readonly numberValue: Signal<number | null>;
  abstract readonly resolvedDisabled: Signal<boolean | undefined>;
  abstract readonly resolvedReadOnly: Signal<boolean | undefined>;
  abstract readonly resolvedInvalid: Signal<boolean | undefined>;
  /** Moves the value by one step and returns focus to it. */
  abstract stepBy(direction: 1 | -1, source: Event | undefined): void;
  /**
   * Moves the value by whole steps a `scrub` drag travelled, signed, by the
   * large step under `Shift` and the small one under `Alt`.
   */
  abstract scrubBy(steps: number, source: PointerEvent): void;
  /** The native element, which a scrub focuses and reads the direction from. */
  abstract readonly inputElement: HTMLInputElement;
}
