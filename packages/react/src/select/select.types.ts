import type { PartialMessages, SelectMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react';

export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectVariant = 'outline' | 'subtle' | 'plain';
export type SelectSide = 'bottom' | 'top' | 'inline-start' | 'inline-end' | 'left' | 'right';
export type SelectAlign = 'start' | 'center' | 'end';
/** As wide as the control it hangs from, or as wide as its own options. */
export type SelectWidth = 'anchor' | 'content';
export type SelectMount = 'active' | 'lazy' | 'eager';
export type SelectStrategy = 'absolute' | 'fixed';

/**
 * An option's value is a string, and that is a decision rather than a
 * simplification. Every collection API in the field ends at a stable primitive
 * key — React Aria's `Key`, Ark's `string`, the `value` of an HTML `option` —
 * and a key is what a form submits, what an `id` is built from and what a
 * consumer stores. A family that took an object would need `compareWith` to say
 * when two of them are the same option, which is a question this shape cannot
 * ask.
 */
export type SelectOptionValue = string;

/** What is selected: one value, several, or nothing. */
export type SelectSelection = SelectOptionValue | readonly SelectOptionValue[] | null;

export type SelectOpenReason =
  | 'pointer'
  | 'keyboard'
  | 'escape'
  | 'outsidePress'
  | 'select'
  | 'dismiss'
  | 'blur'
  | 'programmatic';

export type SelectValueReason = 'pointer' | 'keyboard' | 'clear' | 'select' | 'programmatic';

export type SelectHighlightReason = 'pointer' | 'keyboard' | 'programmatic';

/**
 * Why the query moved. `clear` covers both the reader emptying the field and
 * the popup emptying it as it opens and closes — the field was emptied either
 * way, and a fifth word only this family would emit is not what the shared
 * vocabulary is for.
 */
export type SelectSearchReason = 'keyboard' | 'select' | 'clear' | 'programmatic';

/**
 * Whether an option answers a query.
 *
 * `null` turns filtering off entirely, which is what a list a consumer has
 * already filtered on a server needs: the family renders exactly the window it
 * was given and decides nothing. The default is `createFilter` from
 * `@slotted/core/collection`, which is an adapter like any other —
 * `docs/component-features.md` §6 refuses a family that assumes `contains` and
 * English normalization, and `combobox` takes the same prop with the same
 * default for the same reason.
 */
export type SelectFilter = ((label: string, query: string) => boolean) | null;

/**
 * What the family needs to know about an option before the popup has ever been
 * built: enough to draw the closed control. It is not how options are rendered
 * — that is `SelectItem` — and it never has to be given.
 */
export interface SelectOption {
  value: SelectOptionValue;
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: readonly SelectOption[];
}

export type SelectItems = readonly (SelectOption | SelectOptionGroup)[];

/** The decisions an application takes once rather than per instance. */
export interface SelectDefaults {
  align: SelectAlign;
  alignOffset: number;
  clearable: boolean;
  /** Whether the span a query matched is marked inside the option's label. */
  highlightMatch: boolean;
  /** Whether the popup opens onto a field the reader filters the options with. */
  search: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePress: boolean;
  closeOnSelect: boolean;
  collisionPadding: number;
  disabled: boolean;
  flip: boolean;
  fullWidth: boolean;
  hideWhenDetached: boolean;
  invalid: boolean;
  loading: boolean;
  loop: boolean;
  mount: SelectMount;
  multiple: boolean;
  portal: boolean;
  readOnly: boolean;
  required: boolean;
  shift: boolean;
  side: SelectSide;
  sideOffset: number;
  size: SelectSize;
  strategy: SelectStrategy;
  typeahead: boolean;
  typeaheadTimeout: number;
  variant: SelectVariant;
  width: SelectWidth;
}

export interface SelectDefaultsProviderProps extends Partial<SelectDefaults> {
  children?: ReactNode;
  /** Where every popup below this provider is portalled to. */
  container?: Element | null;
}

/** The imperative actions a consumer cannot express declaratively, and no more. */
export interface SelectHandle {
  close: () => void;
  focus: () => void;
  open: () => void;
  /** Focuses the search field, when there is one. Otherwise the trigger. */
  focusSearch: () => void;
  /** Brings an option into view, for a list the consumer has just replaced. */
  scrollToKey: (value: SelectOptionValue) => void;
}

export interface SelectProps {
  align?: SelectAlign;
  alignOffset?: number;
  children?: ReactNode;
  clearable?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsidePress?: boolean;
  closeOnSelect?: boolean;
  collisionPadding?: number;
  defaultHighlightedValue?: SelectOptionValue | null;
  defaultOpen?: boolean;
  defaultSearchValue?: string;
  defaultValue?: SelectSelection;
  disabled?: boolean;
  filter?: SelectFilter;
  flip?: boolean;
  /** The form this control submits with, when it is not the enclosing one. */
  form?: string;
  fullWidth?: boolean;
  hideWhenDetached?: boolean;
  highlightedValue?: SelectOptionValue | null;
  highlightMatch?: boolean;
  invalid?: boolean;
  /** Labels for values, so a closed control can name a value it never rendered. */
  items?: SelectItems;
  loading?: boolean;
  /** BCP 47, for the comparison the default filter makes. The language in force when absent. */
  locale?: string;
  loop?: boolean;
  /**
   * Words laid over the catalog of the language in force, key by key: the clear
   * button, the chips, the summary, the search field, and the sentences.
   */
  messages?: PartialMessages<SelectMessages> | undefined;
  mount?: SelectMount;
  multiple?: boolean;
  /** The submission name of the hidden native control. */
  name?: string;
  onHighlightedValueChange?: (
    value: SelectOptionValue | null,
    request: ChangeRequest<SelectOptionValue | null>,
  ) => void;
  onOpenChange?: (open: boolean, request: ChangeRequest<boolean>) => void;
  onSearchValueChange?: (value: string, request: ChangeRequest<string>) => void;
  onValueChange?: (value: SelectSelection, request: ChangeRequest<SelectSelection>) => void;
  open?: boolean;
  portal?: boolean;
  readOnly?: boolean;
  ref?: Ref<SelectHandle>;
  required?: boolean;
  search?: boolean;
  searchValue?: string;
  shift?: boolean;
  side?: SelectSide;
  sideOffset?: number;
  size?: SelectSize;
  strategy?: SelectStrategy;
  /** How many options the whole collection holds, when only a window is rendered. */
  total?: number;
  typeahead?: boolean;
  typeaheadTimeout?: number;
  value?: SelectSelection;
  variant?: SelectVariant;
  width?: SelectWidth;
}

/** What `render` receives for the frame around the control. */
export interface SelectTriggerRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  'data-disabled'?: '' | undefined;
  'data-full-width'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-loading'?: '' | undefined;
  'data-multiple'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': SelectSize;
  'data-ui': string;
  'data-variant': SelectVariant;
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface SelectTriggerProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'children' | 'value'
> {
  children?: ReactNode;
  /** Lands on the frame that draws the control, so a width given here sizes the control. */
  className?: string;
  ref?: Ref<HTMLButtonElement>;
  /** Replaces the frame around the control, not the control itself. */
  render?: (props: SelectTriggerRootProps) => ReactNode;
  /** Lands on the frame, with `className`. */
  style?: CSSProperties;
}

export interface SelectValueProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** The summary, when the family's own is not the right one. */
  children?: (selection: readonly SelectOptionValue[], labels: readonly string[]) => ReactNode;
  placeholder?: ReactNode;
}

