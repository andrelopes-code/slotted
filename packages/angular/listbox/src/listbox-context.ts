import type { Signal } from '@angular/core';

import type { ListboxIndicatorMode, ListboxSelectionMode } from './listbox-defaults';

/**
 * What a part asks the listbox around it.
 *
 * It is an abstract class rather than an interface so it can be the injection
 * token as well as the type, and it exists in a file of its own so the parts do
 * not import the component that renders them: the component's own template
 * applies the option directive, and a direct import each way is a cycle.
 */
export abstract class SlListboxContext {
  abstract readonly indicatorMode: Signal<ListboxIndicatorMode>;
  abstract readonly selection: Signal<ListboxSelectionMode>;
  abstract readonly listboxDisabled: Signal<boolean>;
  /** Whether this key is chosen. */
  abstract isSelected(key: string): boolean;
  /** Whether this key is the one the keyboard is on. */
  abstract isActive(key: string): boolean;
  /** The id an option carries, so `aria-activedescendant` can name it. */
  abstract optionId(key: string): string;
  /** The tab stop under the roving model, and `null` under the other one. */
  abstract optionTabIndex(key: string): number | null;
  /**
   * How large the whole set is, and where one option sits in it. Both are
   * `null` unless the collection is one the family was handed, which is exactly
   * when the pattern requires them: with options written in the template the
   * whole set is in the DOM and the platform counts it.
   */
  abstract setSize(): number | null;
  abstract posInSet(key: string): number | null;
  /** A press on an option, with the modifiers it was pressed with. */
  abstract press(key: string, event: MouseEvent): void;
}
