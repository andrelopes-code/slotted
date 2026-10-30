import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.transfer;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'transfer');
  assert.equal(contract.ui, 'transfer');
  assert.equal(contract.schemaVersion, 5);
  assert.deepEqual(Object.keys(contract.members), ['transfer']);
  assert.equal(member.nativeElement, 'div');
  assert.match(contract.rootRole, /group/);
});

/**
 * The design's anatomy, §3, part for part. Each list is the listbox family,
 * so an option is the listbox's part and not this family's; `list` is the box
 * around it that the drop indicator is positioned in.
 */
test('declares every part of the anatomy', () => {
  assert.deepEqual(member.parts, [
    'root',
    'switch',
    'body',
    'pane',
    'pane-header',
    'select-all',
    'title',
    'count',
    'search',
    'search-icon',
    'list',
    'empty',
    'drop-indicator',
    'pane-footer',
    'actions',
    'move-to-target',
    'move-all-to-target',
    'move-to-source',
    'move-all-to-source',
    'reorder',
    'move-up',
    'move-down',
  ]);
  for (const part of member.parts) {
    assert.ok(typeof contract.anatomy[part] === 'string', `${part} is not described`);
  }
  assert.deepEqual(contract.composes, [
    'listbox',
    'checkbox',
    'text-field',
    'button',
    'segmented-control',
  ]);
});

/**
 * Four values move: the keys in the target, the selection across both panes,
 * each pane's query, and the pane shown in steps. The scope paragraph names the
 * first two `targetKeys` and `selectedKeys`, and the bindings keep the names.
 */
test('models every mutable value with its reasons', () => {
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'targetKeys',
    uncontrolled: 'defaultTargetKeys',
    request: 'onTargetKeysChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'selectedKeys',
    uncontrolled: 'defaultSelectedKeys',
    request: 'onSelectedKeysChange',
    reasons: ['pointer', 'keyboard', 'select', 'programmatic'],
  });
  assert.deepEqual(Object.keys(contract.stateModel.filter), ['source', 'target']);
  assert.equal(contract.stateModel.filter.source.controlled, 'sourceQuery');
  assert.equal(contract.stateModel.filter.target.request, 'onTargetQueryChange');
  assert.deepEqual(contract.stateModel.current, {
    controlled: 'pane',
    uncontrolled: 'defaultPane',
    request: 'onPaneChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  const models = [
    contract.stateModel.value,
    contract.stateModel.selection,
    contract.stateModel.current,
    ...Object.values(contract.stateModel.filter),
  ];
  for (const model of models) {
    for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason), reason);
  }
});

test('carries the direction and the moved keys on the move request', () => {
  assert.match(contract.request.targetKeys, /direction is target, source or reorder/);
  assert.match(contract.request.targetKeys, /keys are the keys that moved/);
  assert.match(contract.request.moveClearsSelection, /leave the selection/);
  assert.match(contract.request.equal, /not emitted/);
});

/**
 * The rules of §4, where a test can find them: order with and without
 * `reorderable`, what move-all and select-all reach under a query, the focus
 * after a pane empties, and the unresolved key that is kept rather than
 * dropped.
 */
test('states the rules that decide what a move may do', () => {
  assert.match(contract.rules.collection, /data-unresolved/);
  assert.match(contract.rules.collection, /never dropped/);
  assert.match(contract.rules.order, /order of items/);
  assert.match(contract.rules.order, /order of targetKeys/);
  assert.match(contract.rules.disabled, /move-all skips it/);
  assert.match(contract.rules.moveAll, /visible enabled/);
  assert.match(contract.rules.selectAll, /reason select/);
  assert.match(contract.rules.search, /createFilter/);
  assert.match(contract.rules.focus, /other pane's listbox/);
  assert.match(contract.rules.drag, /@slotted\/core\/drag/);
  assert.match(contract.rules.drag, /within the source every position is refused/);
  assert.match(contract.rules.steps, /36rem/);
  assert.match(contract.rules.readOnly, /aria-disabled/);
  assert.match(contract.rules.reorder, /target query/);
  assert.match(contract.itemAttributes.where, /indicator/);
  assert.equal(contract.itemAttributes.unresolved, 'data-unresolved');
});

test('offers the layout, search, select-all and order axes with their defaults', () => {
  assert.deepEqual(contract.axes.layout, ['auto', 'columns', 'steps']);
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.equal(member.defaults.layout, 'auto');
  assert.equal(member.defaults.searchable, true);
  assert.equal(member.defaults.selectAll, true);
  assert.equal(member.defaults.reorderable, false);
  assert.equal(member.defaults.rows, 8);
  assert.equal(member.defaults.pane, 'source');
  assert.deepEqual(contract.provides.transferDefaults, [
    'size',
    'layout',
    'searchable',
    'selectAll',
    'reorderable',
    'rows',
  ]);
});

test('paints a drag in the shared drag vocabulary', () => {
  assert.equal(contract.stateAttributes.dragging, 'data-dragging');
  assert.equal(contract.stateAttributes['drop-target'], 'data-drop-target');
  assert.ok(member.states.includes('dragging'));
  assert.ok(member.states.includes('drop-target'));
  assert.ok(member.parts.includes('drop-indicator'));
});

/**
 * The APG example's keys, the two Kendo and Salesforce add, and the listbox
 * family's own keyboard left standing inside each pane.
 */
test('declares the keyboard of §4.1', () => {
  const keys = contract.keyboard.map((entry) => entry.key);
  for (const key of [
    'Tab',
    'Enter',
    'Delete / Backspace',
    'Control+ArrowRight / Meta+ArrowRight',
    'Control+ArrowLeft / Meta+ArrowLeft',
    'Alt+ArrowUp / Alt+ArrowDown',
    'Escape',
  ]) {
    assert.ok(keys.includes(key), `no ${key}`);
  }
  assert.match(contract.keyboard[1].effect, /listbox family's own keyboard/);
  assert.match(contract.departures.Enter.cost, /Space/);
  assert.match(contract.wiring['aria-keyshortcuts'], /Alt\+ArrowUp/);
});

test('carries every message the design names', () => {
  assert.deepEqual([...contract.messages].sort(), [
    'actions',
    'count',
    'countFiltered',
    'countSelected',
    'empty',
    'loading',
    'moveAllToSource',
    'moveAllToTarget',
    'moveDown',
    'moveToSource',
    'moveToTarget',
    'moveUp',
    'moved',
    'movedOne',
    'noResults',
    'paneCount',
    'panes',
    'reorder',
    'reordered',
    'search',
    'selectAll',
    'source',
    'target',
  ]);
});

test('names the family that owns each declined capability', () => {
  assert.equal(contract.declined.tree.deferTo, 'hierarchical-picker');
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok('deferTo' in entry || 'composition' in entry, `${name} names neither`);
  }
});

test('declares a demonstration for every capability the design asks to show', () => {
  assert.deepEqual(contract.scenarios.transfer, [
    'playground',
    'selection',
    'search',
    'order',
    'drag',
    'steps',
    'states',
    'virtualization',
    'loading',
    'content',
    'forms',
    'labels',
    'keyboard',
    'accessibility',
  ]);
});

test('records why its component token states a literal', () => {
  assert.equal(contract.literals['--slotted-transfer-pane-min-inline-size'].value, '13rem');
});
