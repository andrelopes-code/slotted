import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

/**
 * A step on the space scale. Separation is chosen from the scale rather than
 * stated as a length, so a theme retunes every layout at once and no component
 * invents a rhythm of its own. `0` is the absence of separation.
 */
export type InlineGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Across the flow, which for a run is the block axis. */
export type InlineAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

/** Along the flow, which for a run is the inline axis. */
export type InlineJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

export type InlineWrap = 'wrap' | 'nowrap';

export interface InlineRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  'data-ui': string;
}

export interface InlineProps extends ComponentPropsWithoutRef<'div'> {
  /** Positions items across the flow. `baseline` puts their type on one line. */
  align?: InlineAlign | undefined;
  /** Separation between items, as a step on the space scale. */
  gap?: InlineGap | undefined;
  /** Positions items along the flow, and distributes the space between them. */
  justify?: InlineJustify | undefined;
  /** Renders the wiring into another element when a div is the wrong claim. */
  render?: ((props: InlineRootProps) => ReactNode) | undefined;
  /** `nowrap` keeps one line, and overflows a container narrower than it. */
  wrap?: InlineWrap | undefined;
}
