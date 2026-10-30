import { inject, Injectable, InjectionToken } from '@angular/core';

/** The type step the listbox and every option inside it sit at. */
export type ListboxSize = 'sm' | 'md' | 'lg';

/**
 * Whether the listbox draws its own box. `framed` is the standalone control —
 * what `<select multiple>` looks like — and `plain` is what a layer that
 * already has an edge renders inside itself.
 */
export type ListboxVariant = 'plain' | 'framed';

/** How many options may be chosen at once. */
export type ListboxSelectionMode = 'none' | 'single' | 'multiple';

/**
 * Which of the two models the pattern offers is in force. `toggle` is the
 * recommended one and holds no modifier; `replace` is the alternative, where a
 * plain press replaces the selection and Control extends it.
 */
export type ListboxSelectionBehavior = 'toggle' | 'replace';

export type ListboxOrientation = 'vertical' | 'horizontal';

/**
 * How the keyboard's position is expressed. `auto` reads one fact — whether the
 * set is windowed — and answers `activedescendant` when it is, because a roving
 * tab stop cannot survive its own element being recycled.
 */
export type ListboxFocusMode = 'auto' | 'roving' | 'activedescendant';

/** Whether a chosen option draws a mark as well as its ground and its bar. */
export type ListboxIndicatorMode = 'check' | 'none';

/** Where `scrollToKey` puts the option it reveals. */
export type ListboxAlignment = 'start' | 'center' | 'end' | 'nearest';

export interface ListboxDefaults {
  columns: number;
  disallowEmptySelection: boolean;
  disallowSelectAll: boolean;
  focusMode: ListboxFocusMode;
  indicator: ListboxIndicatorMode;
  loadMoreThreshold: number;
  loop: boolean;
  navigateDisabled: boolean;
  orientation: ListboxOrientation;
  overscan: number;
  pageSize: number;
  rows: number;
  selectOnFocus: boolean;
  selectionBehavior: ListboxSelectionBehavior;
  selectionMode: ListboxSelectionMode;
  size: ListboxSize;
  typeahead: boolean;
  typeaheadTimeout: number;
  variant: ListboxVariant;
}

/**
 * `loop` is off because React Aria and Zag both default it off and only the
 * Angular CDK defaults it on, and a list of two hundred options that jumps from
 * the last to the first loses the reader. `selectOnFocus` is off because the
 * pattern names the accessibility cost of the other answer.
 */
const FALLBACK: ListboxDefaults = {
  columns: 1,
  disallowEmptySelection: false,
  disallowSelectAll: false,
  focusMode: 'auto',
  indicator: 'check',
  loadMoreThreshold: 0,
  loop: false,
  navigateDisabled: false,
  orientation: 'vertical',
  overscan: 4,
  pageSize: 10,
  rows: 7,
  selectOnFocus: false,
  selectionBehavior: 'toggle',
  selectionMode: 'single',
  size: 'md',
  typeahead: true,
  typeaheadTimeout: 500,
  variant: 'framed',
};

export const LISTBOX_DEFAULTS = new InjectionToken<ListboxDefaults>('slotted listbox defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its listboxes behave, rather than repeating
 * nineteen inputs on every collection in a product. A listbox that states any
 * of them itself still wins: an explicit input is never overridden by the
 * token.
 */
export function provideListboxDefaults(defaults: Partial<ListboxDefaults>) {
  return {
    provide: LISTBOX_DEFAULTS,
    useFactory: (): ListboxDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a listbox behaves as here, before it states anything of its own. */
export function injectListboxDefaults(): ListboxDefaults {
  return inject(LISTBOX_DEFAULTS);
}

/**
 * `aria-activedescendant` names an option by its id, so every option needs one
 * and the same string has to be produced on the server and in the browser. A
 * counter held by the injector produces one; `Math.random` would not match for
 * hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlListboxIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-listbox-${this.count}`;
  }
}
