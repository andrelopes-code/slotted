/**
 * Which option an arrow key moves to in a collection whose groups each lay
 * their options out in a column count of their own.
 *
 * A group is a run of consecutive options in document order. Inside a group
 * the options fill rows of `columns`. A row key steps by the group's own
 * count, and from the first or last row it leaves for the nearest option of
 * the neighbouring group, in the same column when that group has one. An
 * inline key moves one option inside a group of more than one column and does
 * nothing in a group of one.
 *
 * Nothing here touches the DOM or a framework.
 */

/** The direction a key asks for, in the drawn arrangement. */
export type GroupMoveIntent = 'up' | 'down' | 'previous' | 'next';

/** A run of consecutive options laid out in `columns`. */
export interface GroupSpan {
  /** The index of the group's first option in the whole collection. */
  start: number;
  count: number;
  columns: number;
}

export interface MoveInGroupsInput {
  /** One entry per option, in document order: whether it can be highlighted. */
  enabled: readonly boolean[];
  /** Where the highlight is now, or `-1` when there is none. */
  from: number;
  /** The groups, in document order, covering every option once. */
  groups: readonly GroupSpan[];
  intent: GroupMoveIntent;
}

/** The index the highlight moves to, or `-1` when the key moves nothing. */
export function moveInGroups({ enabled, from, groups, intent }: MoveInGroupsInput): number {
  const at = groups.findIndex((group) => from >= group.start && from < group.start + group.count);

  if (at === -1) return entry(enabled, intent);

  const group = groups[at]!;
  const columns = Math.max(Math.floor(group.columns), 1);
  const local = from - group.start;
  const column = local % columns;

  if (intent === 'next' || intent === 'previous') {
    if (columns === 1) return -1;

    return inGroup(enabled, group, from + (intent === 'next' ? 1 : -1), intent === 'next' ? 1 : -1);
  }

  const step = intent === 'down' ? 1 : -1;
  const target = local + step * columns;

  if (target >= 0 && target < group.count) {
    return inGroup(enabled, group, group.start + target, step);
  }

  if (step === 1 && Math.floor(local / columns) < Math.floor((group.count - 1) / columns)) {
    return inGroup(enabled, group, group.start + group.count - 1, -1);
  }

  return neighbour(enabled, groups, at + step, column, step);
}

/** With no highlight, a row key starts at the first or the last enabled option. */
function entry(enabled: readonly boolean[], intent: GroupMoveIntent) {
  if (intent === 'down') return enabled.indexOf(true);
  if (intent === 'up') return enabled.lastIndexOf(true);

  return -1;
}

/** `index`, or the nearest enabled option from it in `step` inside the group. */
function inGroup(enabled: readonly boolean[], group: GroupSpan, index: number, step: 1 | -1) {
  for (let at = index; at >= group.start && at < group.start + group.count; at += step) {
    if (enabled[at] === true) return at;
  }

  return -1;
}

/** The option in `column` of the neighbouring group's near row, or the nearest enabled one. */
function neighbour(
  enabled: readonly boolean[],
  groups: readonly GroupSpan[],
  at: number,
  column: number,
  step: 1 | -1,
): number {
  const group = groups[at];

  if (group === undefined) return -1;

  const columns = Math.max(Math.floor(group.columns), 1);
  const rowStart = step === 1 ? 0 : Math.floor((group.count - 1) / columns) * columns;
  const local = Math.min(rowStart + Math.min(column, columns - 1), group.count - 1);
  const found = inGroup(enabled, group, group.start + local, step);

  return found === -1 ? neighbour(enabled, groups, at + step, column, step) : found;
}