/** What `render` receives for the layer the positioner writes on. */
export interface SelectPositionerProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  'data-align': SelectAlign;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-size': SelectSize;
  'data-ui': string;
  'data-width': SelectWidth;
  inert?: boolean | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
}

/** What `render` receives for the search field, so a consumer can replace it. */
export interface SelectSearchRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  'data-part': string;
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface SelectSearchProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'value' | 'defaultValue'
> {
  /** The magnifier. `null` draws no glyph; anything else replaces the default. */
  icon?: ReactNode;
  ref?: Ref<HTMLInputElement>;
  /** Replaces the row around the field, not the field itself. */
  render?: (props: SelectSearchRootProps) => ReactNode;
}

export interface SelectContentProps extends ComponentPropsWithRef<'div'> {
  /** What the popup says when it holds no options. Replaces the `empty` message. */
  empty?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  render?: (props: SelectPositionerProps) => ReactNode;
  /**
   * The search field, when `search` is on. It is rendered by the popup rather
   * than placed by the consumer, because the two elements it sits between — the
   * dialog and the listbox — are wiring the family owns; this reaches its
   * glyph, its `render` and every native attribute of the input.
   */
  searchProps?: SelectSearchProps;
  /** What the popup says while an answer is travelling. Replaces the `loading` message. */
  status?: ReactNode;
}

export interface SelectItemProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  children?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  /**
   * This option's place in the whole collection, one-based, for a list of which
   * only a window is rendered. Given together with `total` on the select, it
   * becomes `aria-posinset` and `aria-setsize` — the pair the listbox pattern
   * asks for when the DOM does not hold every option.
   */
  position?: number;
  /**
   * What typeahead matches on, and what the search filters on, when the label
   * is not plain text. An option the filter cannot judge is always shown.
   */
  textValue?: string;
  value: SelectOptionValue;
}

export interface SelectGroupProps extends ComponentPropsWithRef<'div'> {
  label?: ReactNode;
}
