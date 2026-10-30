import type { ChangeRequest, ChangeReason } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, MouseEvent, ReactNode } from 'react';

/** The type step the listbox and every option inside it sit at. */
export type ListboxSize = 'sm' | 'md' | 'lg';

/**
 * Whether the listbox draws its own box. `framed` is the standalone control —
 * what `<select multiple>` looks like — and `plain` is what `select` and
 * `combobox` render inside a layer that already has an edge.
 */
export type ListboxVariant = 'plain' | 'framed';

/** How many options may be chosen at once. */
export type ListboxSelectionMode = 'none' | 'single' | 'multiple';

/**
 * Which of the two models the pattern offers is in force. `toggle` is the
 * recommended one: a plain press changes one option and holds no modifier.
 * `replace` is the alternative: a plain press replaces the selection and only
 * a modifier extends it, which is what `<select multiple>` does.
 */
export type ListboxSelectionBehavior = 'toggle' | 'replace';

export type ListboxOrientation = 'vertical' | 'horizontal';

/**
 * How the keyboard's position is expressed. `auto` reads one fact — whether the
 * set is windowed — and answers `activedescendant` when it is, because a roving
 * tab stop cannot survive its own element being recycled.
 */
export type ListboxFocusMode = 'auto' | 'roving' | 'activedescendant';

/** Whether a chosen option carries a check as well as its ground and its bar. */
export type ListboxIndicatorMode = 'check' | 'none';

/**
 * What the listbox holds: one key in `single` and `none`, a set of them in
 * `multiple`. Three of the four surveyed implementations give single selection
 * a scalar; the array-always shape is what makes a consumer write `value[0]`.
 */
export type ListboxValue = string | readonly string[] | null;

/** Why the selection moved. */
export type ListboxSelectionReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'select' | 'clear' | 'programmatic'
>;

/** Why the active option moved. */
export type ListboxActiveReason = Extract<ChangeReason, 'pointer' | 'keyboard' | 'programmatic'>;

export type ListboxChangeRequest = ChangeRequest<ListboxValue>;
export type ListboxActiveRequest = ChangeRequest<string | null>;

/** Where `scrollToKey` puts the option it reveals. */
export type ListboxAlignment = 'start' | 'center' | 'end' | 'nearest';

/** The imperative actions a consumer cannot express declaratively. */
export interface ListboxHandle {
  /** Moves real focus into the listbox, under either focus model. */
  focus: () => void;
  /** Reveals an option, whether or not it is currently rendered. */
  scrollToKey: (key: string, align?: ListboxAlignment) => void;
  /** Which option the keyboard is on, or `null`. */
  getActiveKey: () => string | null;
  /** The root element, for anything neither of the three covers. */
  getElement: () => HTMLDivElement | null;
}

/** What an application sets once for every listbox under it. */
export interface ListboxDefaults {
  size: ListboxSize;
  variant: ListboxVariant;
  selectionMode: ListboxSelectionMode;
  selectionBehavior: ListboxSelectionBehavior;
  orientation: ListboxOrientation;
  focusMode: ListboxFocusMode;
  indicator: ListboxIndicatorMode;
  loop: boolean;
  typeahead: boolean;
  selectOnFocus: boolean;
  navigateDisabled: boolean;
  disallowEmptySelection: boolean;
  disallowSelectAll: boolean;
  rows: number;
  columns: number;
  overscan: number;
  loadMoreThreshold: number;
  typeaheadTimeout: number;
  pageSize: number;
}

export interface ListboxDefaultsProviderProps extends Partial<ListboxDefaults> {
  children?: ReactNode | undefined;
}

