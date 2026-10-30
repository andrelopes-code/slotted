import type { DefinedProps } from '@slotted/core/selector-key';
import type { PartialMessages, TableOfContentsMessages } from '@slotted/core/i18n';
import type { OutlineEntry } from '@slotted/core/outline';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode, RefObject } from 'react';

/** The row height step, on the control scale. */
export type TableOfContentsSize = 'sm' | 'md' | 'lg';

/**
 * The column beside a page, the bar under its title, or the trigger with the
 * current label that opens the list under it. Not decided by width: a sidebar
 * column is narrower than a phone's bar, so the width does not say which one
 * the consumer wants.
 */
export type TableOfContentsLayout = 'vertical' | 'horizontal' | 'collapsed';

/** What a press does to the URL. `push` and `replace` write `history`; `none` leaves it. */
export type TableOfContentsHistory = 'push' | 'replace' | 'none';

/** Why the current target moved. `scroll` is the observer answering the position. */
export type TableOfContentsValueReason = Extract<
  ChangeRequest<unknown>['reason'],
  'scroll' | 'pointer' | 'keyboard' | 'programmatic'
>;

/** Why the collapsed list opened or closed. */
export type TableOfContentsOpenReason = Extract<
  ChangeRequest<unknown>['reason'],
  'pointer' | 'keyboard' | 'select' | 'escape' | 'outsidePress' | 'programmatic'
>;

export type TableOfContentsValueRequest = ChangeRequest<string | null>;
export type TableOfContentsOpenRequest = ChangeRequest<boolean>;

/** One entry of the list, when the list is given as data. */
export interface TableOfContentsItemData {
  /** The target's id, without the hash. */
  id: string;
  label: ReactNode;
  children?: readonly TableOfContentsItemData[] | undefined;
}

/** What an application sets once for every list under it. */
export interface TableOfContentsDefaults {
  history: TableOfContentsHistory;
  landmark: boolean;
  layout: TableOfContentsLayout;
  levels: readonly [number, number];
  numbered: boolean;
  offset: number;
  size: TableOfContentsSize;
  sticky: boolean;
}

export interface TableOfContentsDefaultsProviderProps extends Partial<TableOfContentsDefaults> {
  children?: ReactNode | undefined;
}

/** What the root hands every part under it. */
export interface TableOfContentsContextValue {
  layout: TableOfContentsLayout;
  numbered: boolean;
  size: TableOfContentsSize;
  value: string | null;
  /** A link says which target it points at, so the spy can watch it and the keyboard can walk it. */
  registerLink: (id: string, label: () => string) => () => void;
  /** A link was pressed: asks `value`, scrolls, writes the URL, focuses the target. */
  navigate: (id: string, reason: 'pointer' | 'keyboard' | 'programmatic', source?: Event) => void;
}

/** The imperative surface, for what a consumer cannot express declaratively. */
export interface TableOfContentsHandle {
  /** Focuses the first link, or the trigger in the collapsed layout. */
  focus: () => void;
  /** Reads the headings again and measures again. */
  refresh: () => void;
  /** Scrolls to a target and asks `value` to move with the reason `programmatic`. */
  scrollTo: (id: string) => void;
  root: HTMLElement | null;
}

export type TableOfContentsRootProps = ComponentPropsWithRef<'nav'> & {
  'data-ui': 'table-of-contents';
  'data-part': 'root';
  'data-layout': TableOfContentsLayout;
  'data-size': TableOfContentsSize;
  'data-sticky'?: '' | undefined;
  'data-numbered'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-loading'?: '' | undefined;
  'data-empty'?: '' | undefined;
};

export interface TableOfContentsProps extends Omit<
  ComponentPropsWithRef<'nav'>,
  'ref' | 'onChange' | 'defaultValue'
> {
  /** The list as data. `children` written as parts take precedence. */
  items?: readonly TableOfContentsItemData[] | undefined;
  /**
   * The region whose headings make the list, read after mount and re-read
   * when its subtree changes. The server renders the list empty.
   */
  source?: RefObject<HTMLElement | null> | HTMLElement | null | undefined;
  /** The lowest and highest heading level `source` keeps. `[2, 3]` by default. */
  levels?: readonly [number, number] | undefined;
  /** A heading matching this selector, or inside one, is left out of `source`. */
  exclude?: string | undefined;
  /** The element that scrolls. Derived from the first target when unset. */
  scroller?: RefObject<HTMLElement | null> | HTMLElement | null | undefined;
  /** What to add under the page's chrome, in CSS pixels. */
  offset?: number | undefined;
  /** The current target's id. */
  value?: string | null | undefined;
  defaultValue?: string | null | undefined;
  onValueChange?:
    ((value: string | null, request: TableOfContentsValueRequest) => void) | undefined;
  /** Whether the collapsed list is shown. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: TableOfContentsOpenRequest) => void) | undefined;
  layout?: TableOfContentsLayout | undefined;
  size?: TableOfContentsSize | undefined;
  sticky?: boolean | undefined;
  history?: TableOfContentsHistory | undefined;
  numbered?: boolean | undefined;
  /** Whether the root is the navigation landmark. `false` renders a `div`. */
  landmark?: boolean | undefined;
  /** The list's title. Rendered as the `label` part; in the collapsed layout, inside the trigger. */
  label?: ReactNode | undefined;
  /** Rows of skeleton in the list's place. */
  loading?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force: the landmark's name
   * when no `label` is given, and the collapsed trigger's fixed text
   * (`navigation`). A native `aria-label` still wins.
   */
  messages?: PartialMessages<TableOfContentsMessages> | undefined;
  ref?: React.Ref<TableOfContentsHandle> | undefined;
  render?: ((props: TableOfContentsRootProps) => ReactNode) | undefined;
}

export type TableOfContentsGroupRootProps = ComponentPropsWithRef<'ol'> & {
  'data-part': 'group';
};

export interface TableOfContentsGroupProps extends Omit<ComponentPropsWithRef<'ol'>, 'ref'> {
  ref?: React.Ref<HTMLOListElement> | undefined;
  render?: ((props: TableOfContentsGroupRootProps) => ReactNode) | undefined;
}

export type TableOfContentsItemRootProps = ComponentPropsWithRef<'li'> & {
  'data-part': 'item';
  'data-depth': number;
  'data-value': string;
  'data-current'?: '' | undefined;
};

export interface TableOfContentsItemProps extends Omit<ComponentPropsWithRef<'li'>, 'ref'> {
  /** The target's id, without the hash. The link inside takes its `href` from it. */
  value: string;
  ref?: React.Ref<HTMLLIElement> | undefined;
  render?: ((props: TableOfContentsItemRootProps) => ReactNode) | undefined;
}

export type TableOfContentsLinkRootProps = Omit<ComponentPropsWithRef<'a'>, 'aria-current'> & {
  'data-part': 'link';
  'data-current'?: '' | undefined;
  'aria-current'?: 'location' | undefined;
  href: string;
};

export interface TableOfContentsLinkProps extends Omit<
  ComponentPropsWithRef<'a'>,
  'ref' | 'href' | 'aria-current'
> {
  /** The fragment. Defaults to `#` plus the item's value. */
  href?: string | undefined;
  ref?: React.Ref<HTMLAnchorElement> | undefined;
  render?: ((props: DefinedProps<TableOfContentsLinkRootProps>) => ReactNode) | undefined;
}

/** What an item hands its own link. */
export interface TableOfContentsItemContextValue {
  value: string;
  depth: number;
  current: boolean;
}

export type { OutlineEntry };
