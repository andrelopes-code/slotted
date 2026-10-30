import type { CascaderMessages, PartialMessages } from '@slotted/core/i18n';
import type {
  CascaderCheckedStrategy,
  CascaderLayoutAxis,
  CascaderNodeView,
} from '@slotted/core/cascader';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode, Ref } from 'react';

export type { CascaderCheckedStrategy, CascaderLayoutAxis, CascaderNodeView };

export type CascaderSize = 'sm' | 'md' | 'lg';
export type CascaderVariant = 'outline' | 'subtle' | 'plain';
export type CascaderSelectionMode = 'single' | 'multiple';
export type CascaderExpandOn = 'press' | 'hover';
/** Which nodes may be committed: the leaves, any node, or the consumer's own rule. */
export type CascaderSelectable<T> = 'leaf' | 'any' | ((node: T) => boolean);

/** A scalar for one choice, a list for many — the shape `tree` and `listbox` settled. */
export type CascaderValue = string | null | readonly string[];

export type CascaderValueRequest = ChangeRequest<CascaderValue>;
export type CascaderOpenRequest = ChangeRequest<boolean>;
export type CascaderPathRequest = ChangeRequest<readonly string[]>;
export type CascaderKeysRequest = ChangeRequest<readonly string[]>;
export type CascaderActiveRequest = ChangeRequest<string | null>;
export type CascaderSearchRequest = ChangeRequest<string>;

/** What a level that has not arrived asks for, with the signal that withdraws it. */
export interface CascaderLoadRequest {
  readonly key: string;
  /** Aborted when the path moves away from the branch or the popup closes. */
  readonly signal: AbortSignal;
}

/** Every decision an application takes once rather than per instance. */
export interface CascaderDefaults {
  size: CascaderSize;
  variant: CascaderVariant;
  fullWidth: boolean;
  layout: CascaderLayoutAxis;
  selectionMode: CascaderSelectionMode;
  selectable: 'leaf' | 'any';
  checkedStrategy: CascaderCheckedStrategy;
  expandOn: CascaderExpandOn;
  closeOnSelect: boolean;
  search: boolean;
  clearable: boolean;
  portal: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  invalid: boolean;
  separator: string;
  hoverDelay: number;
  maxColumns: number;
  maxCrumbs: number;
}

export interface CascaderDefaultsProviderProps extends Partial<CascaderDefaults> {
  children?: ReactNode;
}

/** The hierarchy and how to read it, shared by the control and the panel. */
export interface CascaderDataProps<T> {
  /** Nested roots, or a flat list when `getParent` is given. */
  nodes: readonly T[];
  getKey: (node: T) => string;
  getLabel: (node: T) => string;
  getChildren?: ((node: T) => readonly T[] | undefined) | undefined;
  /** Opts in to a flat list: each row names its parent, `null` for a root. */
  getParent?: ((node: T) => string | null | undefined) | undefined;
  /** A branch whose children have not arrived says so, which is what lazy loading needs. */
  hasChildren?: ((node: T) => boolean) | undefined;
  getChildrenCount?: ((node: T) => number | undefined) | undefined;
  isNodeDisabled?: ((node: T) => boolean) | undefined;
  /** The children of this branch are on their way. */
  isNodeLoading?: ((node: T) => boolean) | undefined;
  /** The children of this branch could not be loaded. */
  isNodeFailed?: ((node: T) => boolean) | undefined;
  /** The roots are on their way: the first level waits as rows. */
  loading?: boolean | undefined;
  getDescription?: ((node: T) => ReactNode) | undefined;
  /** The leading picture of a node, which the consumer owns. */
  renderIcon?: ((node: T) => ReactNode) | undefined;
  /** The label of a node; the row, its marks and its count stay the family's. */
  renderNode?: ((node: T, view: CascaderNodeView) => ReactNode) | undefined;
  /** A level that has not arrived is shown, and asks for its children. */
  onLoadChildren?: ((request: CascaderLoadRequest) => void) | undefined;
  /** The reader pressed retry on a level that failed. */
  onRetry?: ((key: string) => void) | undefined;
  /** Replaces the locale-aware substring test. */
  filter?: ((node: T, query: string) => boolean) | undefined;
  /** BCP 47, for the substring test and its marks. The language in force when absent. */
  locale?: string | undefined;
}

export interface CascaderStateProps<T> {
  selectionMode?: CascaderSelectionMode | undefined;
  /** Present means controlled, for the life of the component. */
  value?: CascaderValue | undefined;
  defaultValue?: CascaderValue | undefined;
  onValueChange?: ((value: CascaderValue, request: CascaderValueRequest) => void) | undefined;

  path?: readonly string[] | undefined;
  defaultPath?: readonly string[] | undefined;
  onPathChange?: ((path: readonly string[], request: CascaderPathRequest) => void) | undefined;

  activeKey?: string | null | undefined;
  defaultActiveKey?: string | null | undefined;
  onActiveKeyChange?: ((key: string | null, request: CascaderActiveRequest) => void) | undefined;

  expandedKeys?: readonly string[] | undefined;
  defaultExpandedKeys?: readonly string[] | undefined;
  onExpandedKeysChange?:
    ((keys: readonly string[], request: CascaderKeysRequest) => void) | undefined;

  searchValue?: string | undefined;
  defaultSearchValue?: string | undefined;
  onSearchValueChange?: ((query: string, request: CascaderSearchRequest) => void) | undefined;

  layout?: CascaderLayoutAxis | undefined;
  selectable?: CascaderSelectable<T> | undefined;
  checkedStrategy?: CascaderCheckedStrategy | undefined;
  expandOn?: CascaderExpandOn | undefined;
  search?: boolean | undefined;
  size?: CascaderSize | undefined;
  maxColumns?: number | undefined;
  maxCrumbs?: number | undefined;
  hoverDelay?: number | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * placeholder, the buttons, the search field, the breadcrumb, and the
   * sentences a level and a search say.
   */
  messages?: PartialMessages<CascaderMessages> | undefined;
}

/** The imperative actions a consumer cannot express declaratively. */
export interface CascaderHandle {
  open: () => void;
  close: () => void;
  focus: () => void;
  /** Shows the level that holds the value, as opening does. */
  revealValue: () => void;
}

export interface CascaderProps<T = unknown>
  extends
    CascaderDataProps<T>,
    CascaderStateProps<T>,
    Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange' | 'children'> {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: CascaderOpenRequest) => void) | undefined;

  closeOnSelect?: boolean | undefined;
  clearable?: boolean | undefined;
  variant?: CascaderVariant | undefined;
  fullWidth?: boolean | undefined;
  portal?: boolean | undefined;
  required?: boolean | undefined;
  invalid?: boolean | undefined;
  separator?: string | undefined;
  /** The value's path as the control prints it, replacing the segments. */
  renderValue?: ((path: readonly T[]) => ReactNode) | undefined;

  /** Submits one hidden input per emitted key. */
  name?: string | undefined;
  form?: string | undefined;

  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  handleRef?: Ref<CascaderHandle> | undefined;
}

export interface CascaderPanelProps<T = unknown>
  extends
    CascaderDataProps<T>,
    CascaderStateProps<T>,
    Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange' | 'children'> {
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
}
