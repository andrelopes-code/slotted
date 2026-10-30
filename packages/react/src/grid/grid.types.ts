import type { ComponentPropsWithoutRef, CSSProperties, HTMLAttributes, ReactNode } from 'react';

/**
 * A step on the space scale. Separation is chosen from the scale rather than
 * stated as a length, so a theme retunes every layout at once and no component
 * invents a rhythm of its own. `0` is the absence of separation.
 */
export type GridGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * A ceiling on the number of tracks, not a promise of them. The grid drops a
 * column whenever keeping it would take a cell below `minItemWidth`.
 */
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** The narrowest a cell may become before the grid drops a column. */
export type GridMinItemWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Across the flow, which for a cell is the block axis. */
export type GridAlign = 'start' | 'center' | 'end' | 'stretch';

/** Along the flow, which for a cell is the inline axis. */
export type GridJustify = 'start' | 'center' | 'end' | 'stretch';

export interface GridRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
  'data-ui': string;
  style?: CSSProperties | undefined;
}

export interface GridProps extends ComponentPropsWithoutRef<'div'> {
  /** Positions a child across the flow, inside its own cell. */
  align?: GridAlign | undefined;
  /** At most this many tracks. Absent, the grid fits as many as it can. */
  columns?: GridColumns | undefined;
  /** Separation between cells, as a step on the space scale. */
  gap?: GridGap | undefined;
  /** Positions a child along the flow, inside its own cell. */
  justify?: GridJustify | undefined;
  /** The narrowest a cell may become before a column is dropped. */
  minItemWidth?: GridMinItemWidth | undefined;
  /** Renders the wiring into another element when a div is the wrong claim. */
  render?: ((props: GridRootProps) => ReactNode) | undefined;
}
