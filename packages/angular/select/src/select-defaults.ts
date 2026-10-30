import { inject, InjectionToken } from '@angular/core';
import type { Provider } from '@angular/core';

export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectVariant = 'outline' | 'subtle' | 'plain';
export type SelectSide = 'bottom' | 'top' | 'inline-start' | 'inline-end' | 'left' | 'right';
export type SelectAlign = 'start' | 'center' | 'end';
export type SelectWidth = 'anchor' | 'content';
export type SelectMount = 'active' | 'lazy' | 'eager';
export type SelectStrategy = 'absolute' | 'fixed';

export type SelectOptionValue = string;
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

/**
 * Why the query moved. `clear` covers both the reader emptying the field and
 * the popup emptying it as it opens and closes — the field was emptied either
 * way.
 */
export type SelectSearchReason = 'keyboard' | 'select' | 'clear' | 'programmatic';

/**
 * Whether an option answers a query. `null` turns filtering off, which is what
 * a list a server has already filtered needs; a function replaces the
 * comparison; unset asks for the library's own locale-sensitive `contains`.
 */
export type SelectFilter = ((label: string, query: string) => boolean) | null;
export type SelectHighlightReason = 'pointer' | 'keyboard' | 'programmatic';

/** Enough to name a value the popup has never rendered. */
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

/**
 * The numbers, and why they are these numbers. The reasoning is the React
 * binding's, written out in `packages/react/src/select/select-defaults.tsx`;
 * the two tables are checked against each other by the contract, which holds
 * every one of them as a declared default.
 */
export const SELECT_FALLBACK: SelectDefaults = {
  align: 'start',
  alignOffset: 0,
  clearable: false,
  highlightMatch: true,
  search: false,
  closeOnEscape: true,
  closeOnOutsidePress: true,
  closeOnSelect: true,
  collisionPadding: 8,
  disabled: false,
  flip: true,
  fullWidth: true,
  hideWhenDetached: true,
  invalid: false,
  loading: false,
  loop: false,
  mount: 'active',
  multiple: false,
  portal: true,
  readOnly: false,
  required: false,
  shift: true,
  side: 'bottom',
  sideOffset: 4,
  size: 'md',
  strategy: 'absolute',
  typeahead: true,
  typeaheadTimeout: 500,
  variant: 'outline',
  width: 'content',
};

export const SELECT_DEFAULTS = new InjectionToken<SelectDefaults>('SELECT_DEFAULTS', {
  providedIn: 'root',
  factory: () => SELECT_FALLBACK,
});

/**
 * The decisions an application takes once, in its bootstrap, rather than on
 * every select it renders. A select that states one of them itself still wins.
 * Its words come from the language in force (`provideSlotted`).
 */
export function provideSelectDefaults(defaults: Partial<SelectDefaults>): Provider {
  return { provide: SELECT_DEFAULTS, useValue: { ...SELECT_FALLBACK, ...defaults } };
}

export function injectSelectDefaults(): SelectDefaults {
  return inject(SELECT_DEFAULTS);
}
