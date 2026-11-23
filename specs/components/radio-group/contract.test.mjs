import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);
const fieldGroup = JSON.parse(
  await readFile(new URL('../field-group/contract.json', import.meta.url), 'utf8'),
);
const checkbox = JSON.parse(
  await readFile(new URL('../checkbox/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.radioGroup;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'radio-group');
  assert.equal(contract.ui, 'radio-group');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * A radio is a part and not a family. Outside a group it is not a control
 * anybody can use: it has no exclusive set to belong to, and the platform's
 * whole keyboard model is defined over the set.
 */
test('holds its items as a part rather than as a second family', () => {
  assert.equal(contract.itemPart, 'item');
  assert.deepEqual(member.parts, ['root', 'item', 'label', 'control', 'indicator', 'description']);
  assert.equal(member.nativeElement, 'div');
  assert.equal(contract.controlPart, 'control');
});

/**
 * The same decision `checkbox` records, and the reason the two families share
 * one design document: the mark is a sibling of the input, because Firefox
 * renders no pseudo-element on an `input` and a mask on the input would clip
 * the box away with it.
 */
test('draws the dot on a sibling of the control, as checkbox draws the check', () => {
  assert.equal(contract.indicator.drawnOn, checkbox.indicator.drawnOn);
  assert.equal(contract.indicator.part, checkbox.indicator.part);
  assert.equal(contract.indicator.checked, '--slotted-icon-dot');
  assert.equal(contract.labelAssociation, checkbox.labelAssociation);
  assert.equal(contract.generatesControlId, checkbox.generatesControlId);
});

/**
 * The entire APG keyboard table, from the platform. Native radios sharing a
 * `name` implement Tab-into-the-checked-item, Space, both arrow axes, wrapping
 * and the skipping of disabled items — including the arrow directions of a
 * right-to-left document, which a roving `tabindex` written twice would have to
 * relearn twice.
 */
test('takes the whole keyboard model from the platform, by grouping on name', () => {
  assert.equal(contract.grouping, 'name');
  assert.equal(contract.rovingFocus, 'platform');
  assert.equal(contract.generatesName, true);
  assert.deepEqual(
    contract.keyboard.map((entry) => entry.key),
    ['Tab', 'Space', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'],
  );
  assert.ok(contract.keyboard.every((entry) => entry.source === 'platform'));
  assert.ok(contract.keyboard.every((entry) => entry.focus.length > 0));
  assert.equal(contract.escapeBound, false);
});

/** The APG's answer for an empty group, unmodified. */
test('lands focus on the first item when nothing is checked', () => {
  const tab = contract.keyboard.find((entry) => entry.key === 'Tab');
  assert.match(tab.focus, /first item when none is checked/);
});

test('declares a state model for the one value it holds', () => {
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
 * A `field-group` is a `fieldset` with a `legend`, which is already a named
 * group. A `radiogroup` inside it, named by the same legend, is the same group
 * announced twice, so the role is withdrawn where the legend already grouped.
 */
test('owns the radiogroup role only where nothing else grouped it', () => {
  assert.equal(contract.rootRole, 'radiogroup');
  assert.equal(contract.roleWithdrawnInside, fieldGroup.family);
  assert.equal(fieldGroup.members.fieldGroup.nativeElement, 'fieldset');
  assert.ok(fieldGroup.members.fieldGroup.parts.includes('legend'));
});

test('reads the field for state and never takes its identifier', () => {
  assert.equal(contract.stateSource, field.family);
  assert.equal(contract.wiring.id, 'never');
  assert.match(contract.wiring['aria-labelledby'], /field's label/);
  assert.equal(contract.requiredAttribute, 'aria-required');
  assert.equal(contract.disabledAttribute, 'disabled');
  assert.equal(contract.readOnlyAttribute, 'aria-readonly');
});

test('mirrors exactly the states its stylesheet paints', () => {
  assert.equal(contract.mirrorsState, true);
  assert.deepEqual(Object.keys(contract.stateAttributes), [
    'checked',
    'disabled',
    'invalid',
    'readonly',
  ]);
  assert.ok(!member.states.includes('indeterminate'), 'a radio has no third state');
});

test('resolves its axes in one stated order', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.deepEqual(contract.axes.orientation, ['vertical', 'horizontal']);
  assert.deepEqual(contract.axes.labelPlacement, ['end', 'start']);
  assert.deepEqual(contract.resolution.orientation, ['prop', 'defaults', 'vertical']);
});

test('hands its items what a group decides once', () => {
  assert.deepEqual(contract.provides.radioGroupDefaults, [
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
  assert.deepEqual(contract.scenarios.radioGroup, [
    'playground',
    'orientation',
    'tile',
    'sizes',
    'states',
    'placement',
    'description',
    'field',
    'content',
    'composition',
    'keyboard',
  ]);
});

/**
 * The framed choice is the item's, not the root's: the root arranges, the item
 * is the surface a reader clicks. A plan picker — the case Cloudscape built a
 * whole `Tiles` family for — is an exclusive set, so declining this here while
 * shipping it on `checkbox` would be half a capability.
 */
test('draws each item as a framed surface without leaving the family', () => {
  assert.deepEqual(contract.axes.variant, ['plain', 'tile']);
  assert.deepEqual(contract.resolution.variant, ['prop', 'defaults', 'plain']);
  assert.equal(member.defaults.variant, 'plain');
  assert.ok(contract.provides.toItems.includes('variant'));
});

/**
 * Columns are declined, and `grid` is named: it already ships `columns`,
 * `minItemWidth` and a stretching alignment.
 */
test('declines a column axis and names the family that owns arrangement', () => {
  assert.ok(!('columns' in contract.axes));
  assert.equal(contract.declined.columns.deferTo, 'grid');
});
