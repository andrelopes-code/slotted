import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/** The type step the group and every box inside it sit at. */
export type CheckboxGroupSize = 'sm' | 'md' | 'lg';

/** How the choices flow. `horizontal` wraps; a set of options is not a scroll region. */
export type CheckboxGroupOrientation = 'vertical' | 'horizontal';

/**
 * Whether the choice is a box beside a line of text or a framed surface whose
 * whole area is the target. `tile` is the name Carbon and Cloudscape give the
 * framed choice; Mantine and Chakra call it a card, which is a family here.
 */
export type CheckboxGroupVariant = 'plain' | 'tile';

/** Which side of its own label a box is on. */
export type CheckboxGroupLabelPlacement = 'end' | 'start';

/** Why the selection moved. A set of boxes can produce exactly these two. */
export type CheckboxGroupSelectionReason = Extract<
  ChangeRequest<readonly string[]>['reason'],
  'pointer' | 'keyboard'
>;

/** What an application sets once for every checkbox group under it. */
export interface CheckboxGroupDefaults {
  labelPlacement: CheckboxGroupLabelPlacement;
  variant: CheckboxGroupVariant;
  orientation: CheckboxGroupOrientation;
  size: CheckboxGroupSize;
}

export interface CheckboxGroupDefaultsProviderProps extends Partial<CheckboxGroupDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What the group hands every box inside it. A box reads this instead of being
 * told: a consumer writes the options and nothing else, and a box used outside
 * a group behaves as itself.
 */
export interface CheckboxGroupContextValue {
  /** Every value the group commands, when the consumer named them. */
  allValues: readonly string[] | undefined;
  disabled: boolean | undefined;
  invalid: boolean | undefined;
  labelPlacement: CheckboxGroupLabelPlacement;
  variant: CheckboxGroupVariant;
  name: string | undefined;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  /** Asks the group to replace its whole selection. Used by the parent box. */
  requestAll: (checked: boolean, reason: CheckboxGroupSelectionReason, source: unknown) => void;
  size: CheckboxGroupSize;
  /** Asks the group to add or remove one value. */
  toggle: (value: string, reason: CheckboxGroupSelectionReason, source: unknown) => void;
  value: readonly string[];
}

/**
 * What `render` receives, written against `HTMLAttributes<HTMLElement>` so it
 * can be spread onto any element — which is what makes the substitution real.
 */
export interface CheckboxGroupRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-orientation': CheckboxGroupOrientation;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-size': CheckboxGroupSize;
  'data-ui': string;
  'data-variant': CheckboxGroupVariant;
}

export interface CheckboxGroupProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'> {
  /**
   * Every value the group commands, in the order a parent box restores them.
   * It is what makes a parent checkbox possible: `checked` is every value
   * selected, `indeterminate` is some of them, and neither can be derived from
   * a selection alone.
   */
  allValues?: readonly string[] | undefined;
  /** The selection an uncontrolled group starts from, read once. */
  defaultValue?: readonly string[] | undefined;
  /**
   * Unstated rather than `false`, so the group defers to the field around it.
   * Stated, it wins, and it reaches every box as the native attribute.
   */
  disabled?: boolean | undefined;
  /** Unstated rather than `false`. Writes `aria-invalid` and `data-invalid`. */
  invalid?: boolean | undefined;
  /** Defaults to the provider, then to `end`. Reaches every box. */
  labelPlacement?: CheckboxGroupLabelPlacement | undefined;
  /** Defaults to the provider, then to `plain`. Handed to every choice. */
  variant?: CheckboxGroupVariant | undefined;
  /** The submission name every box in the group shares. */
  name?: string | undefined;
  /** Called before the selection moves, with the request that carries the reason. */
  onValueChange?:
    ((value: readonly string[], request: ChangeRequest<readonly string[]>) => void) | undefined;
  /** Defaults to the provider, then to `vertical`. */
  orientation?: CheckboxGroupOrientation | undefined;
  /**
   * Unstated rather than `false`. Every box keeps its tab stop and its
   * contrast, announces `aria-readonly`, and refuses every change.
   */
  readOnly?: boolean | undefined;
  /** Renders the root into another element. */
  render?: ((props: CheckboxGroupRootProps) => ReactNode) | undefined;
  /** Unstated rather than `false`. Writes `aria-required` on the group. */
  required?: boolean | undefined;
  /**
   * Publishes how many of `allValues` are selected to the field around the
   * group, which draws it in the spare column of its label row — the channel a
   * text field opened for characters, and a count nothing surveyed publishes.
   */
  showCount?: boolean | undefined;
  /** Defaults to the field, then to the provider, then to `md`. */
  size?: CheckboxGroupSize | undefined;
  /** Present means controlled, for the life of the component. */
  value?: readonly string[] | undefined;
}
