import type { DefinedProps } from '@slotted/core/selector-key';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

export type CardOrientation = 'vertical' | 'horizontal';

/** How the surface is bounded: by an edge, by elevation, or by a fill. */
export type CardFill = 'outline' | 'elevated' | 'subtle';

/** The card's own inset. Density is the application's choice; this is not. */
export type CardSize = 'sm' | 'md' | 'lg';

/** What an application sets once for every card under it. */
export interface CardDefaults {
  fill: CardFill;
  orientation: CardOrientation;
  size: CardSize;
}

export interface CardDefaultsProviderProps extends Partial<CardDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives. It names the family's own attributes over the native
 * ones every element shares; `ref` is not named because the element the
 * consumer renders decides its own type, and React passes it through the same
 * spread either way.
 */
export interface CardRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  /** Mirrors a control the page has disabled. Present only while it is true. */
  'data-disabled'?: '' | undefined;
  'data-fill': CardFill;
  'data-orientation': CardOrientation;
  'data-part': string;
  /** Mirrors a selection the page owns. Present only while it is true. */
  'data-selected'?: '' | undefined;
  'data-size': CardSize;
  'data-ui': string;
}

export interface CardProps extends ComponentPropsWithRef<'div'> {
  /**
   * Mirrors a control the page has disabled: the card dims, stops answering
   * hover and withdraws the hit area it added. It disables nothing, because
   * only the control inside can refuse an interaction.
   */
  disabled?: boolean | undefined;
  /** How the surface is bounded. Defaults to the provider, then to `outline`. */
  fill?: CardFill | undefined;
  /**
   * `horizontal` puts the media beside the regions and answers the card's own
   * inline size, returning the media to the top in a narrow container.
   */
  orientation?: CardOrientation | undefined;
  /**
   * Renders the wiring into the element the page means — an `article` with its
   * own heading, the `li` of a list of results, the `label` of a chooser.
   */
  render?: ((props: CardRootProps) => ReactNode) | undefined;
  /**
   * Mirrors a selection the page owns. The card paints it; the control inside
   * announces it.
   */
  selected?: boolean | undefined;
  /** The card's own inset. Defaults to the provider, then to `md`. */
  size?: CardSize | undefined;
}

export interface CardRegionRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
}

export interface CardRegionProps extends ComponentPropsWithRef<'div'> {
  /** Renders the region into another element: `header`, `figure`, `footer`. */
  render?: ((props: CardRegionRootProps) => ReactNode) | undefined;
}

export interface CardLinkRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
  href?: string | undefined;
}

export interface CardLinkProps extends ComponentPropsWithRef<'a'> {
  /**
   * Renders the destination into another element — a router link, for one. It
   * has to stay one focusable element that navigates: a whole surface that
   * fires a command instead is a misclick nobody can undo.
   */
  render?: ((props: DefinedProps<CardLinkRootProps>) => ReactNode) | undefined;
}
