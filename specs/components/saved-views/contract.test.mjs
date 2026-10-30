import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.savedViews;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'saved-views');
  assert.equal(contract.ui, 'saved-views');
  assert.equal(contract.schemaVersion, 5);
  assert.equal(member.nativeElement, 'div');
  assert.match(contract.roles.root, /group/);
});

/** The anatomy of the design, §4.2, part for part. */
test('declares the thirteen parts of the design', () => {
  assert.deepEqual(member.parts, [
    'root',
    'trigger',
    'modified',
    'revert',
    'panel',
    'list',
    'item',
    'apply',
    'default-mark',
    'actions',
    'form',
    'footer',
    'confirm',
  ]);
  for (const part of member.parts) {
    assert.ok(typeof contract.anatomy[part] === 'string', `anatomy ${part}`);
  }
});

/**
 * Two values move: the list of views with the one in use and the default,
 * and whether the layer is open. The first request carries what the reader
 * did as `action`, because one state object answers seven different presses.
 */
test('holds the views and the layer as two state models', () => {
  assert.ok(MUTABLE_CAPABILITIES.includes('views'));
  assert.deepEqual(contract.stateModel.views, {
    controlled: 'state',
    uncontrolled: 'defaultState',
    request: 'onStateChange',
    reasons: ['pointer', 'keyboard', 'submit', 'remove', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'escape', 'outsidePress', 'dismiss', 'programmatic'],
  });
  assert.deepEqual(contract.actions, [
    'apply',
    'save',
    'create',
    'rename',
    'delete',
    'default',
    'revert',
  ]);
  assert.match(contract.requests.onViewApply.from, /apply/);
  assert.match(contract.requests.onViewApply.from, /revert/);
  assert.match(contract.requests.onViewApply.payload, /parseGridView/);
});

test('marks a view that differs from the one in use, and offers to revert it', () => {
  assert.equal(
    contract.attributes['data-modified'],
    'on the root while current differs from the active view',
  );
  assert.match(contract.anatomy.revert, /only with data-modified/);
  assert.match(contract.rules.modified, /sameGridView/);
});

/** The built-in view is the application's defaults: never renamed, overwritten or deleted. */
test('keeps the built-in view first and read-only', () => {
  assert.match(contract.rules.builtIn, /first/);
  assert.match(contract.rules.builtIn, /Set as default/);
  assert.match(contract.rules.save, /disabled on the built-in view/);
  assert.match(contract.rules.save, /not modified/);
});

test('rejects an empty and a duplicate name in the form', () => {
  assert.match(contract.rules.name, /empty/);
  assert.match(contract.rules.name, /isViewNameTaken/);
  assert.match(contract.rules.name, /invalid/);
});

/** The dismissable-layer rule of the briefing: Escape cancels the form before the layer. */
test('refuses the close request while a form is open', () => {
  const escape = contract.keyboard.find((entry) => entry.key === 'Escape');
  assert.match(escape.effect, /cancels the form/);
  assert.match(escape.effect, /refuses/);
});

test('announces each outcome through the live announcer', () => {
  assert.ok(member.capabilities.includes('live'));
  for (const key of ['applied', 'saved', 'deleted']) {
    assert.ok(contract.messages.includes(key), key);
  }
});

test('declares a scenario per question a reader of the page has', () => {
  assert.deepEqual(contract.scenarios.savedViews, [
    'playground',
    'modified-and-revert',
    'save-as',
    'rename',
    'delete',
    'default-view',
    'built-in',
    'persistence',
    'with-data-grid',
    'keyboard',
    'accessibility',
    'long-names',
  ]);
});

test('composes the families it renders and owns none of their behavior', () => {
  assert.deepEqual(contract.composes, ['popover', 'menu', 'button', 'field', 'text-field']);
  assert.match(contract.engine, /@slotted\/core\/grid/);
});
