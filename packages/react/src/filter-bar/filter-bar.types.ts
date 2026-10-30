import type {
  FilterDescriptor,
  FilterGroup,
  FilterKind,
  FilterOperator,
  FilterPath,
} from '@slotted/core/filter';
import type { FilterBarMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactNode, RefObject } from 'react';

export type FilterBarApply = 'live' | 'manual';
export type FilterBarSize = 'sm' | 'md' | 'lg';

export type FilterBarValueReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'clear' | 'remove' | 'select' | 'submit' | 'programmatic'
>;
export type FilterBarQueryReason = Extract<
  ChangeReason,
  'keyboard' | 'clear' | 'submit' | 'programmatic'
>;
export type FilterBarPresetReason = Extract<ChangeReason, 'select' | 'clear' | 'programmatic'>;
export type FilterBarOpenReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'dismiss' | 'submit' | 'programmatic'
>;
export type FilterBarRevealedReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'programmatic'
>;

export interface FilterBarValueRequest extends ChangeRequest<FilterGroup | null> {
  readonly reason: FilterBarValueReason;
}
export interface FilterBarQueryRequest extends ChangeRequest<string> {
  readonly reason: FilterBarQueryReason;
}
export interface FilterBarPresetRequest extends ChangeRequest<string | null> {
  readonly reason: FilterBarPresetReason;
}
export interface FilterBarOpenRequest extends ChangeRequest<boolean> {
  readonly reason: FilterBarOpenReason;
}
export interface FilterBarRevealedRequest extends ChangeRequest<boolean> {
  readonly reason: FilterBarRevealedReason;
}

/** A value of a set field, with the word a reader sees for it. */
export interface FilterBarOption {
  value: string;
  label: string;
}

/**
 * One field a listing can be filtered by. `key` is what a rule names and what
 * `read(row, field)` receives; `kind` decides the operators and the operand
 * control, which is the same decision `table`'s five typed filters make.
 */
export interface FilterBarField {
  key: string;
  label: string;
  kind: FilterKind;
  /**
   * Drawn before the field's name on its chip: a glyph name from
   * `@slotted/core/glyph`, or a node of the consumer's.
   */
  icon?: string | ReactNode | undefined;
  /** Narrows the operators the kind offers. AG Grid's `filterOptions`. */
  operators?: readonly string[] | undefined;
  /** The operator a new rule starts with. Defaults to the kind's. */
  defaultOperator?: string | undefined;
  /**
   * Always in sight: a dashed pill while it holds no condition, a chip in the
   * same place once it does. Polaris's `pinned`.
   */
  pinned?: boolean | undefined;
  /**
   * A field that always holds a rule: Clear returns it to `defaultValue`
   * rather than to nothing, and a rule without an operand refuses to be
   * applied or removed. A required field is pinned whether or not it says so.
   */
  required?: boolean | undefined;
  /** What a required field returns to; also the rule a new bar starts with for it. */
  defaultValue?: FilterDescriptor | null | undefined;
  /** A heading the add menu groups the field under. */
  section?: string | undefined;
  /** Whether the global query searches this field. Defaults to `true` for `text`. */
  searchable?: boolean | undefined;
  /** The values a `set` field offers. */
  options?: readonly FilterBarOption[] | undefined;
  /** Bounds and step for `number`, `date`, `time` and `datetime` operands, handed to their control. */
  min?: number | string | undefined;
  max?: number | string | undefined;
  step?: number | undefined;
}

/** A saved view: a name and the tree it restores. */
export interface FilterBarPreset {
  key: string;
  label: string;
  value: FilterGroup | null;
}

/** What the operand body of a rule is handed. */
export interface FilterBarOperandProps {
  field: FilterBarField;
  operator: FilterOperator;
  /** `0` for `value`, `1` for `end`. */
  index: 0 | 1;
  value: unknown;
  onValueChange: (value: unknown) => void;
  /** What `Enter` does in this surface. */
  apply: () => void;
  label: string;
  size: FilterBarSize;
}

export interface FilterBarHandle {
  /** Puts focus in the search field. */
  focusSearch: () => void;
  /** Opens the builder, on the node at `path` when one is given. */
  open: (path?: FilterPath) => void;
  readonly root: HTMLDivElement | null;
}

export interface FilterBarDefaults {
  apply?: FilterBarApply | undefined;
  chipLimit?: number | undefined;
  queryDelay?: number | undefined;
  shortcut?: string | null | undefined;
  size?: FilterBarSize | undefined;
}

export interface FilterBarDefaultsProviderProps extends FilterBarDefaults {
  children?: ReactNode;
}

export interface FilterBarProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onChange' | 'ref'
> {
  /** The fields the listing can be filtered by, in the order the add menu lists them. */
  fields: readonly FilterBarField[];

  /** The tree the consumer owns. Passing it decides the mode for good. */
  value?: FilterGroup | null | undefined;
  defaultValue?: FilterGroup | null | undefined;
  onValueChange?: ((value: FilterGroup | null, request: FilterBarValueRequest) => void) | undefined;

  /** The global query. */
  query?: string | undefined;
  defaultQuery?: string | undefined;
  onQueryChange?: ((query: string, request: FilterBarQueryRequest) => void) | undefined;

  presets?: readonly FilterBarPreset[] | undefined;
  preset?: string | null | undefined;
  defaultPreset?: string | null | undefined;
  onPresetChange?: ((preset: string | null, request: FilterBarPresetRequest) => void) | undefined;
  /** Asks the application to save the tree as a view. The name is the application's to ask for. */
  onPresetSave?: ((value: FilterGroup | null) => void) | undefined;

  /** Whether the builder is open. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, request: FilterBarOpenRequest) => void) | undefined;

  /** Whether the chips past `chipLimit` are shown. */
  revealed?: boolean | undefined;
  defaultRevealed?: boolean | undefined;
  onRevealedChange?: ((revealed: boolean, request: FilterBarRevealedRequest) => void) | undefined;

  /** `live` commits as the reader goes; `manual` edits a draft until Apply. */
  apply?: FilterBarApply | undefined;
  /** Sticks under the page chrome, reading `--slotted-page-sticky-top`. */
  sticky?: boolean | undefined;
  /** A parent for the builder's drawer alone, instead of the shared portal root. */
  container?: Element | null | undefined;
  size?: FilterBarSize | undefined;
  /** Milliseconds the query waits before it is requested, under `live`. */
  queryDelay?: number | undefined;
  /** Chips past this number fold behind the `more` control. */
  chipLimit?: number | undefined;
  /** A document key that focuses the search. `null` binds none. */
  shortcut?: string | null | undefined;
  disabled?: boolean | undefined;
  /** The conditions can be read and reached, and nothing changes them. */
  readOnly?: boolean | undefined;
  loading?: boolean | undefined;
  /**
   * The number of rows the filter kept, and the number there are. Written by
   * the `count` message, or `countOnly` without a total, in the digits of the
   * language in force.
   */
  count?: number | undefined;
  total?: number | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * landmark's name (`bar`), the controls, the chips' names, the count and the
   * announcements.
   */
  messages?: PartialMessages<FilterBarMessages> | undefined;
  /** Replaces the operand control of a rule. Returning `undefined` keeps the kind's own. */
  renderOperand?: ((props: FilterBarOperandProps) => ReactNode) | undefined;
  /** The consumer's own controls, drawn in the `end` slot. */
  children?: ReactNode;
  ref?: RefObject<FilterBarHandle | null> | ((handle: FilterBarHandle | null) => void) | undefined;
}
