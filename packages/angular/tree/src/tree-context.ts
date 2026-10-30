import type { Signal } from '@angular/core';

import type { TreeExpandOn, TreeSelectionIndicator, TreeSelectionMode } from './tree-defaults';

/**
 * What a part asks the tree around it.
 *
 * It is an abstract class rather than an interface so it can be the injection
 * token as well as the type, and it exists in a file of its own so the parts do
 * not import the component that renders them: the component's own template
 * applies the node component, and a direct import each way is a cycle.
 */
export abstract class SlTreeContext {
  abstract readonly indicatorMode: Signal<Exclude<TreeSelectionIndicator, 'auto'>>;
  abstract readonly selection: Signal<TreeSelectionMode>;
  abstract readonly expandOnRow: Signal<TreeExpandOn>;
  abstract readonly treeDisabled: Signal<boolean>;
  abstract readonly showGuides: Signal<boolean>;
  /** Whether this key is chosen. */
  abstract isSelected(key: string): boolean;
  /** Whether this branch is open. */
  abstract isExpanded(key: string): boolean;
  /** Whether this key is the one the keyboard is on. */
  abstract isActive(key: string): boolean;
  /** Whether this branch holds part of a selection and not the whole of it. */
  abstract isIndeterminate(key: string): boolean;
  /** Whether this collapsed branch holds a chosen descendant. */
  abstract holdsSelection(key: string): boolean;
  /** The id a node carries, so `aria-activedescendant` can name it. */
  abstract nodeId(key: string): string;
  /** The id of the node's own label, which is what names the node. */
  abstract labelId(key: string): string;
  /** The tab stop under the roving model, and `null` under the other one. */
  abstract nodeTabIndex(key: string): number | null;
  /**
   * The level, the size of the sibling group and the place in it. All three are
   * `null` unless the flat structure is in force, which is exactly when the
   * pattern requires them: with the nesting in the DOM the browser computes
   * them itself.
   */
  abstract levelOf(key: string): number | null;
  abstract setSizeOf(key: string): number | null;
  abstract posInSetOf(key: string): number | null;
  /** A press on a row, with the modifiers it was pressed with. */
  abstract press(key: string, event: MouseEvent): void;
  /** A press on the chevron, which only ever opens or closes. */
  abstract pressExpander(key: string, event: MouseEvent): void;
  /** A press on the box, which only ever selects. */
  abstract pressIndicator(key: string, event: MouseEvent): void;
}
