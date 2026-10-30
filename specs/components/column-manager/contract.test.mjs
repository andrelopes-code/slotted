import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.columnManager;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'column-manager');
  assert.equal(contract.ui, 'column-manager');
  assert.equal(contract.schemaVersion, 5);
  assert.deepEqual(Object.keys(contract.members), ['columnManager']);
  assert.equal(member.nativeElement, 'div');
  assert.match(contract.rootRole, /group/);
});

/**
 * The design's anatomy, §3.2, part for part. `summary` is the one the design
 * did not name: the visible "7 of 9 shown" beside the title needs a selector
 * of its own. The search field's glyph is an `icon` in the text field's start
 * slot, as `filter-bar` draws it, and no part of this family's.
 */
test('declares every part of the anatomy', () => {
  assert.deepEqual(member.parts, [
    'root',
    'header',
    'title',
    'summary',
    'search',
    'list',
    'section',
    'section-label',
    'item',
    'handle',
    'visibility',
    'description',
    'status',
    'pin',
    'drop-indicator',
    'empty',
    'footer',
    'show-all',
    'reset',
    'cancel',
    'apply',
    'trigger',
    'count',
  ]);
  for (const part of member.parts) {
    assert.ok(typeof contract.anatomy[part] === 'string', `${part} is not described`);
  }
});

/**
 * One value edited, one value opened. The column request is `data-grid`'s
 * with `changes` beside `change`; `clear` is Restore defaults and `submit` is
 * Apply under `apply="confirm"`.
 */
test('models the column state and the layer, each with its reasons', () => {
  assert.deepEqual(contract.stateModel.columns, {
    controlled: 'columnState',
    uncontrolled: 'defaultColumnState',
    request: 'onColumnStateChange',
    reasons: ['pointer', 'keyboard', 'clear', 'submit', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'escape', 'outsidePress', 'back', 'programmatic'],
  });
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason), reason);
  }
  assert.match(contract.request.change, /changes\[0\]/);
  assert.match(contract.request.changes, /columnStateChanges/);
  assert.match(contract.request.reset, /defaultColumnState/);
  assert.match(contract.request.reset, /clear/);
});

test('offers three presentations and two apply policies, with their defaults', () => {
  assert.deepEqual(contract.axes.presentation, ['popover', 'drawer', 'inline']);
  assert.deepEqual(contract.axes.apply, ['live', 'confirm']);
  assert.deepEqual(member.defaults, { presentation: 'popover', apply: 'live', open: false });
  assert.deepEqual(contract.provides.columnManagerDefaults, ['presentation', 'apply']);
  assert.match(contract.composes.join(' '), /popover/);
  assert.match(contract.composes.join(' '), /drawer/);
});

/**
 * The rules of §3.3, each stated where a test can find it: the manager never
 * asks for a state with no visible column, a required column keeps its box
 * ticked, search reads label and description without case or accents and
 * turns reordering off, and a move never leaves its zone.
 */
test('states the rules that decide what a control may do', () => {
  assert.match(contract.rules.locked, /hideable: false/);
  assert.match(contract.rules.lastVisible, /disabled/);
  assert.match(contract.rules.hiddenBySpace, /status/);
  assert.match(contract.rules.hiddenBySpace, /outOfSpace\.hidden/);
  assert.match(contract.rules.inRow, /outOfSpace\.popin/);
  assert.match(contract.rules.inRow, /messages\.inRow/);
  assert.match(contract.rules.search, /NFD/);
  assert.match(contract.rules.search, /description/);
  assert.match(contract.rules.search, /handle/);
  assert.match(contract.rules.reorder, /withColumnMoved/);
  assert.match(contract.rules.reorder, /@slotted\/core\/drag/);
  assert.match(contract.rules.confirm, /submit/);
  assert.match(contract.rules.confirm, /discard/);
  assert.equal(contract.itemAttributes.hidden, 'data-hidden');
  assert.equal(contract.itemAttributes.locked, 'data-locked');
  assert.equal(contract.itemAttributes.spaceHidden, 'data-space-hidden');
  assert.equal(contract.itemAttributes.pinned, 'data-pinned');
});

test('paints a drag in the shared drag vocabulary', () => {
  assert.equal(contract.stateAttributes.dragging, 'data-dragging');
  assert.equal(contract.stateAttributes['drop-target'], 'data-drop-target');
  assert.ok(member.states.includes('dragging'));
  assert.ok(member.states.includes('drop-target'));
  assert.ok(member.parts.includes('drop-indicator'));
});

test('carries every message the design names', () => {
  assert.deepEqual([...contract.messages].sort(), [
    'apply',
    'cancel',
    'hiddenBySpace',
    'hiddenCount',
    'inRow',
    'moved',
    'noResults',
    'pin',
    'pinEnd',
    'pinStart',
    'pinnedEnd',
    'pinnedStart',
    'reorder',
    'required',
    'reset',
    'search',
    'showAll',
    'title',
    'unpin',
    'unpinned',
    'visibleCount',
  ]);
});

test('declares the keyboard of §3.7, native order and all', () => {
  const keys = contract.keyboard.map((entry) => entry.key);
  for (const key of ['Tab', 'Space', 'Alt+ArrowUp / Alt+ArrowDown', 'Escape', 'Enter / Space']) {
    assert.ok(keys.includes(key), `no ${key}`);
  }
  const move = contract.keyboard.find((entry) => entry.key === 'Alt+ArrowUp / Alt+ArrowDown');
  assert.match(move.focus, /handle/);
  assert.match(contract.declined.gridRole.reason, /native/);
});

test('declares a demonstration for every capability the design asks to show', () => {
  assert.deepEqual(contract.scenarios.columnManager, [
    'playground',
    'popover',
    'drawer',
    'confirm',
    'search',
    'locked',
    'hidden-by-space',
    'reorder',
    'pinning',
    'reset-and-show-all',
    'trigger-count',
    'with-data-grid',
    'keyboard',
    'accessibility',
  ]);
});

test('records why its two component tokens state a literal', () => {
  assert.equal(contract.literals['--slotted-column-manager-inline-size'].value, '22rem');
  assert.equal(
    contract.literals['--slotted-column-manager-list-max-block-size'].value,
    'min(60vh, 28rem)',
  );
});
