import { InjectionToken, inject } from '@angular/core';
import type { TemplateRef } from '@angular/core';
import type { FilterDescriptor, FilterGroup, FilterKind } from '@slotted/core/filter';

export type FilterBarApply = 'live' | 'manual';
export type FilterBarSize = 'sm' | 'md' | 'lg';
export type FilterBarValueReason =
  'pointer' | 'keyboard' | 'clear' | 'remove' | 'select' | 'submit' | 'programmatic';
export type FilterBarQueryReason = 'keyboard' | 'clear' | 'submit' | 'programmatic';
export type FilterBarPresetReason = 'select' | 'clear' | 'programmatic';
export type FilterBarOpenReason =
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'dismiss' | 'submit' | 'programmatic';
export type FilterBarRevealedReason = 'pointer' | 'keyboard' | 'programmatic';

/** A value of a set field, with the word a reader sees for it. */
export interface FilterBarOption {
  value: string;
  label: string;
}

/**
 * One field a listing can be filtered by. `key` is what a rule names and what
 * `read(row, field)` receives; `kind` decides the operators and the operand
 * control, which is the same decision `table`'s typed filters make.
 */
export interface FilterBarField {
  key: string;
  label: string;
  kind: FilterKind;
  /**
   * Drawn before the field's name on its chip and in the add menu: a glyph
   * name from `@slotted/core/glyph`, or a template of the consumer's.
   */
  icon?: string | TemplateRef<unknown>;
  /** Narrows the operators the kind offers. */
  operators?: readonly string[];
  /** The operator a new rule starts with. Defaults to the kind's. */
  defaultOperator?: string;
  /**
   * Always in sight: a dashed pill while it holds no condition, a chip in the
   * same place once it does.
   */
  pinned?: boolean;
  /**
   * A field that always holds a rule: Clear returns it to `defaultValue`
   * rather than to nothing, and a rule without an operand refuses to be
   * applied or removed. A required field is pinned whether or not it says so.
   */
  required?: boolean;
  defaultValue?: FilterDescriptor | null;
  /** A heading the add menu groups the field under. */
  section?: string;
  /** Whether the global query searches this field. */
  searchable?: boolean;
  /** The values a `set` field offers. */
  options?: readonly FilterBarOption[];
  min?: number | string;
  max?: number | string;
  step?: number;
}

/** A saved view: a name and the tree it restores. */
export interface FilterBarPreset {
  key: string;
  label: string;
  value: FilterGroup | null;
}

export const FILTER_BAR_DEFAULT_APPLY: FilterBarApply = 'live';
export const FILTER_BAR_DEFAULT_SIZE: FilterBarSize = 'md';
export const FILTER_BAR_DEFAULT_QUERY_DELAY = 320;
export const FILTER_BAR_DEFAULT_CHIP_LIMIT = 6;

export interface FilterBarDefaults {
  apply?: FilterBarApply;
  chipLimit?: number;
  queryDelay?: number;
  shortcut?: string | null;
  size?: FilterBarSize;
}

export const FILTER_BAR_DEFAULTS_TOKEN = new InjectionToken<FilterBarDefaults>(
  'slotted filter-bar defaults',
  { providedIn: 'root', factory: (): FilterBarDefaults => ({}) },
);

/**
 * An application decides once how its bars apply, how long the query waits,
 * how many chips show, and which key reaches the search. A bar that states any
 * of those itself still wins. Its words come from the language in force
 * (`provideSlotted`).
 */
export function provideFilterBarDefaults(defaults: FilterBarDefaults) {
  return { provide: FILTER_BAR_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectFilterBarDefaults(): FilterBarDefaults {
  return inject(FILTER_BAR_DEFAULTS_TOKEN);
}