/** What the listbox hands every part inside it. */
export interface ListboxContextValue {
  disabled: boolean | undefined;
  readOnly: boolean | undefined;
  indicator: ListboxIndicatorMode;
  selectionMode: ListboxSelectionMode;
  /** Whether this key is chosen. */
  isSelected: (key: string) => boolean;
  /** Whether this key is the one the keyboard is on. */
  isActive: (key: string) => boolean;
  /** The id an option carries, so `aria-activedescendant` can name it. */
  optionId: (key: string) => string;
  /** The tab stop, under the roving model. `undefined` under the other one. */
  optionTabIndex: (key: string) => number | undefined;
  /** A press on an option, with the modifiers it was pressed with. */
  press: (key: string, event: MouseEvent<HTMLElement>) => void;
  /**
   * How large the whole set is, and where one option sits in it. Both are
   * `undefined` unless the collection is known, which is exactly when the
   * pattern requires them: with declarative children the whole set is in the
   * DOM and the platform counts it.
   */
  setSize: number | undefined;
  posInSet: (key: string) => number | undefined;
}

/** What `render` receives for the listbox's root. */
export interface ListboxRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-focus-mode': 'roving' | 'activedescendant';
  'data-indicator': ListboxIndicatorMode;
  'data-invalid'?: '' | undefined;
  'data-layout'?: 'grid' | undefined;
  'data-loading'?: '' | undefined;
  'data-orientation': ListboxOrientation;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': ListboxSize;
  'data-ui': string;
  'data-variant': ListboxVariant;
}

/**
 * What `render` receives for one option. It is typed over the element the
 * option renders by default, because the option is the one part whose handlers
 * compose with the consumer's own and the two have to agree about the target.
 */
export interface ListboxOptionRootProps extends HTMLAttributes<HTMLDivElement> {
  'data-current'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-key': string;
  'data-part': string;
  'data-pinned'?: '' | undefined;
  'data-selected'?: '' | undefined;
}

/** What `render` receives for a group. */
export interface ListboxGroupRootProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
}

export interface ListboxOptionProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'onSelect'
> {
  children?: ReactNode | undefined;
  /**
   * The key this option selects. It is what `value` holds, and it is a string:
   * the consumer's own object never enters the contract, which is why there is
   * no comparator to configure.
   */
  value: string;
  /**
   * What typeahead matches and what a reader hears. Defaults to the option's
   * own text, which is wrong exactly when the option holds a mark, a badge or
   * a number the reader would not type.
   */
  textValue?: string | undefined;
  /**
   * Unstated rather than `false`, so the option defers to the listbox. It is
   * `aria-disabled` and never the native attribute: the pattern needs a
   * disabled option to stay reachable when `navigateDisabled` says so.
   */
  disabled?: boolean | undefined;
  /**
   * Rendered outside the window that covers it, at its own place on the canvas.
   * The listbox pins the active option and the range anchor; nothing else sets
   * it, because an `aria-activedescendant` whose target has been recycled names
   * an id that is not in the document.
   */
  pinned?: boolean | undefined;
  render?: ((props: ListboxOptionRootProps) => ReactNode) | undefined;
}

export interface ListboxGroupProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  children?: ReactNode | undefined;
  /** The group's accessible name. A group without one is a group nobody hears. */
  label: ReactNode;
  /** Reaches the label element, for an id or a class the page owns. */
  labelProps?: HTMLAttributes<HTMLElement> | undefined;
  render?: ((props: ListboxGroupRootProps) => ReactNode) | undefined;
}

export interface ListboxPartProps extends ComponentPropsWithRef<'span'> {
  children?: ReactNode | undefined;
}

export interface ListboxMessageProps extends ComponentPropsWithRef<'div'> {
  children?: ReactNode | undefined;
  render?: ((props: ListboxGroupRootProps) => ReactNode) | undefined;
}

/**
 * One section of a windowed collection. The key names the group and its label
 * element; the label is the accessible name the pattern requires of a group.
 */
export interface ListboxSection<T> {
  key: string;
  label: string;
  items: readonly T[];
}

