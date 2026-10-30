/**
 * What a hierarchical collection is made of, resolved once for every family
 * that has one.
 *
 * `items.ts` answers the flat and grouped shapes and names `tree` as one of the
 * six families it exists to keep in agreement; it holds no parent, no level and
 * no descendant, so `tree` — and `table`, when its tree grid is built — cannot
 * be written against it. This module is that missing half, and it is here
 * rather than in the family for the reason the flat one is: two families
 * deciding separately what "every descendant of this key" means is two answers
 * to one question, and no test could prove they agree.
 *
 * ── Two orders, named apart ───────────────────────────────────────────────
 *
 * `nodes` is every node, depth first, whatever is expanded. `visible(expanded)`
 * is the subset a reader can reach right now, and it is the one the keyboard,
 * the roving tab stop and the window all count. Keeping one array for both is
 * the defect that makes an arrow key skip a row: the keyboard counts what is on
 * screen and the collection counts what exists.
 *
 * Nothing here touches the DOM or a framework.
 */

export interface TreeCollectionOptions<T> {
  /** A nested collection: the roots, each reached for its children. */
  roots?: readonly T[] | undefined;
  /**
   * An already-flat collection, each item carrying its own level. This is what
   * a rowset backend returns, and the shape the Angular CDK names
   * `levelAccessor`. Mutually exclusive with `roots`, and it requires
   * `getLevel`.
   */
  items?: readonly T[] | undefined;
  /** The identity that survives a reorder. It is a string, always. */
  getKey: (item: T) => string;
  /**
   * What the reader sees and what typeahead matches. Defaults to the key, for
   * the reason `createCollection` states: wrong often enough to be worth
   * noticing, harmless enough never to throw.
   */
  getLabel?: ((item: T) => string) | undefined;
  /** The children of a node in the nested shape. */
  getChildren?: ((item: T) => readonly T[] | undefined) | undefined;
  /** The depth of a node in the flat shape, with the roots at zero. */
  getLevel?: ((item: T) => number) | undefined;
  /**
   * Whether a node is a branch. Without it a node is a branch when it holds
   * children or states a count, which leaves no way to say "this folder has
   * children nobody has fetched yet" — the one fact lazy loading turns on.
   */
  hasChildren?: ((item: T) => boolean) | undefined;
  /**
   * How many children a branch will have once they arrive. It is what a
   * placeholder is drawn from and what `aria-setsize` reports for children the
   * DOM does not hold yet.
   */
  getChildrenCount?: ((item: T) => number | undefined) | undefined;
  isDisabled?: ((item: T) => boolean) | undefined;
}

export interface TreeNode<T> {
  key: string;
  label: string;
  item: T;
  /** Its place in the depth-first order over the whole tree. */
  index: number;
  /** Zero at the roots, which is one less than `aria-level` reports. */
  level: number;
  parent: string | undefined;
  /** The children it holds now, which is empty for a branch not yet fetched. */
  children: readonly string[];
  hasChildren: boolean;
  childrenCount: number | undefined;
  disabled: boolean;
  /** One-based, among its siblings. What `aria-posinset` reports. */
  posInSet: number;
  /** How many siblings it has, counting the ones not fetched yet. */
  setSize: number;
}

export interface TreeCollection<T> {
  /** Every node, depth first, whatever is expanded. */
  readonly nodes: readonly TreeNode<T>[];
  /** Node keys in the same order. The order every selection is sorted into. */
  readonly keys: readonly string[];
  readonly roots: readonly string[];
  /** Every branch, in order. What expand-all opens. */
  readonly branchKeys: readonly string[];
  nodeFor: (key: string) => TreeNode<T> | undefined;
  isDisabled: (key: string) => boolean;
  /** The nodes a reader can reach with this set expanded, depth first. */
  visible: (expanded: Iterable<string>) => readonly TreeNode<T>[];
  /** Every descendant, depth first. Empty for a leaf. */
  descendantsOf: (key: string) => readonly string[];
  /** Every ancestor, root first, which is the order a path is opened in. */
  ancestorsOf: (key: string) => readonly string[];
  /** The whole sibling group, including the key itself. What `*` expands. */
  siblingsOf: (key: string) => readonly string[];
}

interface Draft<T> {
  node: TreeNode<T>;
  children: string[];
}

