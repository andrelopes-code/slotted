import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';

/** The type step the tree and every row inside it sit at. */
export type TreeSize = 'sm' | 'md' | 'lg';

/**
 * Whether the tree draws its own box. `framed` is the standalone control;
 * `plain` is what a tree renders as inside a panel that already has an edge.
 */
export type TreeVariant = 'plain' | 'framed';

/** How many nodes may be chosen at once. */
export type TreeSelectionMode = 'none' | 'single' | 'multiple';

/**
 * Which of the two models the pattern offers is in force. `toggle` is the
 * recommended one: a plain press changes one node and holds no modifier.
 * `replace` is the alternative, which is what a file list does.
 */
export type TreeSelectionBehavior = 'toggle' | 'replace';

/**
 * How the selection is drawn, and which attribute states it.
 *
 * `highlight` writes `aria-selected` and says it with the row's ground and ink;
 * `checkbox` writes `aria-checked` and draws the box `checkbox` draws. The
 * pattern allows one attribute or the other and never both. `auto` reads the
 * selection mode: a box for `multiple`, a highlight for `single`, neither for
 * `none`.
 */
export type TreeSelectionIndicator = 'auto' | 'highlight' | 'checkbox' | 'none';

/** Whether pressing a branch takes its descendants with it. */
export type TreeSelectionCascade = 'none' | 'descendants';

/** What a press on the row does to a branch. */
export type TreeExpandOn = 'row' | 'expander';

/**
 * How the keyboard's position is expressed. `auto` reads one fact — whether the
 * set is windowed — and answers `activedescendant` when it is, because a roving
 * tab stop cannot survive its own element being recycled.
 */
export type TreeFocusMode = 'auto' | 'roving' | 'activedescendant';

/**
 * Whether the nodes are nested in `role="group"` elements or laid flat with
 * their level stated. A window renders a slice of the visible rows and a slice
 * cannot preserve nesting, so `auto` answers `flat` while windowed.
 */
export type TreeStructure = 'auto' | 'nested' | 'flat';

/**
 * What the tree holds: one key in `single` and `none`, a set of them in
 * `multiple`. The shape `listbox` settled, for the same reason.
 */
export type TreeValue = string | readonly string[] | null;

/** Why the selection moved. */
export type TreeSelectionReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'select' | 'clear' | 'programmatic'
>;

/** Why a branch opened or closed. */
export type TreeExpansionReason = Extract<ChangeReason, 'pointer' | 'keyboard' | 'programmatic'>;

/** Why the active node moved. */
export type TreeActiveReason = Extract<ChangeReason, 'pointer' | 'keyboard' | 'programmatic'>;

export type TreeChangeRequest = ChangeRequest<TreeValue>;
export type TreeExpansionRequest = ChangeRequest<readonly string[]>;
export type TreeActiveRequest = ChangeRequest<string | null>;

/** Where `scrollToKey` puts the node it reveals. */
export type TreeAlignment = 'start' | 'center' | 'end' | 'nearest';

/** The imperative actions a consumer cannot express declaratively. */
export interface TreeHandle {
  /** Moves real focus into the tree, under either focus model. */
  focus: () => void;
  /** Reveals a node, opening the branches above it when they are closed. */
  scrollToKey: (key: string, align?: TreeAlignment) => void;
  /** Opens a branch, and every branch above it. */
  expand: (key: string) => void;
  collapse: (key: string) => void;
  /** Opens or closes every branch the tree holds. Needs `nodes`. */
  expandAll: () => void;
  collapseAll: () => void;
  /** Which node the keyboard is on, or `null`. */
  getActiveKey: () => string | null;
  /** The root element, for anything none of the others covers. */
  getElement: () => HTMLDivElement | null;
}

/** What an application sets once for every tree under it. */
export interface TreeDefaults {
  size: TreeSize;
  variant: TreeVariant;
  structure: TreeStructure;
  selectionMode: TreeSelectionMode;
  selectionBehavior: TreeSelectionBehavior;
  selectionIndicator: TreeSelectionIndicator;
  selectionCascade: TreeSelectionCascade;
  expandOn: TreeExpandOn;
  focusMode: TreeFocusMode;
  guides: boolean;
  loop: boolean;
  typeahead: boolean;
  selectOnFocus: boolean;
  navigateDisabled: boolean;
  disallowEmptySelection: boolean;
  disallowSelectAll: boolean;
  virtual: boolean;
  disabled: boolean;
  itemSize: number;
  overscan: number;
  typeaheadTimeout: number;
  pageSize: number;
}

export interface TreeDefaultsProviderProps extends Partial<TreeDefaults> {
  children?: ReactNode | undefined;
}

