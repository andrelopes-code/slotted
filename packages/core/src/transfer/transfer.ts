/**
 * The arithmetic of a dual list: which key stands on which side, in which
 * order, and what a move, a reorder or a select-all asks for.
 *
 * Both bindings of `transfer` draw the same two lists from the same value, and
 * a move computed twice is a move that disagrees between React and Angular the
 * first time one of them is edited. Nothing here touches the DOM or a
 * framework; every function takes keys and returns keys.
 */

export type TransferSide = 'source' | 'target';

/** What a move request says it did. `reorder` stays inside the target. */
export type TransferDirection = 'target' | 'source' | 'reorder';

export interface TransferPartition {
  readonly source: readonly string[];
  readonly target: readonly string[];
}

function unique(keys: readonly string[]): string[] {
  return [...new Set(keys)];
}

/**
 * The two sides. Without `reorderable` the target follows the collection's
 * order and its own order means nothing; with it the target is `targetKeys` as
 * written. A key the collection does not hold — an item not loaded yet — stays
 * in the target, at the end when the order is the collection's, because
 * dropping it would change a form's value without anyone asking.
 */
export function partitionKeys(
  allKeys: readonly string[],
  targetKeys: readonly string[],
  reorderable: boolean,
): TransferPartition {
  const chosen = unique(targetKeys);
  const inTarget = new Set(chosen);
  const known = new Set(allKeys);
  const source = allKeys.filter((key) => !inTarget.has(key));
  const target = reorderable
    ? chosen
    : [...allKeys.filter((key) => inTarget.has(key)), ...chosen.filter((key) => !known.has(key))];
  return { source, target };
}

export interface MoveKeysInput {
  readonly allKeys: readonly string[];
  readonly targetKeys: readonly string[];
  /** The keys to send, in any order. */
  readonly keys: readonly string[];
  readonly to: TransferSide;
  readonly reorderable: boolean;
  /**
   * Where the keys land in the target, as a splice index in `targetKeys`.
   * Omitted, they join the end. Read only under `reorderable`.
   */
  readonly index?: number | undefined;
}

/**
 * The target's keys after a move. Keys join in the collection's order,
 * whatever order they were picked in, so "Add" twice and "Add all" once give
 * the same list.
 */
export function moveKeys({
  allKeys,
  targetKeys,
  keys,
  to,
  reorderable,
  index,
}: MoveKeysInput): readonly string[] {
  const current = unique(targetKeys);
  const moving = new Set(keys);

  if (to === 'source') return current.filter((key) => !moving.has(key));

  const present = new Set(current);
  const rank = new Map(allKeys.map((key, position) => [key, position]));
  const joining = unique(keys)
    .filter((key) => !present.has(key))
    .sort((a, b) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity));
  if (joining.length === 0) return current;

  if (!reorderable) return partitionKeys(allKeys, [...current, ...joining], false).target;

  const at = Math.min(Math.max(index ?? current.length, 0), current.length);
  return [...current.slice(0, at), ...joining, ...current.slice(at)];
}

/**
 * Every selected key one place toward the start (`-1`) or the end (`1`). A
 * key moves past a neighbour that is not moving; one against the edge, or
 * behind another that cannot move, stays. It is the APG example's Up and Down
 * applied to a multiple selection, and the relative order of the selection
 * never changes.
 */
export function reorderKeys(
  targetKeys: readonly string[],
  keys: readonly string[],
  delta: -1 | 1,
): readonly string[] {
  const next = unique(targetKeys);
  const moving = new Set(keys);
  const indexes = next.map((_, position) => position);
  if (delta === 1) indexes.reverse();
  const blocked = new Set<string>();

  for (const position of indexes) {
    const key = next[position]!;
    if (!moving.has(key)) continue;
    const neighbour = position + delta;
    const other = next[neighbour];
    if (other === undefined || blocked.has(other)) {
      blocked.add(key);
      continue;
    }
    if (moving.has(other)) {
      blocked.add(key);
      continue;
    }
    next[neighbour] = key;
    next[position] = other;
  }
  return next;
}

/**
 * The keys moved to a splice index of the list as it stood, which is what a
 * drop between two options names: they land before the key that stood at
 * `index`, or at the end.
 */
export function reorderKeysTo(
  targetKeys: readonly string[],
  keys: readonly string[],
  index: number,
): readonly string[] {
  const current = unique(targetKeys);
  const moving = new Set(keys);
  const anchor = current.slice(Math.max(index, 0)).find((key) => !moving.has(key));
  const rest = current.filter((key) => !moving.has(key));
  const carried = current.filter((key) => moving.has(key));
  const at = anchor === undefined ? rest.length : rest.indexOf(anchor);
  return [...rest.slice(0, at), ...carried, ...rest.slice(at)];
}

export interface KeysToMoveInput {
  /** The pane's keys as it draws them: under a query, only what matched. */
  readonly visible: readonly string[];
  readonly selected: readonly string[];
  readonly disabled: ReadonlySet<string>;
  /** The option the keyboard is on, the fallback when nothing is selected. */
  readonly active: string | null;
}

/**
 * What a move sends: the pane's selected keys the reader can see and that can
 * move, in the pane's order, or the active option when none is. A selected key
 * hidden by a query stays where it is, because a move the reader cannot see is
 * a move they did not make.
 */
export function keysToMove({ visible, selected, disabled, active }: KeysToMoveInput): string[] {
  const chosen = new Set(selected);
  const keys = visible.filter((key) => chosen.has(key) && !disabled.has(key));
  if (keys.length > 0) return keys;
  if (active !== null && visible.includes(active) && !disabled.has(active)) return [active];
  return [];
}

/**
 * Select-all over one pane: every visible enabled key joins the selection, or
 * leaves it, and the rest of the selection — the other pane, the keys a query
 * hides — is left alone.
 */
export function toggleVisibleSelection(
  selected: readonly string[],
  visible: readonly string[],
  disabled: ReadonlySet<string>,
  select: boolean,
): readonly string[] {
  const reach = visible.filter((key) => !disabled.has(key));
  if (!select) {
    const leaving = new Set(reach);
    return selected.filter((key) => !leaving.has(key));
  }
  return unique([...selected, ...reach]);
}
