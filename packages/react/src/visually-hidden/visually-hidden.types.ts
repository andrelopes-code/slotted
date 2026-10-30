import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export interface VisuallyHiddenRootProps extends HTMLAttributes<HTMLElement> {
  /**
   * Present only on the variant that reveals itself. The stylesheet stops
   * matching while focus is inside it, rather than restoring each declaration
   * in a second rule.
   */
  'data-focusable'?: '' | undefined;
  'data-part': string;
  'data-ui': string;
}

export interface VisuallyHiddenProps extends ComponentPropsWithoutRef<'span'> {
  /**
   * Reveals the content while focus is inside it. The case is a skip link: the
   * sighted keyboard user who lands on it has to see where they are.
   */
  focusable?: boolean | undefined;
  /** Renders the wiring into another element when a span is the wrong claim. */
  render?: ((props: VisuallyHiddenRootProps) => ReactNode) | undefined;
}
