import { inject, Injectable, InjectionToken } from '@angular/core';

/** The type step the tree and every row inside it sit at. */
export type TreeSize = 'sm' | 'md' | 'lg';

/**
 * Whether the tree draws its own box. `framed` is the standalone control;
 * `plain` is what a panel that already has an edge renders inside itself.
 */
export type TreeVariant = 'plain' | 'framed';

/** How many nodes may be chosen at once. */
export type TreeSelectionMode = 'none' | 'single' | 'multiple';

/**
 * Which of the two models the pattern offers is in force. `toggle` is the
 * recommended one and holds no modifier; `replace` is the alternative.
 */
export type TreeSelectionBehavior = 'toggle' | 'replace';

/**
 * How the selection is drawn, and which attribute states it. The pattern allows
 * `aria-selected` or `aria-checked` and never both; `auto` reads the mode
 * beside it, which is the convention the pattern's own note recommends.
 */
export type TreeSelectionIndicator = 'auto' | 'highlight' | 'checkbox' | 'none';

/** Whether pressing a branch takes its descendants with it. */
export type TreeSelectionCascade = 'none' | 'descendants';

/** What a press on the row does to a branch. */
export type TreeExpandOn = 'row' | 'expander';

/**
 * How the keyboard's position is expressed. `auto` reads one fact — whether the
 * set is windowed — and answers `activedescendant` when it is, because a roving
 * tab stop cannot survive its own element being recycled.
 */
export type TreeFocusMode = 'auto' | 'roving' | 'activedescendant';

/**
 * Whether the nodes are nested in `role="group"` elements or laid flat with
 * their level stated. A window renders a slice and a slice cannot preserve
 * nesting, so `auto` answers `flat` while windowed.
 */
export type TreeStructure = 'auto' | 'nested' | 'flat';

/** Where `scrollToKey` puts the node it reveals. */
export type TreeAlignment = 'start' | 'center' | 'end' | 'nearest';

export interface TreeDefaults {
  disallowEmptySelection: boolean;
  disallowSelectAll: boolean;
  expandOn: TreeExpandOn;
  focusMode: TreeFocusMode;
  guides: boolean;
  itemSize: number;
  loop: boolean;
  navigateDisabled: boolean;
  overscan: number;
  pageSize: number;
  selectOnFocus: boolean;
  selectionBehavior: TreeSelectionBehavior;
  selectionCascade: TreeSelectionCascade;
  selectionIndicator: TreeSelectionIndicator;
  selectionMode: TreeSelectionMode;
  size: TreeSize;
  structure: TreeStructure;
  typeahead: boolean;
  typeaheadTimeout: number;
  variant: TreeVariant;
  virtual: boolean;
}

/**
 * `expandOn` is `row` because the band is a larger target than any chevron and
 * it is what a file browser does. `selectionIndicator` is `auto` rather than a
 * mode, because the right mark depends on the mode beside it: a box for a set
 * the reader ticks, a highlight for the one thing they chose. `loop` is off,
 * for the reason `listbox` states.
 */
const FALLBACK: TreeDefaults = {
  disallowEmptySelection: false,
  disallowSelectAll: false,
  expandOn: 'row',
  focusMode: 'auto',
  guides: true,
  itemSize: 32,
  loop: false,
  navigateDisabled: false,
  overscan: 4,
  pageSize: 10,
  selectOnFocus: false,
  selectionBehavior: 'toggle',
  selectionCascade: 'none',
  selectionIndicator: 'auto',
  selectionMode: 'single',
  size: 'md',
  structure: 'auto',
  typeahead: true,
  typeaheadTimeout: 500,
  variant: 'plain',
  virtual: false,
};

export const TREE_DEFAULTS = new InjectionToken<TreeDefaults>('slotted tree defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its trees behave, rather than repeating
 * twenty inputs on every hierarchy in a product. A tree that states any of them
 * itself still wins: an explicit input is never overridden by the token.
 */
export function provideTreeDefaults(defaults: Partial<TreeDefaults>) {
  return {
    provide: TREE_DEFAULTS,
    useFactory: (): TreeDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a tree behaves as here, before it states anything of its own. */
export function injectTreeDefaults(): TreeDefaults {
  return inject(TREE_DEFAULTS);
}

/**
 * `aria-activedescendant` names a node by its id, and a node's own label names
 * the node, so every node needs two ids and the same strings have to be
 * produced on the server and in the browser. A counter held by the injector
 * produces them; `Math.random` would not match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlTreeIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-tree-${this.count}`;
  }
}
