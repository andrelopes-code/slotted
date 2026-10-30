import type { MultiSelectMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

export type MultiSelectSize = 'sm' | 'md' | 'lg';
export type MultiSelectVariant = 'outline' | 'subtle' | 'plain';
export type MultiSelectSide = 'bottom' | 'top' | 'inline-start' | 'inline-end' | 'left' | 'right';
export type MultiSelectAlign = 'start' | 'center' | 'end';
export type MultiSelectWidth = 'anchor' | 'content';
export type MultiSelectMount = 'active' | 'lazy' | 'eager';
export type MultiSelectStrategy = 'absolute' | 'fixed';

/** Which gestures open the popup besides the trigger and the arrows. */
export type MultiSelectOpenOn = 'input' | 'focus' | 'manual';

/** What the row does with more chips than fit on one line. */
export type MultiSelectOverflow = 'wrap' | 'collapse';

/** Whether an option already in the set stays in the list, marked, or leaves it. */
export type MultiSelectChosenOptions = 'show' | 'hide';

/** A value's key. The reasoning is `select`'s, and it is the same reasoning. */
export type MultiSelectOptionValue = string;

export type MultiSelectOpenReason =
  | 'pointer'
  | 'keyboard'
  | 'escape'
  | 'outsidePress'
  | 'select'
  | 'dismiss'
  | 'blur'
  | 'programmatic';

/**
 * Why the set moved. Six words rather than one boolean, because a consumer
 * writes a different handler for each:
 *
 * - `select` — an option in the popup was chosen or unchosen.
 * - `submit` — the typed text was committed, by `Enter`, by a delimiter, by a
 *   paste, or by blur. The only reason that can carry a value the collection
 *   did not hold.
 * - `remove` — one value was taken out, by its own control or by `Delete`.
 * - `clear` — the whole set was taken out at once.
 * - `keyboard` — the set is the same and its order changed. Reorder emits no
 *   other reason, so a consumer persisting an order listens for exactly this.
 * - `programmatic` — the imperative handle.
 */
export type MultiSelectValueReason =
  'select' | 'submit' | 'remove' | 'clear' | 'keyboard' | 'programmatic';

export type MultiSelectInputReason =
  'keyboard' | 'select' | 'submit' | 'clear' | 'blur' | 'programmatic';

export type MultiSelectHighlightReason = 'pointer' | 'keyboard' | 'programmatic';

/** Why a value the reader offered did not get in. */
export type MultiSelectRefuseCause = 'duplicate' | 'limit' | 'invalid';

/**
 * Whether an option answers a query. `null` turns filtering off entirely, for a
 * list a server has already filtered; the default is the library's own
 * locale-sensitive `contains`, because §6 refuses a family that assumes one.
 */
export type MultiSelectFilter = ((label: string, query: string) => boolean) | null;

export interface MultiSelectOption {
  value: MultiSelectOptionValue;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectOptionGroup {
  label: string;
  options: readonly MultiSelectOption[];
}

export type MultiSelectItems = readonly (MultiSelectOption | MultiSelectOptionGroup)[];

export interface MultiSelectDefaults {
  addOnPaste: boolean;
  align: MultiSelectAlign;
  alignOffset: number;
  allowDuplicates: boolean;
  chosenOptions: MultiSelectChosenOptions;
  clearable: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePress: boolean;
  closeOnSelect: boolean;
  collisionPadding: number;
  commitOnBlur: boolean;
  creatable: boolean;
  /** The characters that commit the typed text, and split a paste. */
  delimiters: readonly string[];
  disabled: boolean;
  editable: boolean;
  flip: boolean;
  fullWidth: boolean;
  hideWhenDetached: boolean;
  highlightMatch: boolean;
  invalid: boolean;
  loading: boolean;
  loop: boolean;
  /** The most values the set may hold, or `null` for no limit. */
  max: number | null;
  mount: MultiSelectMount;
  openOn: MultiSelectOpenOn;
  overflow: MultiSelectOverflow;
  portal: boolean;
  readOnly: boolean;
  reorderable: boolean;
  required: boolean;
  shift: boolean;
  side: MultiSelectSide;
  sideOffset: number;
  size: MultiSelectSize;
  strategy: MultiSelectStrategy;
  variant: MultiSelectVariant;
  width: MultiSelectWidth;
}

export interface MultiSelectDefaultsProviderProps extends Partial<MultiSelectDefaults> {
  children?: ReactNode;
  container?: Element | null;
}

export interface MultiSelectHandle {
  close: () => void;
  focus: () => void;
  open: () => void;
  scrollToKey: (value: MultiSelectOptionValue) => void;
  /** The escape hatch a declarative prop cannot express: setting the whole set. */
  setValue: (values: readonly MultiSelectOptionValue[], reason?: MultiSelectValueReason) => void;
}

export interface MultiSelectProps extends Partial<MultiSelectDefaults> {
  children?: ReactNode;
  defaultHighlightedValue?: MultiSelectOptionValue | null;
  defaultInputValue?: string;
  defaultOpen?: boolean;
  defaultValue?: readonly MultiSelectOptionValue[];
  filter?: MultiSelectFilter;
  form?: string;
  highlightedValue?: MultiSelectOptionValue | null;
  inputValue?: string;
  items?: MultiSelectItems;
  /**
   * BCP 47, for the comparison the default filter and the duplicate rule make.
   * The language in force when absent.
   */
  locale?: string;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * buttons, the chips, the counter, the offer to add, and the sentences.
   */
  messages?: PartialMessages<MultiSelectMessages> | undefined;
  name?: string;
  onHighlightedValueChange?: (
    value: MultiSelectOptionValue | null,
    request: ChangeRequest<MultiSelectOptionValue | null>,
  ) => void;
  onInputValueChange?: (value: string, request: ChangeRequest<string>) => void;
  /** The last option came into view; the consumer fetches the next page. */
  onLoadMore?: () => void;
  onOpenChange?: (open: boolean, request: ChangeRequest<boolean>) => void;
  onValueChange?: (
    value: readonly MultiSelectOptionValue[],
    request: ChangeRequest<readonly MultiSelectOptionValue[]>,
  ) => void;
  /**
   * What the family refused, and why. It holds no state and cancels nothing:
   * the values never entered the set, and this says which and on what grounds.
   */
  onValueRefuse?: (
    values: readonly MultiSelectOptionValue[],
    details: { cause: MultiSelectRefuseCause; source?: unknown },
  ) => void;
  open?: boolean;
  ref?: Ref<MultiSelectHandle>;
  total?: number;
  /** Whether text the reader typed may become a value at all. */
  validateValue?: (text: string, values: readonly MultiSelectOptionValue[]) => boolean;
  value?: readonly MultiSelectOptionValue[];
}

/** What `render` receives for the frame around the control. */
export interface MultiSelectRootProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  'data-complete'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-full-width'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-loading'?: '' | undefined;
  'data-narrow'?: '' | undefined;
  'data-open'?: '' | undefined;
  'data-overflow': MultiSelectOverflow;
  'data-part': string;
  'data-readonly'?: '' | undefined;
  'data-required'?: '' | undefined;
  'data-size': MultiSelectSize;
  'data-ui': string;
  'data-variant': MultiSelectVariant;
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface MultiSelectControlProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'value' | 'defaultValue'
> {
  ref?: Ref<HTMLInputElement>;
  /** Replaces the frame around the control, not the input inside it. */
  render?: (props: MultiSelectRootProps) => ReactNode;
}

/** What `render` receives for the layer the positioner writes on. */
export interface MultiSelectPositionerProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  'data-align': MultiSelectAlign;
  'data-open'?: '' | undefined;
  'data-part': string;
  'data-size': MultiSelectSize;
  'data-ui': string;
  'data-width': MultiSelectWidth;
  inert?: boolean | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface MultiSelectContentProps extends ComponentPropsWithRef<'div'> {
  /** The band of chosen values at the top of the surface. */
  chosen?: boolean;
  empty?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  render?: (props: MultiSelectPositionerProps) => ReactNode;
  status?: ReactNode;
}

export interface MultiSelectItemProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  children?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  position?: number;
  ref?: Ref<HTMLDivElement>;
  /** What the filter compares, for rich children. */
  textValue?: string;
  value: MultiSelectOptionValue;
}

export interface MultiSelectGroupProps extends ComponentPropsWithRef<'div'> {
  label?: ReactNode;
}