/**
 * A hierarchical collection over nested data or over flat data with a level.
 *
 * A duplicate key is dropped rather than kept, which is where this parts from
 * `createCollection`. A flat list's rows are positional and a repeated key
 * there costs an index; a hierarchy's are not — two nodes carrying one key
 * break `aria-activedescendant`, the roving tab stop and every selection
 * lookup at once, and the second one is unrenderable rather than merely
 * ambiguous.
 *
 * It is also what makes a cycle terminate. `getChildren` reaching back to an
 * ancestor is a defect that only ever appears in a consumer's data, and a walk
 * that did not return is a page that never renders.
 */
export function createTreeCollection<T>({
  roots: rootItems,
  items,
  getKey,
  getLabel,
  getChildren,
  getLevel,
  hasChildren,
  getChildrenCount,
  isDisabled,
}: TreeCollectionOptions<T>): TreeCollection<T> {
  const label = getLabel ?? ((item: T) => getKey(item));
  const disabled = isDisabled ?? (() => false);
  const count = getChildrenCount ?? (() => undefined);

  const drafts: Draft<T>[] = [];
  const byKey = new Map<string, Draft<T>>();
  const rootKeys: string[] = [];

  const push = (item: T, level: number, parent: string | undefined): Draft<T> | undefined => {
    const key = getKey(item);
    if (byKey.has(key)) return undefined;
    const childrenCount = count(item);
    const draft: Draft<T> = {
      node: {
        key,
        label: label(item),
        item,
        index: drafts.length,
        level,
        parent,
        children: [],
        hasChildren: false,
        childrenCount,
        disabled: disabled(item) === true,
        posInSet: 0,
        setSize: 0,
      },
      children: [],
    };
    drafts.push(draft);
    byKey.set(key, draft);
    if (parent === undefined) rootKeys.push(key);
    else byKey.get(parent)?.children.push(key);
    return draft;
  };

  if (items !== undefined) {
    /* The flat shape. A row's parent is the last row one level above it, and a
       level that skips a step is attached to the nearest ancestor rather than
       dropped: a row the consumer sent and the tree does not render is a row
       nobody can debug. */
    const path: string[] = [];
    const levelOf = getLevel ?? (() => 0);
    for (const item of items) {
      const claimed = Math.max(0, Math.trunc(levelOf(item)));
      const level = Math.min(claimed, path.length);
      const parent = level === 0 ? undefined : path[level - 1];
      const draft = push(item, level, parent);
      if (draft === undefined) continue;
      path.length = level;
      path.push(draft.node.key);
    }
  } else {
    const walk = (item: T, level: number, parent: string | undefined) => {
      const draft = push(item, level, parent);
      if (draft === undefined) return;
      for (const child of getChildren?.(item) ?? []) walk(child, level + 1, draft.node.key);
    };
    for (const item of rootItems ?? []) walk(item, 0, undefined);
  }

  /* The two counts the pattern asks for are settled once the whole shape is
     known: a sibling group's size is the number fetched, or the count the
     parent states when more of it exists than has arrived. */
  const settle = (group: readonly string[], setSize: number) => {
    group.forEach((key, position) => {
      const draft = byKey.get(key);
      if (draft === undefined) return;
      draft.node.posInSet = position + 1;
      draft.node.setSize = setSize;
    });
  };

  settle(rootKeys, rootKeys.length);
  for (const draft of drafts) {
    draft.node.children = draft.children;
    draft.node.hasChildren =
      hasChildren !== undefined
        ? hasChildren(draft.node.item) === true
        : draft.children.length > 0 || (draft.node.childrenCount ?? 0) > 0;
    settle(draft.children, Math.max(draft.node.childrenCount ?? 0, draft.children.length));
  }

  const nodes = drafts.map((draft) => draft.node);
  const keys = nodes.map((node) => node.key);
  const branchKeys = nodes.filter((node) => node.hasChildren).map((node) => node.key);
  const nodeFor = (key: string) => byKey.get(key)?.node;

  const descendantsOf = (key: string) => {
    const start = nodeFor(key);
    if (start === undefined) return [];
    const held: string[] = [];
    for (let index = start.index + 1; index < nodes.length; index += 1) {
      const node = nodes[index] as TreeNode<T>;
      if (node.level <= start.level) break;
      held.push(node.key);
    }
    return held;
  };

  const ancestorsOf = (key: string) => {
    const path: string[] = [];
    let current = nodeFor(key)?.parent;
    while (current !== undefined) {
      path.unshift(current);
      current = nodeFor(current)?.parent;
    }
    return path;
  };

  return {
    nodes,
    keys,
    roots: rootKeys,
    branchKeys,
    nodeFor,
    isDisabled: (key) => nodeFor(key)?.disabled ?? false,
    descendantsOf,
    ancestorsOf,
    siblingsOf: (key) => {
      const node = nodeFor(key);
      if (node === undefined) return [];
      if (node.parent === undefined) return rootKeys;
      return nodeFor(node.parent)?.children ?? [];
    },
    visible: (expanded) => {
      const open = new Set(expanded);
      const shown: TreeNode<T>[] = [];
      /* The path is walked rather than the set read, because an expanded branch
         inside a collapsed one shows nothing: a reader who opens a grandchild
         and then closes its grandparent leaves exactly that set behind. */
      let closedAt = -1;
      for (const node of nodes) {
        if (closedAt !== -1 && node.level > closedAt) continue;
        closedAt = -1;
        shown.push(node);
        if (node.hasChildren && !open.has(node.key)) closedAt = node.level;
      }
      return shown;
    },
  };
}