export interface ListboxProps<T = unknown> extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'children'
> {
  children?: ReactNode | undefined;

  /** Present means controlled, for the life of the component. */
  value?: ListboxValue | undefined;
  /** The value an uncontrolled listbox starts from, read once. */
  defaultValue?: ListboxValue | undefined;
  /** Called before the value moves, with the request that carries the reason. */
  onValueChange?: ((value: ListboxValue, request: ListboxChangeRequest) => void) | undefined;

  /** Which option the keyboard is on. Present means controlled. */
  activeKey?: string | null | undefined;
  defaultActiveKey?: string | null | undefined;
  onActiveKeyChange?: ((key: string | null, request: ListboxActiveRequest) => void) | undefined;

  selectionMode?: ListboxSelectionMode | undefined;
  selectionBehavior?: ListboxSelectionBehavior | undefined;
  size?: ListboxSize | undefined;
  variant?: ListboxVariant | undefined;
  orientation?: ListboxOrientation | undefined;
  focusMode?: ListboxFocusMode | undefined;
  indicator?: ListboxIndicatorMode | undefined;
  /** Whether the arrows wrap past the ends. Defaults to `false`. */
  loop?: boolean | undefined;
  typeahead?: boolean | undefined;
  typeaheadTimeout?: number | undefined;
  /** Whether moving the active option also chooses it. Off by default. */
  selectOnFocus?: boolean | undefined;
  /** Whether the arrows land on a disabled option. Off by default. */
  navigateDisabled?: boolean | undefined;
  disallowEmptySelection?: boolean | undefined;
  disallowSelectAll?: boolean | undefined;

  /** How many options tall the box is. `<select size>` under another name. */
  rows?: number | undefined;
  /** How many options across. The arrows step by this number down a column. */
  columns?: number | undefined;
  /** How far `PageUp` and `PageDown` travel. */
  pageSize?: number | undefined;

  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  required?: boolean | undefined;
  invalid?: boolean | undefined;
  /** Whether the set is still arriving. Writes `aria-busy`. */
  loading?: boolean | undefined;

  /** Submits one hidden input per chosen key, so a bare form carries the set. */
  name?: string | undefined;

  /**
   * The whole collection, when the listbox is to window it or to report a set
   * larger than the DOM holds. Without it the collection is read from the
   * rendered options, which is what a listbox of twenty writes.
   */
  items?: readonly T[] | undefined;
  /** A grouped collection. Mutually exclusive with `items`. */
  sections?: readonly ListboxSection<T>[] | undefined;
  getKey?: ((item: T) => string) | undefined;
  getLabel?: ((item: T) => string) | undefined;
  isItemDisabled?: ((item: T) => boolean) | undefined;
  /** The content of one option. The family renders the option around it. */
  renderOption?: ((item: T) => ReactNode) | undefined;

  /** Renders only the options the viewport covers, plus the pinned ones. */
  virtual?: boolean | undefined;
  /** The block size of one option, in pixels. Required whenever `virtual`. */
  itemSize?: number | undefined;
  /** The block size of a group label. Defaults to `itemSize`. */
  sectionSize?: number | undefined;
  /** Options rendered either side of the viewport. */
  overscan?: number | undefined;

  /** How large the whole set is when only part of it has been loaded. */
  totalCount?: number | undefined;
  /** Whether the consumer has more to give. */
  hasMore?: boolean | undefined;
  /** How many options before the end the request goes out. */
  loadMoreThreshold?: number | undefined;
  /** Asked when the window reaches the end of what has been loaded. */
  onLoadMore?: (() => void) | undefined;

  /**
   * What the listbox shows when it holds no options. It answers the `items` and
   * `sections` collections; a listbox written with children composes
   * `<ListboxEmpty>` itself, because only the consumer knows it rendered none.
   */
  emptyContent?: ReactNode | undefined;
  /** What the row at the end of a page that has not arrived says. */
  loaderContent?: ReactNode | undefined;

  ref?: React.Ref<HTMLDivElement> | undefined;
  /** The imperative actions. */
  handleRef?: React.Ref<ListboxHandle> | undefined;
  render?: ((props: ListboxRootProps) => ReactNode) | undefined;
}
