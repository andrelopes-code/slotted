import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/**
 * What the column bounds, rather than how big it is. `sm`/`md`/`lg` is this
 * library's word for control geometry; a container's maximum is chosen by what
 * is inside it, and a letter hides the choice.
 *
 * `measure` is the comfortable reading line, counted in characters so it
 * follows the inherited type and the reader's zoom. `full` removes the
 * maximum and keeps the inset.
 */
export type ContainerSize = 'measure' | 'content' | 'wide' | 'full' | 'bleed';

/**
 * The gap between the column and the edge of the space the container was
 * given, as a step on the space scale — the same scale Stack, Inline and Grid
 * take their `gap` from. `0` is the absence of an inset.
 */
export type ContainerInset = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Where the column sits when there is space left over. */
export type ContainerAlign = 'center' | 'start' | 'end';

/** What an application sets once for every container under it. */
export interface ContainerDefaults {
  align: ContainerAlign;
  inset: ContainerInset;
  size: ContainerSize;
}

export interface ContainerDefaultsProviderProps extends Partial<ContainerDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives. It names the family's own attributes over the native
 * ones every element shares; `ref` is not named because the element the
 * consumer renders decides its own type, and React passes it through the same
 * spread either way.
 */
export interface ContainerRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-align': ContainerAlign;
  'data-inset': string;
  'data-part': string;
  'data-size': ContainerSize;
  'data-ui': string;
}

export interface ContainerProps extends ComponentPropsWithRef<'div'> {
  /** Where the column sits when there is space left over. */
  align?: ContainerAlign | undefined;
  /** The gap between the column and the edge, as a step on the space scale. */
  inset?: ContainerInset | undefined;
  /** Renders the wiring into another element when a div is the wrong claim. */
  render?: ((props: ContainerRootProps) => ReactNode) | undefined;
  /** What the column bounds. */
  size?: ContainerSize | undefined;
}

export interface ContainerBreakoutRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
}

export interface ContainerBreakoutProps extends ComponentPropsWithRef<'div'> {
  /** Renders the wiring into another element when a div is the wrong claim. */
  render?: ((props: ContainerBreakoutRootProps) => ReactNode) | undefined;
}