/** Which direction a press moves a node in, or the flip a plain press means. */
export type CascadeAction = 'toggle' | 'select' | 'deselect';

export interface CascadeInput {
  collection: TreeCollection<unknown>;
  /** The selection as it stands. */
  selected: readonly string[];
  key: string;
  action: CascadeAction;
}

export interface CascadeResult {
  selected: readonly string[];
  /** Whether anything moved. A request that changes nothing emits nothing. */
  changed: boolean;
}

function ordered(
  collection: TreeCollection<unknown>,
  chosen: ReadonlySet<string>,
  held: readonly string[],
) {
  const inside = collection.keys.filter((key) => chosen.has(key));
  /* A key the collection no longer holds — a filtered tree, a branch that has
     been unloaded — survives at the end, in the order it arrived. Dropping it
     silently would delete a choice nobody asked to delete. */
  const outside = held.filter((key) => chosen.has(key) && collection.nodeFor(key) === undefined);
  return [...inside, ...outside];
}

function same(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

/**
 * The selection after one node is pressed, with the check cascading down to the
 * descendants and rolling back up to the ancestors.
 *
 * Down: the node and every enabled descendant take the node's new state. A
 * disabled descendant is left exactly as it was, in both directions — the
 * reader cannot reach it, so nothing may decide it on the reader's behalf.
 *
 * Up: a branch is selected exactly when every enabled child of it is. A branch
 * whose children have not been fetched has none to roll up from and is a leaf
 * for this purpose, so it stays selected on its own.
 */
export function cascadeSelection({
  collection,
  selected,
  key,
  action,
}: CascadeInput): CascadeResult {
  const unchanged: CascadeResult = { selected, changed: false };
  const node = collection.nodeFor(key);
  if (node === undefined || node.disabled) return unchanged;

  const chosen = new Set(selected);
  const next = action === 'toggle' ? !chosen.has(key) : action === 'select';

  for (const candidate of [key, ...collection.descendantsOf(key)]) {
    if (collection.isDisabled(candidate)) continue;
    if (next) chosen.add(candidate);
    else chosen.delete(candidate);
  }

  /* Deepest first, so a branch reads children this pass has already settled. */
  for (const branch of [...collection.nodes].reverse()) {
    if (!branch.hasChildren || branch.children.length === 0) continue;
    const enabled = branch.children.filter((child) => !collection.isDisabled(child));
    if (enabled.length === 0) continue;
    if (enabled.every((child) => chosen.has(child))) chosen.add(branch.key);
    else chosen.delete(branch.key);
  }

  const result = ordered(collection, chosen, selected);
  return same(result, selected) ? unchanged : { selected: result, changed: true };
}

/**
 * The branches holding part of a selection and not the whole of it, in the
 * collection's order.
 *
 * A branch that is itself selected is not indeterminate, whatever its children
 * say: the reader chose it, and a box that is both ticked and partial says two
 * things at once.
 */
export function indeterminateKeys(
  collection: TreeCollection<unknown>,
  selected: readonly string[],
): readonly string[] {
  const chosen = new Set(selected);
  if (chosen.size === 0) return [];

  return collection.nodes
    .filter((node) => {
      if (!node.hasChildren || chosen.has(node.key)) return false;
      return collection.descendantsOf(node.key).some((child) => chosen.has(child));
    })
    .map((node) => node.key);
}
