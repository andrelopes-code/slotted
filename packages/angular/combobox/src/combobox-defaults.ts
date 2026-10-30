import { inject, InjectionToken } from '@angular/core';
import type { Provider } from '@angular/core';

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
 * Whether an option answers a query. `null` turns filtering off entirely, which
 * is what a list a server has already filtered needs.
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

/**
 * The numbers, and why they are these numbers. The reasoning is the React
 * binding's, in `packages/react/src/combobox/combobox-defaults.tsx`; the two
 * tables are held to each other by the contract, which declares every one of
 * them as a default.
 */
export const COMBOBOX_FALLBACK: ComboboxDefaults = {
  align: 'start',
  alignOffset: 0,
  allowsCustomValue: false,
  autocomplete: 'list',
  autoHighlight: false,
  clearable: true,
  closeOnEscape: true,
  closeOnOutsidePress: true,
  closeOnSelect: true,
  collisionPadding: 8,
  disabled: false,
  flip: true,
  fullWidth: true,
  hideWhenDetached: true,
  highlightMatch: true,
  invalid: false,
  loading: false,
  loop: false,
  mount: 'active',
  openOn: 'input',
  portal: true,
  readOnly: false,
  required: false,
  shift: true,
  side: 'bottom',
  sideOffset: 4,
  size: 'md',
  strategy: 'absolute',
  variant: 'outline',
  width: 'content',
};

export const COMBOBOX_DEFAULTS = new InjectionToken<ComboboxDefaults>('COMBOBOX_DEFAULTS', {
  providedIn: 'root',
  factory: () => COMBOBOX_FALLBACK,
});

/**
 * The decisions an application takes once. Its words come from the language in
 * force (`provideSlotted`).
 */
export function provideComboboxDefaults(defaults: Partial<ComboboxDefaults>): Provider {
  return { provide: COMBOBOX_DEFAULTS, useValue: { ...COMBOBOX_FALLBACK, ...defaults } };
}

export function injectComboboxDefaults(): ComboboxDefaults {
  return inject(COMBOBOX_DEFAULTS);
}
