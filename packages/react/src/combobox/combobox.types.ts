import type { ComboboxMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

export type ComboboxSize = 'sm' | 'md' | 'lg';
export type ComboboxVariant = 'outline' | 'subtle' | 'plain';
export type ComboboxSide = 'bottom' | 'top' | 'inline-start' | 'inline-end' | 'left' | 'right';
export type ComboboxAlign = 'start' | 'center' | 'end';
export type ComboboxWidth = 'anchor' | 'content';
export type ComboboxMount = 'active' | 'lazy' | 'eager';
export type ComboboxStrategy = 'absolute' | 'fixed';

/** The pattern's own three values for `aria-autocomplete`. */
export type ComboboxAutocomplete = 'none' | 'list' | 'both';

/**
 * When the popup opens on its own: as the reader types or presses the input, on
 * every focus and press, or never.
 */
export type ComboboxOpenOn = 'input' | 'focus' | 'manual';

/** An option's key. The reasoning is `select`'s, and it is the same reasoning. */
export type ComboboxOptionValue = string;

export type ComboboxOpenReason =
  | 'pointer'
  | 'keyboard'
  | 'escape'
  | 'outsidePress'
  | 'select'
  | 'dismiss'
  | 'blur'
  | 'programmatic';

export type ComboboxValueReason =
  'pointer' | 'keyboard' | 'clear' | 'select' | 'blur' | 'programmatic';

export type ComboboxInputReason = 'keyboard' | 'select' | 'clear' | 'blur' | 'programmatic';

export type ComboboxHighlightReason = 'pointer' | 'keyboard' | 'programmatic';

/**
 * Whether an option answers a query.
 *
 * `null` turns filtering off entirely, which is what a list the consumer has
 * already filtered on a server needs: the family then renders exactly the
 * window it was given and decides nothing. `docs/component-features.md` §6
 * refuses a combobox that assumes `contains`, so the default is an adapter like
 * any other and it is stated in `COMBOBOX_FALLBACK`.
 */
export type ComboboxFilter = ((label: string, query: string) => boolean) | null;

export interface ComboboxOption {
  value: ComboboxOptionValue;
  label: string;
  disabled?: boolean;
}

export interface ComboboxOptionGroup {
  label: string;
  options: readonly ComboboxOption[];
}

export type ComboboxItems = readonly (ComboboxOption | ComboboxOptionGroup)[];

export interface ComboboxDefaults {
  align: ComboboxAlign;
  alignOffset: number;
  allowsCustomValue: boolean;
  autocomplete: ComboboxAutocomplete;
  autoHighlight: boolean;
  clearable: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePress: boolean;
  closeOnSelect: boolean;
  collisionPadding: number;
  disabled: boolean;
  flip: boolean;
  fullWidth: boolean;
  hideWhenDetached: boolean;
  highlightMatch: boolean;
  invalid: boolean;
  loading: boolean;
  loop: boolean;
  mount: ComboboxMount;
  openOn: ComboboxOpenOn;
  portal: boolean;
  readOnly: boolean;
  required: boolean;
  shift: boolean;
  side: ComboboxSide;
  sideOffset: number;
  size: ComboboxSize;
  strategy: ComboboxStrategy;
  variant: ComboboxVariant;
  width: ComboboxWidth;
}

export interface ComboboxDefaultsProviderProps extends Partial<ComboboxDefaults> {
  children?: ReactNode;
  container?: Element | null;
}

export interface ComboboxHandle {
  close: () => void;
  focus: () => void;
  open: () => void;
  scrollToKey: (value: ComboboxOptionValue) => void;
}

export interface ComboboxProps {
  align?: ComboboxAlign;
  alignOffset?: number;
  allowsCustomValue?: boolean;
  autocomplete?: ComboboxAutocomplete;
  /** Whether the first match is highlighted as soon as the popup opens. */
  autoHighlight?: boolean;
  children?: ReactNode;
  clearable?: boolean;
  /** Called with the query the reader asked to add. The collection is the consumer's. */
  onCreate?: (query: string, details: { reason: ComboboxValueReason; source?: unknown }) => void;
  /** Called with the text the field refused when it settled, and why (CB7). */
  onInputReset?: (rejected: string, details: { reason: 'blur'; source?: unknown }) => void;
  closeOnEscape?: boolean;
  closeOnOutsidePress?: boolean;
  closeOnSelect?: boolean;
  collisionPadding?: number;
  defaultHighlightedValue?: ComboboxOptionValue | null;
  defaultInputValue?: string;
  defaultOpen?: boolean;
  defaultValue?: ComboboxOptionValue | null;
  disabled?: boolean;
  filter?: ComboboxFilter;
  flip?: boolean;
  form?: string;
  fullWidth?: boolean;
  hideWhenDetached?: boolean;
  highlightedValue?: ComboboxOptionValue | null;
  highlightMatch?: boolean;
  inputValue?: string;
  invalid?: boolean;
  items?: ComboboxItems;
  loading?: boolean;
  /** BCP 47, for the comparison the default filter makes. The language in force when absent. */
  locale?: string;
  loop?: boolean;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * clear and trigger buttons, the offer to create, the empty, loading and
   * count sentences.
   */
  messages?: PartialMessages<ComboboxMessages> | undefined;
  mount?: ComboboxMount;
  name?: string;
  onHighlightedValueChange?: (
    value: ComboboxOptionValue | null,
    request: ChangeRequest<ComboboxOptionValue | null>,
  ) => void;
  onInputValueChange?: (value: string, request: ChangeRequest<string>) => void;
  /** The last option came into view; the consumer fetches the next page. */
  onLoadMore?: () => void;
  onOpenChange?: (open: boolean, request: ChangeRequest<boolean>) => void;
  onValueChange?: (
    value: ComboboxOptionValue | null,
    request: ChangeRequest<ComboboxOptionValue | null>,
  ) => void;
  open?: boolean;
  openOn?: ComboboxOpenOn;
  portal?: boolean;
  readOnly?: boolean;
  ref?: Ref<ComboboxHandle>;
  required?: boolean;
  shift?: boolean;
  side?: ComboboxSide;
  sideOffset?: number;
  size?: ComboboxSize;
  strategy?: ComboboxStrategy;
  total?: number;
  value?: ComboboxOptionValue | null;
  variant?: ComboboxVariant;
  width?: ComboboxWidth;
}

/** What `render` receives for the frame around the control. */
export interface ComboboxInputRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  'data-disabled'?: '' | undefined;
  'data-full-width'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-loading'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': ComboboxSize;
  'data-ui': string;
  'data-variant': ComboboxVariant;
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface ComboboxInputProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'value' | 'defaultValue'
> {
  ref?: Ref<HTMLInputElement>;
  /** Replaces the frame around the control, not the control itself. */
  render?: (props: ComboboxInputRootProps) => ReactNode;
}

/** What `render` receives for the layer the positioner writes on. */
export interface ComboboxPositionerProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  'data-align': ComboboxAlign;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-size': ComboboxSize;
  'data-ui': string;
  'data-width': ComboboxWidth;
  inert?: boolean | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface ComboboxContentProps extends ComponentPropsWithRef<'div'> {
  empty?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  render?: (props: ComboboxPositionerProps) => ReactNode;
  status?: ReactNode;
}

export interface ComboboxItemProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  children?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  position?: number;
  ref?: Ref<HTMLDivElement>;
  /** What the filter compares and what typeahead matches, for rich children. */
  textValue?: string;
  value: ComboboxOptionValue;
}

export interface ComboboxGroupProps extends ComponentPropsWithRef<'div'> {
  label?: ReactNode;
}
