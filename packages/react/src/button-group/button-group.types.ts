import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

import type { ButtonSize, ButtonTone, ButtonVariant } from '../button/button.types';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';

/**
 * Across the flow. `auto` is a value rather than an absent one: a joined bar
 * takes one block size across its flow on either axis, so a consumer who
 * mixes sizes gets a ragged width rather than a ragged edge, and the four
 * explicit values are the consumer overruling that.
 */
export type ButtonGroupAlign = 'auto' | 'start' | 'center' | 'end' | 'stretch';

/** Along the flow. Asking for it makes the group hold the line it distributes. */
export type ButtonGroupJustify = 'start' | 'center' | 'end' | 'between';

export interface ButtonGroupRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  'data-ui': string;
}

/**
 * The rule carries a part and no family identifier: `data-ui` names the family
 * on its root, and the separator is a part of the group rather than a family
 * of its own.
 */
export interface ButtonGroupSeparatorRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
}

/**
 * The three axes the group hands down to the buttons inside it, through the
 * button family's own defaults. A button that states one itself still wins:
 * how a group is laid out and how its buttons are painted are two questions,
 * and only the second one belongs to `button`.
 */
interface ButtonGroupPaintProps {
  size?: ButtonSize | undefined;
  tone?: ButtonTone | undefined;
  variant?: ButtonVariant | undefined;
}

/**
 * One shape and no other: the buttons share their edges, one border is painted
 * in each shared column, and only the two ends of the bar are rounded. There
 * is no prop that spaces the buttons apart and none that unjoins them — a
 * spaced row of buttons is `inline` or `stack` holding buttons.
 */
export interface ButtonGroupProps extends ComponentPropsWithRef<'div'>, ButtonGroupPaintProps {
  /** Positions the buttons across the flow. */
  align?: ButtonGroupAlign | undefined;
  /** The group holds the line and its buttons share it in equal segments. */
  fullWidth?: boolean | undefined;
  /** Positions the buttons along the flow, which makes the group hold the line. */
  justify?: ButtonGroupJustify | undefined;
  orientation?: ButtonGroupOrientation | undefined;
  /** Renders the wiring into another element when a div is the wrong claim. */
  render?: ((props: ButtonGroupRootProps) => ReactNode) | undefined;
}

export interface ButtonGroupSeparatorProps extends ComponentPropsWithRef<'div'> {
  /**
   * Drops the rule out of the accessibility tree. Use it when the boundary is
   * cosmetic; a boundary that carries meaning is better said by a nested group
   * with a name of its own.
   */
  decorative?: boolean | undefined;
  render?: ((props: ButtonGroupSeparatorRootProps) => ReactNode) | undefined;
}
