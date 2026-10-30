import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

/**
 * A step on the space scale. Separation is chosen from the scale rather than
 * stated as a length, so a theme retunes every layout at once and no component
 * invents a rhythm of its own. `0` is the absence of separation.
 */
export type StackGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Across the flow, which for a stack is the inline axis. */
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

/** Along the flow, which for a stack is the block axis. */
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

export interface StackRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  'data-ui': string;
}

export interface StackProps extends ComponentPropsWithoutRef<'div'> {
  /** Positions children across the flow. Absent, they stretch. */
  align?: StackAlign | undefined;
  /** Separation between children, as a step on the space scale. */
  gap?: StackGap | undefined;
  /** Positions children along the flow; needs a block size to distribute. */
  justify?: StackJustify | undefined;
  /** Renders the wiring into another element when a div is the wrong claim. */
  render?: ((props: StackRootProps) => ReactNode) | undefined;
}
