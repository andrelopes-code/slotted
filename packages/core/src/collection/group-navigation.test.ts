import { describe, expect, it } from 'vitest';

import { moveInGroups } from './group-navigation';
import type { GroupMoveIntent } from './group-navigation';

describe('moveInGroups', () => {
  it.each(CASES)('%s', (_name, from, intent, expected, disabled = []) => {
    const enabled = Array.from({ length: 7 }, (_, index) => !disabled.includes(index));

    expect(moveInGroups({ enabled, from, groups: GROUPS, intent })).toBe(expected);
  });
});

/* Accounts a, b in one column; cards c, d, e, f, g in two (rows c d, e f, g). */
const GROUPS = [
  { start: 0, count: 2, columns: 1 },
  { start: 2, count: 5, columns: 2 },
];

const CASES: Array<[string, number, GroupMoveIntent, number, number[]?]> = [
  ['steps down one row in a one-column group', 0, 'down', 1],
  ['leaves the last row for the first option of the next group', 1, 'down', 2],
  ['steps down by the columns of a multi-column group', 2, 'down', 4],
  ['moves right inside a multi-column group', 2, 'next', 3],
  ['ignores an inline key in a one-column group', 0, 'next', -1],
  ['lands on the last option from a row above a short last row', 5, 'down', 6],
  ['stays on the last row of the last group', 6, 'down', -1],
  ['enters the previous group on its last row', 2, 'up', 1],
  ['keeps the column entering a group from below', 3, 'up', 1],
  ['steps over a disabled option inside the group', 2, 'down', 5, [4]],
  ['starts at the first enabled option with no highlight', -1, 'down', 0],
];
