import type { LinkMessages, PartialMessages } from '@slotted/core/i18n';
import type { DefinedProps } from '@slotted/core/selector-key';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export type LinkUnderline = 'always' | 'hover' | 'none';
export type LinkVariant = 'accent' | 'neutral' | 'inverse';
export type LinkSize = 'xs' | 'sm' | 'md';

/** What every link on the page looks like before it states anything of its own. */
export interface LinkDefaults {
  underline?: LinkUnderline | undefined;
  variant?: LinkVariant | undefined;
  visited?: boolean | undefined;
}

export interface LinkDefaultsProviderProps extends LinkDefaults {
  children?: ReactNode;
}

export interface LinkRootProps extends ComponentPropsWithRef<'a'> {
  children: ReactNode;
  'data-disabled': true | undefined;
  'data-part': string;
  'data-size': LinkSize | undefined;
  'data-ui': string;
  'data-underline': LinkUnderline;
  'data-variant': LinkVariant;
  'data-visited': true | undefined;
}

export interface LinkProps extends ComponentPropsWithRef<'a'> {
  /**
   * Unavailable, and still discoverable. The rendered anchor keeps its place
   * in the tab sequence and loses its destination, which is what stops a
   * middle click as well as a left one.
   */
  disabled?: boolean;
  /** Opens the destination in a new browsing context, and says so. */
  external?: boolean;
  /**
   * Words laid over the catalog of the language in force: the warning a link
   * to a new tab announces (`externalHint`).
   */
  messages?: PartialMessages<LinkMessages> | undefined;
  /** Substitutes the rendered element — a router's own link, typically. */
  render?: (props: DefinedProps<LinkRootProps>) => ReactNode;
  /**
   * The text size. Unset, the link takes the size its action slot states — a stat card's, a
   * section's or a chart's actions — or else its parent's.
   */
  size?: LinkSize | undefined;
  underline?: LinkUnderline;
  variant?: LinkVariant;
  /** Paints a destination the reader has already followed. */
  visited?: boolean;
}
