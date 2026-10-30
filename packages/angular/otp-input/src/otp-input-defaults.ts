import { inject, InjectionToken } from '@angular/core';
import type { Signal } from '@angular/core';
import type { OtpSelection, OtpType } from '@slotted/core/otp';

/** The type step the control sits at, matching the field around it. */
export type OtpInputSize = 'sm' | 'md' | 'lg';

/**
 * How much frame each box shows. `outline` takes the ground it is placed on
 * and `subtle` sinks into the page — the two steps `text-field` draws. There
 * is no `plain`: a code is never a cell.
 */
export type OtpInputVariant = 'outline' | 'subtle';

export type { OtpType as OtpInputType };

export interface OtpInputDefaults {
  attached: boolean;
  length: number;
  placeholder: string;
  size: OtpInputSize;
  type: OtpType;
  variant: OtpInputVariant;
}

const FALLBACK: OtpInputDefaults = {
  attached: false,
  length: 6,
  placeholder: '',
  size: 'md',
  type: 'numeric',
  variant: 'outline',
};

export const OTP_INPUT_DEFAULTS = new InjectionToken<OtpInputDefaults>(
  'slotted otp input defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what its code fields look like — and how long
 * its codes are — rather than repeating the same inputs on every verification
 * screen. A control that states any of them itself still wins.
 *
 * `size` is the one the field outranks: a control inside a field takes the
 * field's step and this token answers only outside one.
 */
export function provideOtpInputDefaults(defaults: Partial<OtpInputDefaults>) {
  return {
    provide: OTP_INPUT_DEFAULTS,
    useFactory: (): OtpInputDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a code field renders as here, before it states anything of its own. */
export function injectOtpInputDefaults(): OtpInputDefaults {
  return inject(OTP_INPUT_DEFAULTS);
}

/**
 * What the frame needs to know about the control inside it, and what the
 * control needs the frame to call.
 *
 * It is an abstract class rather than an import so the two directives can
 * depend on each other without a cycle — the shape `text-field` already has.
 * The control provides itself as this, and the frame queries for it.
 */
export abstract class SlOtpInputState {
  /** The characters the element holds, cut to the code. */
  abstract readonly code: Signal<string>;
  /** Where the cursor or the selection is, while the control has focus. */
  abstract readonly selection: Signal<OtpSelection | null>;
  abstract readonly focused: Signal<boolean>;
  abstract readonly resolvedDisabled: Signal<boolean | undefined>;
  abstract readonly resolvedReadOnly: Signal<boolean | undefined>;
  abstract readonly resolvedInvalid: Signal<boolean | undefined>;
  /** Puts the cursor in the box at `index`, clamped to the value. */
  abstract pressAt(index: number): void;
}
