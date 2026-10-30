import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const radioGroup = JSON.parse(
  await readFile(new URL('../radio-group/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.segmentedControl;
const keyboard = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'segmented-control');
  assert.equal(contract.ui, 'segmented-control');
  assert.equal(contract.schemaVersion, 5);
});

test('cites the pattern it implements rather than claiming to have checked it', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/');
});

/**
 * The decision the whole pair rests on. A segment is a real radio, so the
 * platform supplies the keyboard, the submitted value and the position a screen
 * reader announces. Angular Material's shape — `radiogroup` around buttons
 * carrying `aria-pressed` — is a group whose role and children disagree, and
 * Primer's — a list of buttons with inert arrows — costs one tab stop per
 * segment where the pattern gives one for the set.
 */
test('is a radio group in the DOM and not a group of buttons', () => {
  assert.equal(contract.roles.root, 'radiogroup');
  assert.equal(contract.roles.control, 'radio');
  assert.equal(contract.controlElement, 'input[type=radio]');
  assert.equal(contract.controlSubstitutable, false);
  assert.ok(member.parts.includes('control'));
});

test('takes the whole keyboard from the platform, as radio-group does', () => {
  assert.equal(contract.rovingFocus, 'platform');
  assert.equal(contract.rovingFocus, radioGroup.rovingFocus);
  assert.equal(contract.grouping, 'name');
  assert.deepEqual(
    contract.keyboard.map((entry) => entry.key),
    ['Tab', 'Space', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'],
  );
  for (const entry of contract.keyboard) {
    assert.equal(entry.source, 'platform', `${entry.key} is not the platform's`);
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
  }
  assert.match(keyboard('Tab').focus, /checked segment/);
});

/** A `fieldset` with a `legend` is already a named group, so a `radiogroup`
    inside one is the same group announced twice. `radio-group` decided it. */
test('withdraws its role where something else has already grouped the set', () => {
  assert.equal(contract.roleWithdrawnInside, 'field-group');
  assert.equal(contract.roleWithdrawnInside, radioGroup.roleWithdrawnInside);
});

test('declares a state model for the one value a consumer can own', () => {
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
 * The thumb's place is the checked index rather than a measurement, which is
 * what makes the first server-rendered paint correct. A contract that let it be
 * measured would let a later pass reintroduce the defect every surveyed
 * implementation has.
 */
test('places the thumb by arithmetic and never by measuring the layout', () => {
  assert.equal(contract.indicator.placed, 'arithmetic');
  assert.equal(contract.indicator.measured, false);
  assert.deepEqual(contract.indicator.customProperties, [
    '--slotted-segmented-control-count',
    '--slotted-segmented-control-index',
  ]);
  assert.equal(contract.indicator.absentWhen, 'no segment is checked');
  for (const property of contract.indicator.customProperties) {
    assert.match(property, /^--slotted-segmented-control-/);
  }
});

/**
 * A container query is about the control's own width, and its breakpoints are
 * literal because CSS refuses a custom property in a container condition.
 *
 * The container is declared on one shape rather than on every root: an element
 * that contains its own inline axis is sized as though it had no contents, and
 * a control that shrinks to its labels then shrinks to nothing. The shape that
 * condenses takes its parent's width, which is the only width there is to ask
 * a question about.
 */
test('answers its own inline size rather than the viewport', () => {
  assert.equal(contract.container.type, 'inline-size');
  assert.equal(contract.container.name, 'slotted-segmented-control');
  assert.equal(contract.container.axis, 'condense');
  assert.ok(contract.axes.condense.includes(contract.container.value));
  assert.equal(contract.container.fillsItsParent, true);
  assert.match(contract.container.declaredOn, /data-condense/);
  assert.ok(contract.container.shapeReason.length > 0);
});

/**
 * The control is put in forms beside a text field and a select, so its height
 * is the control height and everything inside it is measured back from that.
 * A family that added its padding to that height would stand two or six pixels
 * prouder than every other control on the row.
 */
test('is exactly as tall as a control, and keeps the target at that height', () => {
  assert.equal(contract.height.root, '--slotted-control-height-*');
  assert.match(contract.height.segment, /less the track/);
  assert.match(contract.height.target, /track's own edge/);
  assert.ok(contract.height.reason.length > 0);
});

/** Segments stand apart by the ring's own step, with a rule in the middle of the gap. */
test('spaces its segments apart and rules the middle of each gap', () => {
  assert.match(contract.spacing.between, /--slotted-segmented-control-gap/);
  assert.ok(contract.spacing.reason.length > 0);
  assert.match(contract.divider.drawnOn, /middle of the gap/);
  assert.match(contract.divider.givesWayTo, /checked segment/);
  assert.match(contract.divider.givesWayTo, /under the pointer/);
  assert.ok(contract.divider.reason.length > 0);
});

/**
 * A thing that travels needs longer than a thing that changes color, and the
 * thumb's movement is the one motion this family owns.
 */
test('moves the thumb a step slower than it changes a color', () => {
  assert.equal(contract.motion.thumb, '--slotted-duration-medium');
  assert.equal(contract.motion.color, '--slotted-control-transition-duration');
  assert.equal(contract.motion.easing, '--slotted-easing-standard');
  assert.ok(contract.motion.reason.length > 0);
});

test('reads its form state from the field, as every control in a form does', () => {
  assert.equal(contract.stateSource, 'field');
  assert.equal(contract.stateSource, radioGroup.stateSource);
  for (const capability of ['invalid', 'required', 'readOnly']) {
    assert.ok(member.capabilities.includes(capability), `does not hold ${capability}`);
  }
  assert.equal(contract.readOnlyAttribute, 'aria-readonly');
  assert.equal(contract.requiredAttribute, 'aria-required');
});

test('keeps every declined capability answered by a family or by a written reason', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} declines with no reason`);
  }
  assert.equal(contract.declined.multiple.deferTo, 'toggle-group');
  assert.equal(contract.declined.links.deferTo, 'tabs');
  assert.equal(contract.declined.panels.deferTo, 'tabs');
});

test('declares the parts the anatomy names, root first', () => {
  assert.deepEqual(member.parts, ['root', 'indicator', 'item', 'control', 'icon', 'label']);
});

test('names a scenario for every axis, every state and the keyboard', () => {
  const scenarios = contract.scenarios.segmentedControl;
  for (const axis of Object.keys(contract.axes)) {
    assert.ok(
      scenarios.some((id) => id.toLowerCase().includes(axis.slice(0, 4).toLowerCase())),
      `no scenario demonstrates ${axis}`,
    );
  }
  for (const id of ['states', 'keyboard', 'composition', 'content', 'field', 'form']) {
    assert.ok(scenarios.includes(id), `no ${id} scenario`);
  }
});
