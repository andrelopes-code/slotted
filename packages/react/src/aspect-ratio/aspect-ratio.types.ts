import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

/**
 * The five ratios a product decides once, named for what they hold rather
 * than for their numbers, so the decision reads in the DOM.
 */
export type AspectRatioName = 'square' | 'landscape' | 'portrait' | 'video' | 'wide';

/**
 * A name, a number (`16 / 9`), or the pair the number came from (`[16, 9]`).
 * The pair is written into the stylesheet exactly, where a number would be
 * written as its quotient.
 */
export type AspectRatioValue = AspectRatioName | number | readonly [number, number];

/** What the DOM says the ratio is: one of the names, or `custom` for a number. */
export type AspectRatioAttribute = AspectRatioName | 'custom';

/**
 * What `render` receives. Written against `HTMLAttributes<HTMLElement>` so it
 * can be spread onto any element, which is what makes the substitution real.
 */
export interface AspectRatioRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
  'data-ratio': AspectRatioAttribute;
  'data-ui': string;
}

export interface AspectRatioProps extends ComponentPropsWithRef<'div'> {
  /**
   * The proportion the box holds before anything is in it. Required: the
   * ratio is the consumer's decision, and a frame that named none is a frame
   * nobody thought about.
   */
  ratio: AspectRatioValue;
  /** Renders the frame into another element — a `figure`, an `li`. */
  render?: ((props: AspectRatioRootProps) => ReactNode) | undefined;
}
