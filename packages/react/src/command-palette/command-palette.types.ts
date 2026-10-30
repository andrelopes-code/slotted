import type { CommandGroup, CommandItem, CommandRanker } from '@slotted/core/commands';
import type { CommandPaletteMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode, Ref } from 'react';

import type { DialogDismissPolicy, DialogTriggerRootProps } from '../dialog';

export type { CommandGroup, CommandRanker } from '@slotted/core/commands';

/**
 * Where the panel stands. `dialog` composes the dialog family — a modal layer
 * at the top of the viewport. `inline` draws the panel where it was written,
 * for a popover, a drawer or a page: it is the filtered menu `menu` refused.
 */
export type CommandPalettePresentation = 'dialog' | 'inline';

/** The panel's measure, which is the dialog's `size` when there is a dialog. */
export type CommandPaletteSize = 'sm' | 'md' | 'lg';

/** Why the palette opened or closed. */
export type CommandPaletteOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'select' | 'dismiss' | 'programmatic'
>;

/** Why the query moved. */
export type CommandPaletteQueryReason = Extract<
  ChangeRequest<string>['reason'],
  'keyboard' | 'clear' | 'select' | 'programmatic'
>;

/** Why the highlight moved. */
export type CommandPaletteHighlightReason = Extract<
  ChangeRequest<string | null>['reason'],
  'pointer' | 'keyboard' | 'programmatic'
>;

/** Why the page stack moved. */
export type CommandPalettePagesReason = Extract<
  ChangeRequest<readonly string[]>['reason'],
  'select' | 'keyboard' | 'pointer' | 'programmatic'
>;

/** Why an item ran. */
export type CommandPaletteSelectReason = 'pointer' | 'keyboard';

/**
 * What an executed item is handed. `keepOpen()` holds the palette open after
 * the handler returns, which is how a command that opened something of its own
 * inside the palette says so.
 */
export interface CommandPaletteSelectRequest<Item extends CommandPaletteItem = CommandPaletteItem> {
  readonly item: Item;
  readonly reason: CommandPaletteSelectReason;
  readonly source: unknown;
  keepOpen: () => void;
}

/**
 * One command. `id`, `label` and `keywords` are what the ranker reads; the
 * rest is what the row draws. An item with `children` opens a page; an item
 * with `href` is a destination and renders as a link.
 */
export interface CommandPaletteItem extends CommandItem {
  /** The mark in the first column: the consumer's own node. */
  readonly icon?: ReactNode | undefined;
  /** A word at the end of the row — the kind of thing this is. */
  readonly meta?: string | undefined;
  /** In the library's notation, `mod+shift+p`; drawn by `kbd` and announced. */
  readonly shortcut?: string | undefined;
  readonly href?: string | undefined;
  readonly target?: string | undefined;
  /**
   * Runs when the item is executed, before the root's `onSelect`. A promise
   * keeps the palette open, marks the row busy and refuses a second run until
   * it settles.
   */
  readonly onSelect?:
    ((request: CommandPaletteSelectRequest) => void | Promise<unknown>) | undefined;
  readonly children?: readonly CommandPaletteItem[] | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface CommandPaletteHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Focuses the input and selects the query. */
  focus: () => void;
  setQuery: (query: string) => void;
  /** Scrolls the row with this id into view, and highlights it. */
  scrollToId: (id: string) => void;
  /** The input, once it is in the document. */
  readonly input: HTMLInputElement | null;
}

/** What an application sets once for every palette under it. */
export interface CommandPaletteDefaults {
  presentation: CommandPalettePresentation;
  size: CommandPaletteSize;
  outsidePress: DialogDismissPolicy;
  loop: boolean;
  autoHighlight: boolean;
  closeOnSelect: boolean;
  clearOnClose: boolean;
  highlightMatch: boolean;
  /** The chord that opens the palette anywhere in the document; `null` for none. */
  hotkey: string | null;
  recentLimit: number;
}

