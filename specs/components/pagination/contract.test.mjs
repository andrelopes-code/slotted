import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const pagination = contract.members.pagination;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because every part reads one state', () => {
  assert.equal(contract.family, 'pagination');
  assert.equal(contract.ui, 'pagination');
  assert.deepEqual(Object.keys(contract.members), ['pagination']);
  assert.equal(pagination.nativeElement, 'nav');
  assert.equal(contract.rootRole, 'navigation');
});

/**
 * Thirteen parts, and twelve of them optional. That is the whole composition
 * story: a numbered paginator is the row between two triggers, and a table's
 * paginator bar is a page size, a range and two triggers. The field ships those
 * as two components — MUI `Pagination` and Angular Material `mat-paginator` —
 * and they are one family in two arrangements.
 */
test('names every part the two arrangements are assembled from', () => {
  assert.deepEqual(pagination.parts, [
    'root',
    'list',
    'item',
    'page',
    'ellipsis',
    'summary',
    'first',
    'previous',
    'next',
    'last',
    'status',
    'page-size',
    'page-size-label',
  ]);
});

/**
 * The page and the page size are both values a consumer can own, and neither
 * of them is called `value`. The contract names both pairs, and the workbench
 * reads the names from here rather than guessing them from the capability.
 */
test('gives the page and the page size a model each', () => {
  assert.deepEqual(contract.stateModel.current, {
    controlled: 'page',
    uncontrolled: 'defaultPage',
    request: 'onPageChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'pageSize',
    uncontrolled: 'defaultPageSize',
    request: 'onPageSizeChange',
    reasons: ['select', 'programmatic'],
  });
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason));
  }
});

/**
 * The collection shrinks under a reader who is on page forty. The family
 * clamps the page and says so with `programmatic`, so a consumer holding the
 * value follows instead of rendering an empty page.
 */
test('can move the page by itself, and says when it did', () => {
  assert.ok(contract.stateModel.current.reasons.includes('programmatic'));
});

/**
 * `aria-current="page"` is the value the ARIA specification names for a link
 * inside a set of pagination links. The family writes it and mirrors it into
 * no `data-current`, exactly as the breadcrumb does.
 */
test('marks the current page with the platform attribute', () => {
  assert.equal(contract.currentValue, 'page');
  assert.equal(contract.currentSource, 'aria-current');
  assert.ok(!pagination.states.includes('current'));
  assert.ok(!('current' in contract.stateAttributes));
});

test('takes its arithmetic from the module both bindings share', () => {
  assert.equal(contract.arithmetic, '@slotted/core/pagination');
});

/**
 * A middle click, a bookmark and a crawler all need a destination. One input
 * decides the element, so a paginator is either entirely buttons or entirely
 * links and never half of each.
 */
test('lets one input turn every control into a real link', () => {
  assert.deepEqual(contract.itemElement, {
    withoutHref: 'button',
    withHref: 'a',
    decidedBy: 'itemHref',
  });
});

/**
 * Responsiveness that changes composition rather than size, from the family's
 * own inline size rather than the viewport: a paginator under a table in a
 * split pane compacts, and the same paginator on a full page does not.
 */
test('compacts from its own container, with a literal breakpoint', () => {
  assert.equal(contract.compaction.container, 'slotted-pagination');
  assert.equal(contract.compaction.breakpoint, '22rem');
  assert.equal(contract.compaction.above, 'list');
  assert.equal(contract.compaction.below, 'summary');
  assert.ok(pagination.parts.includes('summary'));
  assert.ok('--slotted-pagination-compact-breakpoint' in contract.literals);
});

/** Activating a control that then disappears must not lose focus to the body. */
test('names where focus goes when the control that moved the page becomes unavailable', () => {
  assert.deepEqual(contract.focusAfterChange, [
    'the control that was pressed, while it survives the change',
    'previous',
    'last',
    'first',
    'the current page in the row',
  ]);
});

test('takes every key from the platform', () => {
  assert.deepEqual(
    contract.keyboard.map((row) => row.key),
    ['Tab', 'Enter', 'Space'],
  );
  for (const row of contract.keyboard) assert.equal(row.source, 'platform');
});

test('names an owner for everything it declines', () => {
  assert.deepEqual(Object.keys(contract.declined), [
    'shortcuts',
    'rovingFocus',
    'slicing',
    'ellipsisMenu',
  ]);
  for (const [capability, decline] of Object.entries(contract.declined)) {
    assert.ok(decline.deferTo, `${capability} declines and names no owner`);
    assert.ok(decline.reason.length > 40, `${capability} declines without a reason`);
  }
});

/**
 * `count` is the one input with no default. Absent, the total is unknown: the
 * row of numbers is not drawn and the family invents nothing. Declaring a
 * default of nought said the opposite — that an unstated collection is empty —
 * and the reference page repeated it before the contract was corrected.
 */
test('gives the total no default, because absent means unknown', () => {
  assert.ok(!('count' in pagination.defaults));
  assert.ok(pagination.capabilities.includes('current'));
});

test('announces a page change politely, and lets an application turn it off', () => {
  assert.ok(pagination.capabilities.includes('live'));
  assert.equal(pagination.defaults.live, 'polite');
  assert.ok(pagination.parts.includes('status'));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['pagination']);
  assert.deepEqual(contract.scenarios.pagination, [
    'playground',
    'numbered',
    'cursor',
    'range',
    'pageSize',
    'links',
    'compact',
    'states',
    'content',
    'composition',
    'keyboard',
  ]);
});
