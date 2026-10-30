import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS, STATE_ATTRIBUTES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members['dashboard-grid'];

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'dashboard-grid');
  assert.equal(contract.ui, 'dashboard-grid');
  assert.equal(contract.schemaVersion, 5);
  assert.deepEqual(Object.keys(contract.members), ['dashboard-grid']);
  assert.equal(member.nativeElement, 'div');
});

/**
 * The design's anatomy, §3.5 and §4. A widget is a card, so the card's own
 * header, actions and body are that family's parts and not this one's; what
 * this family adds is the list, the edit chrome and the states of the body.
 */
test('declares every part of the anatomy', () => {
  assert.deepEqual(member.parts, [
    'root',
    'edit-bar',
    'edit-status',
    'edit-actions',
    'add',
    'reset',
    'cancel',
    'done',
    'grid',
    'widget',
    'title',
    'description',
    'detail',
    'handle',
    'skeleton',
    'message',
    'retry',
    'busy-indicator',
    'resize-handle',
    'size-readout',
    'placeholder',
    'empty',
  ]);
  for (const part of member.parts) {
    assert.ok(typeof contract.anatomy[part] === 'string', `${part} is not described`);
  }
  assert.deepEqual(contract.composes, ['card', 'button', 'menu', 'result-state', 'skeleton']);
});

/**
 * Two values move: the layout, which a store restores, and the mode that
 * edits it, which the product's own button enters. Both are the consumer's to
 * own, and each request says why.
 */
test('models the layout and the edit mode with their reasons', () => {
  assert.deepEqual(contract.stateModel.layout, {
    controlled: 'layout',
    uncontrolled: 'defaultLayout',
    request: 'onLayoutChange',
    reasons: ['pointer', 'keyboard', 'remove', 'dismiss', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.editing, {
    controlled: 'editing',
    uncontrolled: 'defaultEditing',
    request: 'onEditingChange',
    reasons: ['pointer', 'keyboard', 'submit', 'dismiss', 'programmatic'],
  });
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason));
  }
  assert.match(contract.request.layout, /move \| resize \| hide \| show \| reset \| cancel/);
  assert.match(contract.request.layout, /one request per gesture, at its end/);
  assert.match(contract.request.layout, /\{ key, x, y, w, h, hidden\? \}/);
});

test('paints the edit mode, the move and the wait from the shared vocabulary', () => {
  assert.equal(contract.stateAttributes.editing, STATE_ATTRIBUTES.editing);
  assert.equal(contract.stateAttributes.dragging, STATE_ATTRIBUTES.dragging);
  assert.equal(contract.stateAttributes.loading, STATE_ATTRIBUTES.loading);
  assert.match(contract.itemAttributes.resizing, /^data-resizing/);
  assert.deepEqual(contract.axes.status, ['ready', 'empty', 'error']);
});

/**
 * A widget stands at a cell, the grid has gravity, and the DOM holds the
 * widgets by row and then column, so the reading order is the picture's.
 */
test('places widgets at cells and keeps the reading order the picture', () => {
  assert.match(contract.rules.model, /gravity/);
  assert.match(contract.rules.model, /by row, then column/);
  assert.ok('topEdge' in contract.declined);
  assert.match(contract.rules.sizeClass, /1024px/);
  assert.match(contract.rules.sizeClass, /600px/);
});

/**
 * Every keyboard path the design lists, with its focus destination: the
 * APG's Alt+Arrow and Delete, the handle's menu, and the resize on Shift.
 */
test('declares the handle keyboard with the focus after each key', () => {
  const keys = contract.keyboard.map((row) => row.key);
  for (const key of [
    'Enter / Space / ArrowDown',
    'Alt+ArrowLeft / Alt+ArrowRight',
    'Alt+ArrowUp / Alt+ArrowDown',
    'Shift+ArrowRight / Shift+ArrowLeft',
    'Shift+ArrowDown / Shift+ArrowUp',
    'Delete',
    'Escape',
  ]) {
    assert.ok(keys.includes(key), `${key} is not declared`);
  }
  for (const row of contract.keyboard) {
    assert.ok(row.focus.length > 0, `${row.key} names no focus destination`);
  }
  assert.match(contract.wiring['aria-keyshortcuts (handle)'], /Alt\+ArrowUp/);
});

test('keeps editing on Escape and says what it costs', () => {
  assert.match(contract.rules.editing, /Escape outside a gesture does nothing/);
  assert.ok(contract.departures.escapeKeepsEditing.cost.length > 0);
});

test('declares a demonstration per scenario', () => {
  assert.deepEqual(contract.scenarios['dashboard-grid'], [
    'playground',
    'anatomy',
    'editing',
    'keyboard',
    'constraints',
    'states',
    'responsive',
    'persistence',
    'labels',
    'accessibility',
  ]);
});
