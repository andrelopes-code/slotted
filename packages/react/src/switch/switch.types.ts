import type { PartialMessages, SwitchMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/** The step the control sits at, matching the field around it. */
export type SwitchSize = 'sm' | 'md' | 'lg';

/**
 * What the thumb carries. `mark` draws a check when the switch is on and
 * nothing when it is off, which is what makes the state readable beyond color
 * and beyond position. `none` withdraws it, and is only correct where the
 * status word carries that instead.
 */
export type SwitchIndicator = 'mark' | 'none';

/**
 * Which side of its label the pill sits on. `start` is the settings row every
 * product writes: the label takes the free width and the control sits at the
 * end of it.
 */
export type SwitchLabelPlacement = 'end' | 'start';

/**
 * Why the switch moved. A pointer press reports a click count; Space reports
 * none but is trusted; `element.click()` reports neither.
 */
export type SwitchCheckedReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'programmatic'
>;

/** What an application sets once for every switch under it. */
export interface SwitchDefaults {
  indicator: SwitchIndicator;
  labelPlacement: SwitchLabelPlacement;
  size: SwitchSize;
}

export interface SwitchDefaultsProviderProps extends Partial<SwitchDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives for the root. Written against
 * `HTMLAttributes<HTMLElement>` so it can be spread onto any element, which is
 * what makes the substitution real.
 */
export interface SwitchRootProps extends HTMLAttributes<HTMLElement> {
  'data-checked'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-indicator': SwitchIndicator;
  'data-invalid'?: '' | undefined;
  'data-label-placement': SwitchLabelPlacement;
  'data-loading'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-size': SwitchSize;
  'data-ui': string;
}

/**
 * `size` is omitted and redeclared: on an `input` it is the visible character
 * count, and this family's axis is a control step. `checked` and
 * `defaultChecked` are redeclared so the state model owns them, and `type` and
 * `role` are withheld — a switch that is not a checkbox with the switch role
 * is a different component.
 *
 * Everything else is the element's, and it reaches the element: `name`,
 * `value`, `form`, `required`, `autoFocus`, `tabIndex`, every `aria-*` and
 * every handler. `className` and `style` are the exception, and they reach the
 * root, because the root is what a consumer sees.
 */
export interface SwitchProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'checked' | 'defaultChecked' | 'role' | 'size' | 'type'
> {
  /** Present means controlled, for the life of the component. */
  checked?: boolean | undefined;
  /**
   * The label, beside the pill. It is a real `label` pointing at the control
   * through `for`, so it names the switch and doubles its target — and a
   * switch written without one takes `aria-label` or the field's label instead.
   */
  children?: ReactNode | undefined;
  /** What an uncontrolled switch starts from, read once. A native form reset restores it. */
  defaultChecked?: boolean | undefined;
  /**
   * Unstated rather than `false`, so the control defers to the field around
   * it. Stated, it wins, and it is the native attribute: out of the tab order
   * and out of submission.
   */
  disabled?: boolean | undefined;
  /**
   * Help text under the label. It is never inside the label — inside, it would
   * join the accessible name, and help text that toggles a setting when it is
   * clicked is help text nobody reads — and it reaches the control through
   * `aria-describedby`.
   */
  description?: ReactNode | undefined;
  /** What the thumb carries. Defaults to the provider, then to `mark`. */
  indicator?: SwitchIndicator | undefined;
  /**
   * Unstated rather than `false`. Writes `aria-invalid` on the control and
   * `data-invalid` on the root.
   */
  invalid?: boolean | undefined;
  /** Which side of the label the pill sits on. Defaults to the provider, then to `end`. */
  labelPlacement?: SwitchLabelPlacement | undefined;
  /**
   * The value is not settled yet. Activation is refused, the geometry does not
   * change, and the pending label is announced politely after two seconds.
   */
  loading?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key:
   * `loading` is what a reader hears while the switch is pending.
   */
  messages?: PartialMessages<SwitchMessages> | undefined;
  /** Called before the switch moves, with the request that carries the reason. */
  onCheckedChange?: ((checked: boolean, request: ChangeRequest<boolean>) => void) | undefined;
  /**
   * Unstated rather than `false`. The native `readonly` attribute does nothing
   * on a checkbox, so this is `aria-readonly` plus a refused activation: the
   * control stays focusable, announced and submitted.
   */
  readOnly?: boolean | undefined;
  /** Renders the root into another element. */
  render?: ((props: SwitchRootProps) => ReactNode) | undefined;
  /** Defaults to the field, then to the provider, then to `md`. */
  size?: SwitchSize | undefined;
}
