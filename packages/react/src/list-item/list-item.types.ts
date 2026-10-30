import type { DefinedProps } from '@slotted/core/selector-key';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentPropsWithRef,
  HTMLAttributes,
  ReactNode,
} from 'react';

import type { ListMarker, ListSize, ListVariant } from '../list';

/** The five the theme carries. `secondary` is the library's neutral. */
export type ListItemTone = 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

export type ListItemSize = ListSize;

/**
 * Where the leading visual and the trailing metadata sit against a row of more
 * than one line: on the middle of the block, or on the title's own line.
 */
export type ListItemAlign = 'center' | 'start';

/**
 * What the row is the current one *of*. ARIA 1.2 lists `aria-current` as
 * inherited by `listitem` and does not deprecate it, which makes this the one
 * selection-shaped state a static list may announce for itself.
 */
export type ListItemCurrent = boolean | 'page' | 'step' | 'location' | 'date' | 'time';

/** What an application sets once for every row under it. */
export interface ListItemDefaults {
  align: ListItemAlign;
  inset: boolean;
  size: ListItemSize;
  tone: ListItemTone;
  truncate: boolean;
}

export interface ListItemDefaultsProviderProps extends Partial<ListItemDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What the row hands the box inside it. Only the two states that decide whether
 * the box may still be activated: everything else the row paints itself.
 */
export interface ListItemContextValue {
  disabled: boolean;
  loading: boolean;
}

/* Only the family's own attributes are named. `aria-current`, `aria-posinset`
   and `aria-setsize` are already on `HTMLAttributes`, and narrowing one of them
   here made the wiring unassignable to the props it was built from. */
export interface ListItemRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-align': ListItemAlign;
  'data-current'?: '' | undefined;
  /** ARIA 1.2 deprecates `aria-disabled` on `listitem`, so the state is data only. */
  'data-disabled'?: '' | undefined;
  'data-inset'?: '' | undefined;
  'data-loading'?: '' | undefined;
  'data-marker': ListMarker;
  'data-part': string;
  'data-selected'?: '' | undefined;
  'data-size': ListItemSize;
  'data-tone': ListItemTone;
  'data-truncate'?: '' | undefined;
  'data-ui': string;
  'data-variant': ListVariant;
}

export interface ListItemProps extends ComponentPropsWithRef<'li'> {
  /** Where the leading visual sits against a row of more than one line. */
  align?: ListItemAlign | undefined;
  /**
   * The row the reader is on. `true` writes `aria-current="true"`; a token
   * writes that token, and `page` is what a navigation list wants.
   */
  current?: ListItemCurrent | undefined;
  /**
   * The row dims and stops answering the pointer. The attribute that means it
   * goes on the box inside — the native `disabled` on a button, `aria-disabled`
   * on a link, whose destination stays so the row is still reachable — and
   * never on the `li`, which ARIA 1.2 forbids.
   */
  disabled?: boolean | undefined;
  /** Takes the row's inline padding away. Defaults to the list, then the provider. */
  inset?: boolean | undefined;
  /**
   * `aria-busy` on the box, and the activation withdrawn so the command cannot
   * run twice. The row keeps its width and its accessible name; what stands in
   * for the content is `skeleton`, composed by the page.
   */
  loading?: boolean | undefined;
  /** What is painted in the marker column. Defaults to the list, then `none`. */
  marker?: ListMarker | undefined;
  /**
   * The row's place in a set only part of which is in the document — a page of
   * results, a filtered list. ARIA 1.2 is explicit that it is unnecessary while
   * every row is present, so it is written only when stated.
   */
  position?: number | undefined;
  render?: ((props: ListItemRootProps) => ReactNode) | undefined;
  /**
   * Mirrors a selection the page owns. `aria-selected` is not valid on
   * `listitem`, so the row paints it and the control the page puts in `start` —
   * a `Checkbox` — is what announces it.
   */
  selected?: boolean | undefined;
  /** How many rows the set holds, when only part of it is in the document. */
  setSize?: number | undefined;
  /** The room the row gets. Defaults to the list, then the provider, then `md`. */
  size?: ListItemSize | undefined;
  /** The row's ink and the wash under the pointer. Defaults to `secondary`. */
  tone?: ListItemTone | undefined;
  /** Clips the title and the lines under it to one line each. The string stays. */
  truncate?: boolean | undefined;
  /** How the rows are told apart. Defaults to the list, then `plain`. */
  variant?: ListVariant | undefined;
}

export interface ListItemContentRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
}

/* Each content element's own attributes, so `disabled`, `type` and `href` are
   the platform's rather than a hand-written subset of them. */
export interface ListItemButtonRootProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode | undefined;
  'data-part': string;
}

export interface ListItemLinkRootProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode | undefined;
  'data-part': string;
}

export interface ListItemContentProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: ListItemContentRootProps) => ReactNode) | undefined;
}

export interface ListItemButtonProps extends ComponentPropsWithRef<'button'> {
  render?: ((props: ListItemButtonRootProps) => ReactNode) | undefined;
}

export interface ListItemLinkProps extends ComponentPropsWithRef<'a'> {
  /** Renders the destination into another element — a router link, for one. */
  render?: ((props: DefinedProps<ListItemLinkRootProps>) => ReactNode) | undefined;
}

export interface ListItemRegionRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode | undefined;
  'data-part': string;
}

export interface ListItemRegionProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: ListItemRegionRootProps) => ReactNode) | undefined;
}
