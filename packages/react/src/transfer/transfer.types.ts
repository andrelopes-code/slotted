import type { PartialMessages, TransferMessages } from '@slotted/core/i18n';
import type { TransferDirection, TransferSide } from '@slotted/core/transfer';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

export type { TransferDirection, TransferSide };

/** The type step of the lists, the search fields and the move buttons. */
export type TransferSize = 'sm' | 'md' | 'lg';

/**
 * How the two panes are laid out. `auto` answers the root's own inline size:
 * two columns from 36rem, one pane at a time below it. `columns` and `steps`
 * fix the answer.
 */
export type TransferLayout = 'auto' | 'columns' | 'steps';

export type TransferMoveReason = Extract<ChangeReason, 'pointer' | 'keyboard' | 'programmatic'>;
export type TransferSelectionReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'select' | 'programmatic'
>;
export type TransferQueryReason = Extract<ChangeReason, 'keyboard' | 'clear' | 'programmatic'>;
export type TransferPaneReason = Extract<ChangeReason, 'pointer' | 'keyboard' | 'programmatic'>;

/**
 * A move asks once, with what moved and which way. `keys` are in the order
 * they joined; `direction` is `reorder` when they stayed in the target.
 */
export interface TransferMoveRequest extends ChangeRequest<readonly string[]> {
  readonly reason: TransferMoveReason;
  readonly direction: TransferDirection;
  readonly keys: readonly string[];
}

export interface TransferSelectionRequest extends ChangeRequest<readonly string[]> {
  readonly reason: TransferSelectionReason;
}

export interface TransferQueryRequest extends ChangeRequest<string> {
  readonly reason: TransferQueryReason;
}

export interface TransferPaneRequest extends ChangeRequest<TransferSide> {
  readonly reason: TransferPaneReason;
}

/** The shape the family reads without accessors. */
export interface TransferItem {
  key: string;
  label: string;
  description?: string | undefined;
  disabled?: boolean | undefined;
}

/** What an application sets once for every transfer under it. */
export interface TransferDefaults {
  size: TransferSize;
  layout: TransferLayout;
  searchable: boolean;
  selectAll: boolean;
  reorderable: boolean;
  rows: number;
}

export interface TransferDefaultsProviderProps extends Partial<TransferDefaults> {
  children?: ReactNode | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface TransferHandle {
  /** Moves focus into a pane's list; the source's when no side is named. */
  focus: (side?: TransferSide) => void;
  /** Reveals an item in whichever pane holds it. */
  scrollToKey: (key: string) => void;
  /** The root element. */
  readonly element: HTMLDivElement | null;
}

/** What `render` receives for the root. */
export interface TransferRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-layout': TransferLayout;
  'data-loading'?: '' | undefined;
  'data-pane': TransferSide;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': TransferSize;
  'data-ui': string;
  /**
   * The root's ref, which the drag and the focus rules measure against. A
   * substituted element attaches it beside its own.
   */
  ref: Ref<HTMLDivElement>;
}

/** What a pane's content is told about where it is drawn. */
export interface TransferItemContext {
  side: TransferSide;
  /** Whether the collection holds the key; `false` draws the key itself. */
  resolved: boolean;
}

export interface TransferProps<T = TransferItem> extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'defaultValue' | 'onChange'
> {
  /** The whole collection, both sides. */
  items: readonly T[];
  getKey?: ((item: T) => string) | undefined;
  getLabel?: ((item: T) => string) | undefined;
  getDescription?: ((item: T) => string | undefined) | undefined;
  isItemDisabled?: ((item: T) => boolean) | undefined;
  /**
   * The content of one option, inside the option the listbox draws. The check
   * is drawn around it; return the label, and a description or a meta beside
   * it, with the listbox family's parts.
   */
  renderItem?: ((item: T, context: TransferItemContext) => ReactNode) | undefined;

  /** The keys in the target. Present means controlled. */
  targetKeys?: readonly string[] | undefined;
  defaultTargetKeys?: readonly string[] | undefined;
  onTargetKeysChange?:
    ((targetKeys: readonly string[], request: TransferMoveRequest) => void) | undefined;

  /** The selection across both panes. Present means controlled. */
  selectedKeys?: readonly string[] | undefined;
  defaultSelectedKeys?: readonly string[] | undefined;
  onSelectedKeysChange?:
    ((selectedKeys: readonly string[], request: TransferSelectionRequest) => void) | undefined;

  sourceQuery?: string | undefined;
  defaultSourceQuery?: string | undefined;
  onSourceQueryChange?: ((query: string, request: TransferQueryRequest) => void) | undefined;
  targetQuery?: string | undefined;
  defaultTargetQuery?: string | undefined;
  onTargetQueryChange?: ((query: string, request: TransferQueryRequest) => void) | undefined;

  /** The pane shown in steps. Present means controlled. */
  pane?: TransferSide | undefined;
  defaultPane?: TransferSide | undefined;
  onPaneChange?: ((pane: TransferSide, request: TransferPaneRequest) => void) | undefined;

  /**
   * Whether an item answers a query. Defaults to a locale-aware `contains`
   * over the label and the description.
   */
  filter?: ((item: T, query: string, side: TransferSide) => boolean) | undefined;

  size?: TransferSize | undefined;
  layout?: TransferLayout | undefined;
  searchable?: boolean | undefined;
  selectAll?: boolean | undefined;
  reorderable?: boolean | undefined;
  /** How many options tall each list is. */
  rows?: number | undefined;
  /** Windows both lists. Requires `itemSize`. */
  virtual?: boolean | undefined;
  itemSize?: number | undefined;
  /** Options rendered either side of a windowed viewport. */
  overscan?: number | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  required?: boolean | undefined;
  invalid?: boolean | undefined;
  /** Whether the source is still arriving. */
  loading?: boolean | undefined;
  /** Whether the consumer has more source items to give. */
  hasMore?: boolean | undefined;
  onLoadMore?: (() => void) | undefined;

  /** Submits one hidden input per target key. */
  name?: string | undefined;

  /**
   * Words laid over the catalog of the language in force, key by key: the
   * panes' names, the controls, the counts and the announcements.
   */
  messages?: PartialMessages<TransferMessages> | undefined;
  /** Content under a pane's list. */
  renderFooter?: ((side: TransferSide) => ReactNode) | undefined;

  handleRef?: Ref<TransferHandle> | undefined;
  render?: ((props: TransferRootProps) => ReactNode) | undefined;
}