/** What the tree hands every part inside it. */
export interface TreeContextValue {
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
  selectionMode: TreeSelectionMode;
  indicator: Exclude<TreeSelectionIndicator, 'auto'>;
  expandOn: TreeExpandOn;
  structure: Exclude<TreeStructure, 'auto'>;
  guides: boolean;
  isSelected: (key: string) => boolean;
  isExpanded: (key: string) => boolean;
  isActive: (key: string) => boolean;
  isIndeterminate: (key: string) => boolean;
  /** Whether a collapsed branch holds a chosen descendant. */
  holdsSelection: (key: string) => boolean;
  isNodeDisabled: (key: string) => boolean;
  /** The id a node carries, so `aria-activedescendant` can name it. */
  nodeId: (key: string) => string;
  /** The id of the node's own label, which is what names it. */
  labelId: (key: string) => string;
  /** The tab stop, under the roving model. `undefined` under the other one. */
  nodeTabIndex: (key: string) => number | undefined;
  /** A press on a row, with the modifiers it was pressed with. */
  press: (key: string, event: MouseEvent<HTMLElement>) => void;
  /** A press on the chevron, which only ever opens or closes. */
  pressExpander: (key: string, event: MouseEvent<HTMLElement>) => void;
  /** A press on the box, which only ever selects. */
  pressIndicator: (key: string, event: MouseEvent<HTMLElement>) => void;
  /**
   * How large a sibling group is and where one node sits in it. Both are
   * `undefined` unless the flat structure is in force, which is exactly when
   * the pattern requires them: with the nesting in the DOM the browser
   * computes all three.
   */
  levelOf: (key: string) => number | undefined;
  setSizeOf: (key: string) => number | undefined;
  posInSetOf: (key: string) => number | undefined;
}

/** What `render` receives for the tree's root. */
export interface TreeRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-expand-on': TreeExpandOn;
  'data-focus-mode': 'roving' | 'activedescendant';
  'data-guides': 'true' | 'false';
  'data-indicator': Exclude<TreeSelectionIndicator, 'auto'>;
  'data-invalid'?: '' | undefined;
  'data-loading'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-selection': TreeSelectionMode;
  'data-size': TreeSize;
  'data-structure': Exclude<TreeStructure, 'auto'>;
  'data-ui': string;
  'data-variant': TreeVariant;
}

/** What `render` receives for one node. */
export interface TreeNodeRootProps extends HTMLAttributes<HTMLLIElement> {
  'data-branch'?: '' | undefined;
  'data-pinned'?: '' | undefined;
  'data-current'?: '' | undefined;
  'data-depth': number;
  'data-disabled'?: '' | undefined;
  'data-expanded'?: '' | undefined;
  'data-indeterminate'?: '' | undefined;
  'data-key': string;
  'data-loading'?: '' | undefined;
  'data-match'?: 'hit' | 'ancestor' | undefined;
  'data-part': string;
  'data-selected'?: '' | undefined;
  'data-selected-within'?: '' | undefined;
}

export interface TreePartProps extends ComponentPropsWithRef<'span'> {
  children?: ReactNode | undefined;
}

export interface TreeMessageProps extends ComponentPropsWithRef<'div'> {
  children?: ReactNode | undefined;
}

export interface TreeGroupProps extends Omit<ComponentPropsWithRef<'ul'>, 'children'> {
  children?: ReactNode | undefined;
}

export interface TreeNodeProps extends Omit<ComponentPropsWithRef<'li'>, 'children' | 'onSelect'> {
  /** The sub-nodes. Their presence is what makes this node a branch. */
  children?: ReactNode | undefined;
  /**
   * The key this node selects and expands by. It is what `value` and
   * `expandedKeys` hold, and it is a string: the consumer's own object never
   * enters the contract.
   */
  value: string;
  /** The node's name. What the reader sees, and what names the node. */
  label: ReactNode;
  /** A second line under the name. */
  description?: ReactNode | undefined;
  /** The leading picture, which the consumer owns whole. */
  icon?: ReactNode | undefined;
  /** The trailing count, size or badge. */
  meta?: ReactNode | undefined;
  /** The trailing controls. They stay in the DOM and stay reachable. */
  actions?: ReactNode | undefined;
  /**
   * What typeahead matches and what a reader hears. Defaults to the label's own
   * text, which is wrong exactly when the label holds a mark or a number.
   */
  textValue?: string | undefined;
  /**
   * Whether this node has children that have not been rendered yet. A branch
   * says so before it can prove it, which is what makes lazy loading possible.
   */
  hasChildren?: boolean | undefined;
  /**
   * How deep the node sits, stated only by the flat shape. Everywhere else the
   * markup says it: each node raises the depth by one for the nodes inside it,
   * so the number is a fact about the tree rather than one more thing a
   * consumer can get wrong. A window has no nesting left to count.
   */
  depth?: number | undefined;
  /**
   * Rendered at its own place on the canvas whether or not the window covers
   * it. The tree pins the active node and the range anchor; nothing else sets
   * it, because an `aria-activedescendant` whose target has been recycled names
   * an id that is not in the document.
   */
  pinned?: boolean | undefined;
  /** Where the node sits on the canvas, in pixels. Windowed rows only. */
  offset?: number | undefined;
  /** Whether the children are on their way. Writes `aria-busy` on the group. */
  loading?: boolean | undefined;
  /**
   * Unstated rather than `false`, so the node defers to the tree. It is
   * `aria-disabled` and never the native attribute: a disabled node keeps its
   * place in the set.
   */
  disabled?: boolean | undefined;
  /**
   * Whether a query matched this node's own name or one below it. It is a fact
   * rather than a state — the reader did not put the node in it — and the tree
   * writes it when it filters.
   */
  match?: 'hit' | 'ancestor' | undefined;
  render?: ((props: TreeNodeRootProps) => ReactNode) | undefined;
}

