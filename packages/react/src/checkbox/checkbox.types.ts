import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/** The type step the control sits at, matching the field or group around it. */
export type CheckboxSize = 'sm' | 'md' | 'lg';

/**
 * Whether the choice is a box beside a line of text or a framed surface whose
 * whole area is the target. `tile` is the name Carbon and Cloudscape give the
 * framed choice; Mantine and Chakra call it a card, which is a family here.
 */
export type CheckboxVariant = 'plain' | 'tile';

/**
 * Which side of its own label the box is on. It is never inherited from a
 * `field`: that family's `labelPlacement` answers where a field's label sits
 * relative to its control, and a checkbox's label is its own.
 */
export type CheckboxLabelPlacement = 'end' | 'start';

/** Why the box moved. A checkbox can produce exactly these two. */
export type CheckboxCheckedReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard'
>;

/** What an application sets once for every checkbox under it. */
export interface CheckboxDefaults {
  labelPlacement: CheckboxLabelPlacement;
  size: CheckboxSize;
  variant: CheckboxVariant;
}

export interface CheckboxDefaultsProviderProps extends Partial<CheckboxDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives for the root, written against
 * `HTMLAttributes<HTMLElement>` so it can be spread onto any element.
 */
export interface CheckboxRootProps extends HTMLAttributes<HTMLElement> {
  'data-checked'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-indeterminate'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-label-placement': CheckboxLabelPlacement;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-size': CheckboxSize;
  'data-ui': string;
  'data-variant': CheckboxVariant;
}

/**
 * `size` is omitted and redeclared: on an `input` it is the visible character
 * count, and this family's axis is a type step. `checked` and `defaultChecked`
 * keep their names and their meaning; everything else the element accepts —
 * `name`, `value`, `form`, `required`, `autoFocus`, every `aria-*` and every
 * handler — reaches the `input`. `className` and `style` are the exception, and
 * they reach the root, because the root is what a consumer sees.
 */
export interface CheckboxProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'children' | 'size' | 'type'
> {
  /** The label. It is the control's accessible name, through `for`. */
  children?: ReactNode | undefined;
  /** Whether the box starts ticked, when the control is uncontrolled. */
  defaultChecked?: boolean | undefined;
  /** Help text below the label, wired with `aria-describedby`. */
  description?: ReactNode | undefined;
  /**
   * Unstated rather than `false`, so the box defers to the group or the field
   * around it. Stated, it wins, and it is the native attribute.
   */
  disabled?: boolean | undefined;
  /**
   * The mixed state. It is a state and never a third value of `checked`: the
   * submitted value stays boolean, and the platform agrees — `indeterminate` is
   * an IDL property that leaves `checked` alone.
   */
  indeterminate?: boolean | undefined;
  /** Unstated rather than `false`. Writes `aria-invalid` and `data-invalid`. */
  invalid?: boolean | undefined;
  /** Defaults to the group, then to the provider, then to `end`. */
  labelPlacement?: CheckboxLabelPlacement | undefined;
  /** Called before the box moves, with the request that carries the reason. */
  onCheckedChange?: ((checked: boolean, request: ChangeRequest<boolean>) => void) | undefined;
  /**
   * Commands the whole set its group was given. It is ticked when every value
   * is selected, mixed when some are, and its request replaces the selection
   * rather than toggling one value. Outside a group with `allValues` it does
   * nothing, because there is no set to command.
   */
  parent?: boolean | undefined;
  /**
   * Unstated rather than `false`. The platform has no `readonly` for a
   * checkbox, so the box keeps its tab stop, its ring and its contrast,
   * announces `aria-readonly` and refuses every change.
   */
  readOnly?: boolean | undefined;
  /** Renders the root into another element. */
  render?: ((props: CheckboxRootProps) => ReactNode) | undefined;
  /** Defaults to the group, then to the field, then to the provider, then to `md`. */
  size?: CheckboxSize | undefined;
  /**
   * Defaults to the group, then to the provider, then to `plain`. A `tile`
   * frames the choice and makes the whole surface its target.
   */
  variant?: CheckboxVariant | undefined;
}
