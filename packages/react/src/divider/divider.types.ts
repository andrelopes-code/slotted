import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type DividerOrientation = 'horizontal' | 'vertical';

/** Where the label sits along the rule, in logical terms. */
export type DividerAlign = 'start' | 'center' | 'end';

export interface DividerRootProps extends HTMLAttributes<HTMLElement> {
  'aria-label'?: string | undefined;
  'aria-orientation'?: DividerOrientation | undefined;
  children?: ReactNode | undefined;
  'data-align'?: DividerAlign | undefined;
  'data-inset'?: string | undefined;
  'data-labelled'?: string | undefined;
  'data-orientation': DividerOrientation;
  'data-part': string;
  'data-ui': string;
  role?: string | undefined;
}

export interface DividerProps extends Omit<ComponentPropsWithoutRef<'hr'>, 'children'> {
  /** Where the label sits along the rule. Nothing without a label. */
  align?: DividerAlign | undefined;
  /** Takes the rule out of the accessibility tree, leaving only the picture. */
  decorative?: boolean | undefined;
  /** Stops the rule short of both ends of its container. */
  inset?: boolean | undefined;
  /**
   * A short string the rule is interrupted by, and the name it is announced
   * with. `hr` takes no content, so a labelled rule renders a `div` instead.
   */
  label?: string | undefined;
  orientation?: DividerOrientation | undefined;
  /**
   * Renders the wiring into another element — the `li` a menu separator has to
   * be, for one. The props carry the label when there is one, so spread them
   * and render the children.
   */
  render?: ((props: DividerRootProps) => ReactNode) | undefined;
}