export interface TreeProps<T = unknown> extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'children'
> {
  children?: ReactNode | undefined;

  /** Present means controlled, for the life of the component. */
  value?: TreeValue | undefined;
  defaultValue?: TreeValue | undefined;
  onValueChange?: ((value: TreeValue, request: TreeChangeRequest) => void) | undefined;

  /** Which branches are open. Present means controlled. */
  expandedKeys?: readonly string[] | undefined;
  defaultExpandedKeys?: readonly string[] | undefined;
  onExpandedKeysChange?:
    ((keys: readonly string[], request: TreeExpansionRequest) => void) | undefined;

  /** Which node the keyboard is on. Present means controlled. */
  activeKey?: string | null | undefined;
  defaultActiveKey?: string | null | undefined;
  onActiveKeyChange?: ((key: string | null, request: TreeActiveRequest) => void) | undefined;

  /** A node was activated: pressed, or `Enter` on the keyboard. */
  onNodeActivate?: ((key: string, reason: 'pointer' | 'keyboard') => void) | undefined;

  selectionMode?: TreeSelectionMode | undefined;
  selectionBehavior?: TreeSelectionBehavior | undefined;
  selectionIndicator?: TreeSelectionIndicator | undefined;
  selectionCascade?: TreeSelectionCascade | undefined;
  expandOn?: TreeExpandOn | undefined;
  structure?: TreeStructure | undefined;
  size?: TreeSize | undefined;
  variant?: TreeVariant | undefined;
  focusMode?: TreeFocusMode | undefined;
  guides?: boolean | undefined;
  loop?: boolean | undefined;
  typeahead?: boolean | undefined;
  typeaheadTimeout?: number | undefined;
  selectOnFocus?: boolean | undefined;
  navigateDisabled?: boolean | undefined;
  disallowEmptySelection?: boolean | undefined;
  disallowSelectAll?: boolean | undefined;
  pageSize?: number | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  required?: boolean | undefined;
  invalid?: boolean | undefined;
  /** Whether the set is still arriving. Writes `aria-busy` on the tree. */
  loading?: boolean | undefined;

  /** Submits one hidden input per chosen key, so a bare form carries the set. */
  name?: string | undefined;

  /**
   * The hierarchy, when the tree is to hold it rather than be written out. It
   * is what a cascade needs — a collapsed branch's descendants are not in the
   * DOM — and what `expandAll` and the filter read.
   */
  nodes?: readonly T[] | undefined;
  getKey?: ((node: T) => string) | undefined;
  getLabel?: ((node: T) => string) | undefined;
  getChildren?: ((node: T) => readonly T[] | undefined) | undefined;
  /** The already-flat shape, each row carrying its own level. */
  getLevel?: ((node: T) => number) | undefined;
  hasChildren?: ((node: T) => boolean) | undefined;
  getChildrenCount?: ((node: T) => number | undefined) | undefined;
  isNodeDisabled?: ((node: T) => boolean) | undefined;
  isNodeLoading?: ((node: T) => boolean) | undefined;
  /** The content of one row. The family renders the row around it. */
  renderNode?: ((node: T, key: string) => ReactNode) | undefined;

  /**
   * A query the tree filters by. The consumer owns the string and the control
   * it is typed into; the tree keeps the ancestors of every hit and marks the
   * matched span. Needs `nodes`.
   */
  query?: string | undefined;

  /** Renders only the rows the viewport covers. Forces the flat structure. */
  virtual?: boolean | undefined;
  itemSize?: number | undefined;
  overscan?: number | undefined;

  /** What the tree shows when it holds nothing. */
  emptyContent?: ReactNode | undefined;

  ref?: Ref<HTMLDivElement> | undefined;
  handleRef?: Ref<TreeHandle> | undefined;
  render?: ((props: TreeRootProps) => ReactNode) | undefined;
}
