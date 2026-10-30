import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.dataList;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'data-list');
  assert.equal(contract.ui, 'data-list');
  assert.equal(contract.schemaVersion, 5);
  assert.equal(member.nativeElement, 'div');
});

/** The anatomy of the design, §2, part for part and in document order. */
test('declares the parts of the design, each described', () => {
  assert.deepEqual(member.parts, [
    'root',
    'header',
    'select-all',
    'count',
    'sort',
    'selection',
    'media',
    'title',
    'fields',
    'field',
    'field-label',
    'field-value',
    'field-empty',
    'more',
    'trailing',
    'empty',
    'loader',
    'footer',
    'load-more',
  ]);
  for (const part of member.parts) {
    assert.equal(typeof contract.anatomy[part], 'string', `anatomy ${part}`);
  }
});

/**
 * The item is another family's element. A part this family wrote on the `li`
 * would overwrite `list-item`'s own `data-part`, and the row would stop being
 * recognised by the stylesheet that paints it.
 */
test('composes list and list-item for the set and the record', () => {
  for (const family of [
    'list',
    'list-item',
    'checkbox',
    'menu',
    'button',
    'result-state',
    'skeleton',
  ]) {
    assert.ok(contract.composes.includes(family), `composes ${family}`);
  }
  assert.ok(!contract.composes.includes('description-list'));
  assert.match(contract.fields.element, /^dl/);
  assert.match(contract.fields.reason, /26rem/);
});

/**
 * The model is `data-grid`'s: the same column type and the same query object,
 * so a list and a grid bound to one query agree about what it means.
 */
test('reads the grid model and holds the query, the selection and the expansion', () => {
  assert.match(contract.data.columns, /GridColumn/);
  assert.match(contract.data.query, /GridQuery/);
  const { scope: sortScope, ...sort } = contract.stateModel.sort;
  const { scope: filterScope, ...filter } = contract.stateModel.filter;
  assert.deepEqual(sort, filter);
  assert.match(sortScope, /change/);
  assert.match(filterScope, /same query/);
  assert.equal(contract.stateModel.sort.controlled, 'query');
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard', 'select', 'clear', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'expanded',
    uncontrolled: 'defaultExpanded',
    request: 'onExpandedChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  for (const capability of ['sort', 'filter', 'selection', 'open']) {
    assert.ok(member.capabilities.includes(capability), capability);
    assert.ok(MUTABLE_CAPABILITIES.includes(capability));
  }
  assert.ok(!member.capabilities.includes('current'), 'current is an input the family never moves');
});

/** §2.1: the order a field takes its place in, which is the pop-in's order reversed. */
test('assigns columns to the item by a written rule', () => {
  assert.deepEqual(Object.keys(contract.columns), [
    'title',
    'subtitle',
    'trailing',
    'actions',
    'fields',
    'excluded',
  ]);
  assert.match(contract.columns.title, /rowHeader/);
  assert.match(contract.columns.fields, /priority/);
  assert.match(contract.columns.excluded, /popin: false/);
  assert.equal(member.defaults.fields, 4);
});

test('owns no key of its own and says why', () => {
  const keys = contract.keyboard.map((entry) => entry.key);
  assert.deepEqual(keys, ['Tab', 'Shift+Tab', 'Enter', 'Space', 'Shift+Space']);
  for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
    assert.ok(contract.keyboardDeparture.keys.includes(key), key);
  }
  assert.match(contract.keyboardDeparture.deferTo, /data-grid/);
});

test('names the three states beside loading', () => {
  assert.deepEqual(Object.keys(contract.empty.states), ['empty', 'no-results', 'error']);
  assert.equal(contract.loading.first.composes, 'skeleton');
  assert.equal(member.defaults.loadingDelay, 200);
  assert.equal(member.defaults.loadingMinDuration, 400);
});

/** Every word the family says, from its catalog, and the ones that count are plural. */
test('closes the message set', () => {
  assert.deepEqual([...contract.messages].sort(), [
    'ascending',
    'clearFilters',
    'count',
    'descending',
    'empty',
    'emptyTitle',
    'errorTitle',
    'false',
    'less',
    'loadMore',
    'loading',
    'more',
    'noResultsTitle',
    'retry',
    'selectAll',
    'selectRow',
    'selectedCount',
    'sort',
    'sortCleared',
    'sortColumn',
    'sortDirection',
    'sortNamed',
    'sortNone',
    'sortSummary',
    'sortedBy',
    'sortedByAscending',
    'sortedByDescending',
    'true',
  ]);
  for (const key of contract.pluralMessages) {
    assert.ok(contract.messages.includes(key), key);
  }
});
