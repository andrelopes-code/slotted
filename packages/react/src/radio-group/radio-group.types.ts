import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/** The type step the group and every item inside it sit at. */
export type RadioGroupSize = 'sm' | 'md' | 'lg';

/** How the choices flow. `horizontal` wraps; a set of options is not a scroll region. */
export type RadioGroupOrientation = 'vertical' | 'horizontal';

/**
 * Whether the choice is a box beside a line of text or a framed surface whose
 * whole area is the target. `tile` is the name Carbon and Cloudscape give the
 * framed choice; Mantine and Chakra call it a card, which is a family here.
 */
export type RadioGroupVariant = 'plain' | 'tile';

/**
 * Which side of its own label the circle is on. It is never inherited from a
 * `field`: that family's `labelPlacement` answers where a field's label sits
 * relative to its control, and a radio's label is its own.
 */
export type RadioGroupLabelPlacement = 'end' | 'start';

/** Why the value moved. A radio group can produce exactly these two. */
export type RadioGroupSelectionReason = Extract<
  ChangeRequest<string>['reason'],
  'pointer' | 'keyboard'
>;

/**
 * The request a radio group emits. Its `previous` is `undefined` while nothing
 * has been chosen, which is the state the APG asks a group to start in, and a
 * request typed over `string` alone could not say so. Its `value` is always a
 * string: a radio cannot be unchosen by choosing it again.
 */
export type RadioGroupChangeRequest = ChangeRequest<string | undefined>;

/** What an application sets once for every radio group under it. */
export interface RadioGroupDefaults {
  labelPlacement: RadioGroupLabelPlacement;
  variant: RadioGroupVariant;
  orientation: RadioGroupOrientation;
  size: RadioGroupSize;
}

export interface RadioGroupDefaultsProviderProps extends Partial<RadioGroupDefaults> {
  children?: ReactNode | undefined;
}

/** What the group hands every item inside it. */
export interface RadioGroupContextValue {
  disabled: boolean | undefined;
  invalid: boolean | undefined;
  labelPlacement: RadioGroupLabelPlacement;
  variant: RadioGroupVariant;
  /**
   * The submission name every item shares, and the reason the platform treats
   * the set as one group. It is generated when the consumer writes none.
   */
  name: string;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  select: (value: string, reason: RadioGroupSelectionReason, source: unknown) => boolean;
  size: RadioGroupSize;
  value: string | undefined;
}

/** What `render` receives for the group's root. */
export interface RadioGroupRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-label-placement': RadioGroupLabelPlacement;
  'data-orientation': RadioGroupOrientation;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-size': RadioGroupSize;
  'data-ui': string;
  'data-variant': RadioGroupVariant;
}

/** What `render` receives for one item. */
export interface RadioRootProps extends HTMLAttributes<HTMLElement> {
  'data-checked'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-part': string;
}

export interface RadioGroupProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'> {
  /** The value an uncontrolled group starts from, read once. */
  defaultValue?: string | undefined;
  /**
   * Unstated rather than `false`, so the group defers to the field around it.
   * Stated, it wins, and it reaches every item as the native attribute.
   */
  disabled?: boolean | undefined;
  /** Unstated rather than `false`. Writes `aria-invalid` and `data-invalid`. */
  invalid?: boolean | undefined;
  /** Defaults to the provider, then to `end`. Reaches every item. */
  labelPlacement?: RadioGroupLabelPlacement | undefined;
  /** Defaults to the provider, then to `plain`. Handed to every choice. */
  variant?: RadioGroupVariant | undefined;
  /**
   * The submission name the set shares. Generated when it is not written,
   * because grouping is by name within the form owner and an unnamed set is not
   * a set — the price is that an unnamed group inside a form submits under a
   * generated key.
   */
  name?: string | undefined;
  /** Called before the value moves, with the request that carries the reason. */
  onValueChange?: ((value: string, request: RadioGroupChangeRequest) => void) | undefined;
  /** Defaults to the provider, then to `vertical`. */
  orientation?: RadioGroupOrientation | undefined;
  /**
   * Unstated rather than `false`. Every item keeps its tab stop and its
   * contrast, the group announces `aria-readonly`, and every change is refused.
   */
  readOnly?: boolean | undefined;
  /** Renders the group's root into another element. */
  render?: ((props: RadioGroupRootProps) => ReactNode) | undefined;
  /** Unstated rather than `false`. Writes `aria-required` on the group. */
  required?: boolean | undefined;
  /** Defaults to the field, then to the provider, then to `md`. */
  size?: RadioGroupSize | undefined;
  /** Present means controlled, for the life of the component. */
  value?: string | undefined;
}

export interface RadioProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'children' | 'size' | 'type'
> {
  /** The label. It is the control's accessible name, through `for`. */
  children?: ReactNode | undefined;
  /** Help text below the label, wired with `aria-describedby`. */
  description?: ReactNode | undefined;
  /**
   * Unstated rather than `false`, so the item defers to the group. Stated, it
   * wins, and it is the native attribute — which is what makes the browser skip
   * the item with the arrow keys.
   */
  disabled?: boolean | undefined;
  /** Renders the item's root into another element. */
  render?: ((props: RadioRootProps) => ReactNode) | undefined;
  /** The value this item selects. It is what the group's value holds. */
  value: string;
}
