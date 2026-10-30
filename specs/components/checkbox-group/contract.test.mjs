import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const checkbox = JSON.parse(
  await readFile(new URL('../checkbox/contract.json', import.meta.url), 'utf8'),
);
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);
const fieldGroup = JSON.parse(
  await readFile(new URL('../field-group/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.checkboxGroup;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'checkbox-group');
  assert.equal(contract.ui, 'checkbox-group');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The group holds the array; the item is the family beside it. It is the split
 * `avatar` / `avatar-group`, `button` / `button-group` and `field` /
 * `field-group` already made, and the one the schema forces: one `data-ui` per
 * family, and every member's root part carrying it.
 */
test('holds the array and leaves the control to the family beside it', () => {
  assert.equal(contract.itemFamily, checkbox.family);
  assert.deepEqual(member.parts, ['root']);
  assert.equal(member.nativeElement, 'div');
  assert.ok(member.capabilities.includes('selection'));
  assert.ok(MUTABLE_CAPABILITIES.includes('selection'));
  assert.deepEqual(contract.stateModel.selection, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['pointer', 'keyboard'],
  });
});

/**
 * The parent is derived, never entered. It is checked when the whole set is,
 * indeterminate between, and its request replaces the selection rather than
 * toggling one item — which is what the APG mixed-state example does and what
 * Base UI's `parent` and `allValues` ship.
 */
test('derives the parent checkbox from the set it commands', () => {
  assert.equal(contract.parent.derivedFrom, 'allValues');
  assert.match(contract.parent.checkedWhen, /every value/);
  assert.match(contract.parent.indeterminateWhen, /some but not every/);
  assert.equal(contract.parent.requestReplaces, 'the whole selection');
  assert.ok(checkbox.members.checkbox.states.includes('indeterminate'));
  assert.equal(checkbox.members.checkbox.defaults.parent, false);
});

/**
 * The differentiator: the number selected reaches the field's label row through
 * the channel `text-field` opened for characters. Nothing surveyed publishes a
 * selection count anywhere a reader already looks.
 */
test('publishes how many are selected where the field already draws a count', () => {
  assert.equal(contract.counter.unit, 'items');
  assert.equal(contract.counter.placedBy, 'field');
  assert.equal(contract.counter.limitFrom, 'allValues');
  assert.ok(field.members.field.parts.includes('counter'), 'the field draws no counter');
  assert.equal(member.defaults.showCount, false);
});

test('owns the group role only where nothing else grouped it', () => {
  assert.equal(contract.rootRole, 'group');
  assert.equal(contract.roleWithdrawnInside, fieldGroup.family);
});

test('binds no key of its own, because every item is its own tab stop', () => {
  assert.deepEqual(contract.keyboard, []);
  assert.equal(contract.escapeBound, false);
});

test('reads the field for state and never takes its identifier', () => {
  assert.equal(contract.stateSource, field.family);
  assert.equal(contract.wiring.id, 'never');
  assert.match(contract.wiring['aria-labelledby'], /field's label/);
  assert.equal(contract.readOnlyAttribute, 'aria-readonly');
  assert.deepEqual(Object.keys(contract.stateAttributes), ['disabled', 'invalid', 'readonly']);
});

test('resolves its axes in one stated order', () => {
  assert.deepEqual(contract.axes.orientation, ['vertical', 'horizontal']);
  assert.deepEqual(contract.resolution.size, ['prop', 'field', 'defaults', 'md']);
});

test('hands its items what a group decides once', () => {
  assert.deepEqual(contract.provides.checkboxGroupDefaults, [
    'size',
    'variant',
    'orientation',
    'labelPlacement',
  ]);
  assert.deepEqual(contract.provides.toItems, [
    'size',
    'variant',
    'labelPlacement',
    'disabled',
    'readOnly',
    'invalid',
    'name',
  ]);
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.checkboxGroup, [
    'playground',
    'orientation',
    'tile',
    'parent',
    'states',
    'count',
    'field',
    'content',
    'composition',
    'keyboard',
  ]);
});

/**
 * The group hands the variant down for the reason it hands `size` down: a set
 * of tiles with one plain box among them is a set nobody meant to write.
 */
test('hands the framed presentation to every choice it holds', () => {
  assert.deepEqual(contract.axes.variant, ['plain', 'tile']);
  assert.deepEqual(contract.resolution.variant, ['prop', 'defaults', 'plain']);
  assert.equal(member.defaults.variant, 'plain');
  assert.ok(contract.provides.toItems.includes('variant'));
});

/**
 * Columns are declined, and the family that owns them is named: `grid` already
 * ships `columns`, `minItemWidth` and a stretching alignment, so a set of
 * equal-width tiles is a `grid` around the items and nothing else. Two
 * families laying out one row would be two answers to one question.
 */
test('declines a column axis and names the family that owns arrangement', () => {
  assert.ok(!('columns' in contract.axes));
  assert.equal(contract.declined.columns.deferTo, 'grid');
});
