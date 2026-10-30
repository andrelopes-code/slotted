import type { FamilyTranslator, PageMessages, PartialMessages } from '@slotted/core/i18n';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

import type { ContainerInset, ContainerSize } from '../container';

/** The width of the content column: the container's own sizes. */
export type PageWidth = ContainerSize;

/** The inset of the content column from the edge of the page: the container's own steps. */
export type PageInset = ContainerInset;

/**
 * Who scrolls. `ancestor` puts the page inside whatever scrolls — the
 * document, a shell's content column — and makes it at least as tall as that,
 * so the footer has a bottom to stick to. `self` makes the page's own scroll
 * part the scroller, with the footer below it in the flow.
 */
export type PageScroll = 'ancestor' | 'self';

/** The ground: the sunken canvas of an application, or the plain surface of a document. */
export type PageGround = 'sunken' | 'surface';

/** Whether the root is the document's `main` landmark. */
export type PageLandmark = 'main' | 'none';

/** What an application sets once for every page under it. */
export interface PageDefaults {
  ground: PageGround;
  inset: PageInset;
  landmark: PageLandmark;
  scroll: PageScroll;
  width: PageWidth;
}

export interface PageDefaultsProviderProps extends Partial<PageDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What the page tells the families inside it: the measure its header and
 * footer align their columns to.
 */
export interface PageMeasure {
  inset: PageInset;
  width: PageWidth;
}

/** What `render` receives for the root. */
export interface PageRootProps extends HTMLAttributes<HTMLElement> {
  'data-fill'?: '' | undefined;
  'data-ground': PageGround;
  'data-loading'?: '' | undefined;
  'data-part': string;
  'data-scroll': PageScroll;
  'data-ui': string;
  'data-width': PageWidth;
}

export interface PageProps extends ComponentPropsWithRef<'main'> {
  /**
   * Fills the height it was given: the body stops growing with its content and
   * the container inside it stretches to what is left, for a master–detail, a
   * splitter or a canvas that scroll their own panes. With `scroll="self"`
   * nothing then scrolls outside the body, so the body's principal scroller —
   * not a form control, and at least half the body's height — is what
   * collapses the header: past 16 pixels down it snaps the area shut, and back
   * at its top it opens it again. From 600 pixels of the page's width up;
   * below it the page scrolls as it does without `fill`.
   */
  fill?: boolean | undefined;
  /**
   * The bar for the actions that finish the task. A prop rather than a child,
   * because it has to sit outside the scroll part — below the scroller under
   * `self`, stuck to the bottom of the root under `ancestor` — and a child would
   * be inside it. Mounted while it is passed, and held through its exit.
   */
  footer?: ReactNode | undefined;
  /** Defaults to the provider, then `sunken`. */
  ground?: PageGround | undefined;
  /** Defaults to the provider, then `6`. */
  inset?: PageInset | undefined;
  /** Defaults to the provider, then `main`. */
  landmark?: PageLandmark | undefined;
  /** The body carries `aria-busy`; what stands in for the content is each family's own placeholder. */
  loading?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force: the footer's
   * accessible name (`footer`). A native `aria-label` on the footer still wins.
   */
  messages?: PartialMessages<PageMessages> | undefined;
  /** Renders the root into another element. */
  render?: ((props: PageRootProps) => ReactNode) | undefined;
  /** Defaults to the provider, then `ancestor`. */
  scroll?: PageScroll | undefined;
  /** Defaults to the provider, then `wide`. */
  width?: PageWidth | undefined;
}

export interface PageBodyProps extends ComponentPropsWithRef<'div'> {
  /** Renders the body into another element. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

export interface PageFooterProps extends ComponentPropsWithRef<'footer'> {
  /** Renders the footer into another element. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
}

/** What `usePage()` returns inside a page, for the families that align to it. */
export interface PageContextValue extends PageMeasure {
  ground: PageGround;
  loading: boolean;
  scroll: PageScroll;
  /** The family's words in the language in force, with this page's `messages` laid over them. */
  t: FamilyTranslator<PageMessages>;
}