export interface CommandPaletteDefaultsProviderProps extends Partial<CommandPaletteDefaults> {
  children?: ReactNode | undefined;
}

/** What `renderItem` receives beside the item. */
export interface CommandPaletteItemState {
  readonly current: boolean;
  readonly disabled: boolean;
  readonly pending: boolean;
  /** The label's runs, marked where the query matched. */
  readonly label: ReactNode;
  readonly query: string;
}

export interface CommandPaletteProps<
  Item extends CommandPaletteItem = CommandPaletteItem,
> extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'ref' | 'onSelect'> {
  /** The trigger, in dialog presentation; rendered where it was written. */
  children?: ReactNode | undefined;
  items: readonly Item[];
  /** The headings and their order. A group not listed is drawn after them. */
  groups?: readonly CommandGroup[] | undefined;
  /** The adapter. Absent takes the core ranker; `null` shows the items as they came. */
  rank?: CommandRanker<Item> | null | undefined;
  /** BCP 47, for the comparison the default ranker makes. Defaults to the language in force. */
  locale?: string | undefined;
  limit?: number | undefined;

  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;

  query?: string | undefined;
  defaultQuery?: string | undefined;
  onQueryChange?: ((query: string, request: ChangeRequest<string>) => void) | undefined;

  highlightedId?: string | null | undefined;
  defaultHighlightedId?: string | null | undefined;
  onHighlightedIdChange?:
    ((id: string | null, request: ChangeRequest<string | null>) => void) | undefined;

  pages?: readonly string[] | undefined;
  defaultPages?: readonly string[] | undefined;
  onPagesChange?:
    ((pages: readonly string[], request: ChangeRequest<readonly string[]>) => void) | undefined;

  recent?: readonly string[] | undefined;
  defaultRecent?: readonly string[] | undefined;
  onRecentChange?:
    ((recent: readonly string[], request: ChangeRequest<readonly string[]>) => void) | undefined;

  /** Every executed item, after the item's own handler. */
  onSelect?: ((item: Item, request: CommandPaletteSelectRequest<Item>) => void) | undefined;

  presentation?: CommandPalettePresentation | undefined;
  size?: CommandPaletteSize | undefined;
  outsidePress?: DialogDismissPolicy | undefined;
  loop?: boolean | undefined;
  autoHighlight?: boolean | undefined;
  closeOnSelect?: boolean | undefined;
  clearOnClose?: boolean | undefined;
  highlightMatch?: boolean | undefined;
  hotkey?: string | null | undefined;
  recentLimit?: number | undefined;
  loading?: boolean | undefined;
  disabled?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * dialog's name (`label`), the input's name and placeholder, the empty,
   * loading, count and error sentences, the recents heading, the clear, close
   * and back controls, and the footer's hints.
   */
  messages?: PartialMessages<CommandPaletteMessages> | undefined;

  /** Replaces the row's content; the option element and its wiring stay the family's. */
  renderItem?: ((item: Item, state: CommandPaletteItemState) => ReactNode) | undefined;
  /** Replaces the empty message. */
  empty?: ReactNode | undefined;
  /** Replaces the footer; `null` removes it. */
  footer?: ReactNode | null | undefined;
  /** A parent for the layer alone, instead of the portal root the trigger's region makes. */
  container?: Element | null | undefined;
  /** Native props for the input, `ref` included. */
  inputProps?: Omit<ComponentPropsWithRef<'input'>, 'value' | 'defaultValue'> | undefined;
  ref?: Ref<CommandPaletteHandle> | undefined;
}

/** What `render` receives for the trigger: the dialog trigger's own props. */
export type CommandPaletteTriggerRootProps = DialogTriggerRootProps;

export interface CommandPaletteTriggerProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'children'
> {
  children?: ReactNode | undefined;
  render?: ((props: CommandPaletteTriggerRootProps) => ReactNode) | undefined;
}
