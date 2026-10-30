import type { OtpType } from '@slotted/core/otp';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, SyntheticEvent } from 'react';

/** The type step the control sits at, matching the field around it. */
export type OtpInputSize = 'sm' | 'md' | 'lg';

/**
 * How much frame each box shows. `outline` takes the ground it is placed on
 * and `subtle` sinks into the page — the two steps `text-field` draws, so a
 * code under a text field in one form is one form. There is no `plain`: a
 * code is never a cell.
 */
export type OtpInputVariant = 'outline' | 'subtle';

export type { OtpType as OtpInputType };

/**
 * Why the value moved. `keyboard` is the control's editing surface — typing,
 * pasting, the keyboard's own autofill, an IME commit — and `programmatic` is
 * the WebOTP API filling the code from an SMS.
 */
export type OtpInputValueReason = Extract<
  ChangeRequest<string>['reason'],
  'keyboard' | 'programmatic'
>;

/** What an application sets once for every code field under it. */
export interface OtpInputDefaults {
  attached: boolean;
  length: number;
  placeholder: string;
  size: OtpInputSize;
  type: OtpType;
  variant: OtpInputVariant;
}

export interface OtpInputDefaultsProviderProps extends Partial<OtpInputDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives for the root. Written against
 * `HTMLAttributes<HTMLElement>` so it can be spread onto any element, which is
 * what makes the substitution real.
 */
export interface OtpInputRootProps extends HTMLAttributes<HTMLElement> {
  'data-attached'?: '' | undefined;
  'data-complete'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-mask'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-size': OtpInputSize;
  'data-ui': string;
  'data-variant': OtpInputVariant;
}

/**
 * `size` is omitted and redeclared: on an `input` it is the visible character
 * count, and this family's axis is a type step. `type` is the family's own
 * axis — numeric or alphanumeric — and the element's `type` is decided by
 * `mask`. `maxLength` is `length`, and `pattern` is a `RegExp` tested per
 * character rather than the element's whole-value attribute. `value` and
 * `defaultValue` are strings.
 *
 * Everything else is the element's, and it reaches the element:
 * `autoComplete` (defaulting to `one-time-code`), `inputMode` (defaulting from
 * `type`), `name`, `form`, `autoFocus`, every `aria-*` and every handler.
 * `className` and `style` are the exception, and they reach the root, because
 * the root is what a consumer sees.
 */
export interface OtpInputProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'defaultValue' | 'maxLength' | 'pattern' | 'size' | 'type' | 'value'
> {
  /** Joins the boxes of a group along one seam. Defaults to the provider's. */
  attached?: boolean | undefined;
  /** Submits the owning form when the code is complete. */
  autoSubmit?: boolean | undefined;
  /** The value an uncontrolled control starts from, read once. */
  defaultValue?: string | undefined;
  /**
   * Unstated rather than `false`, so the control defers to the field around it.
   * Stated, it wins, and it is the native attribute.
   */
  disabled?: boolean | undefined;
  /**
   * How the boxes are partitioned: `[3, 3]` draws two groups of three with a
   * separator between them. The sum has to be `length`; a partition that does
   * not add up draws one group.
   */
  groups?: readonly number[] | undefined;
  /**
   * Unstated rather than `false`. Writes `aria-invalid` on the control and
   * `data-invalid` on the root.
   */
  invalid?: boolean | undefined;
  /** How many characters the code has. Defaults to the provider's, then 6. */
  length?: number | undefined;
  /**
   * Hides the characters: the control becomes `type="password"`, so the
   * platform treats the value as a secret, and each filled box shows a bullet.
   */
  mask?: boolean | undefined;
  /** Called with the value the moment it reaches `length` characters. */
  onComplete?: ((value: string) => void) | undefined;
  /** Called with what an edit lost to the filter, before the value moves. */
  onRejected?: ((text: string, event: SyntheticEvent<HTMLInputElement>) => void) | undefined;
  /** Called before the value moves, with the request that carries the reason. */
  onValueChange?: ((value: string, request: ChangeRequest<string>) => void) | undefined;
  /** Tested against each character; outranks `type` in what is accepted. */
  pattern?: RegExp | undefined;
  /**
   * What an empty box shows: one character repeats over every box, and a
   * string as long as the code distributes. Defaults to the provider's.
   */
  placeholder?: string | undefined;
  /** Unstated rather than `false`. Writes the native `readonly`. */
  readOnly?: boolean | undefined;
  /** Renders the root into another element. */
  render?: ((props: OtpInputRootProps) => ReactNode) | undefined;
  /** Defaults to the field, then to the provider, then to `md`. */
  size?: OtpInputSize | undefined;
  /**
   * Run over every edit before the filter: strip a `G-` prefix, uppercase a
   * code the reader typed in lowercase.
   */
  transform?: ((text: string) => string) | undefined;
  /** Which characters the code takes. Defaults to the provider's, then `numeric`. */
  type?: OtpType | undefined;
  /** Present means controlled, for the life of the component. */
  value?: string | undefined;
  /** Defaults to the provider, then to `outline`. */
  variant?: OtpInputVariant | undefined;
  /**
   * Asks the platform for the code the moment an SMS arrives, where the
   * WebOTP API exists. The request is abandoned when the form submits or the
   * control unmounts.
   */
  webOtp?: boolean | undefined;
}
