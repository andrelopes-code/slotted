import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const textField = JSON.parse(
  await readFile(new URL('../text-field/contract.json', import.meta.url), 'utf8'),
);
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.textarea;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'textarea');
  assert.equal(contract.ui, 'textarea');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One element and one part. Nothing surveyed puts an adornment inside a
 * textarea — the corner is where the resize handle goes — so the multi-line
 * control keeps the simplest anatomy that works instead of copying
 * `text-field`'s frame for symmetry.
 */
test('is the control itself, with no frame around it', () => {
  assert.deepEqual(Object.keys(contract.members), ['textarea']);
  assert.deepEqual(member.parts, ['root']);
  assert.equal(member.nativeElement, 'textarea');
  assert.equal(contract.controlPart, 'root');
});

/** The same value contract as the single-line control, minus the clear button. */
test('declares the same state model as the single-line control', () => {
  assert.ok(member.capabilities.includes('value'));
  assert.ok(MUTABLE_CAPABILITIES.includes('value'));
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['keyboard'],
  });
  assert.equal(textField.stateModel.value.controlled, contract.stateModel.value.controlled);
  assert.equal(textField.stateModel.value.request, contract.stateModel.value.request);
});

test('takes its identity and its state from the field around it', () => {
  assert.equal(contract.stateSource, 'field');
  assert.equal(contract.requiredAttribute, 'aria-required');
  assert.equal(contract.disabledAttribute, 'disabled');
  assert.deepEqual(contract.wiring, field.wiring);
});

test('mirrors onto itself exactly the states it paints', () => {
  assert.equal(contract.mirrorsState, true);
  assert.deepEqual(Object.keys(contract.stateAttributes), ['disabled', 'invalid', 'readonly']);
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'focus-visible',
    'disabled',
    'invalid',
    'readonly',
  ]);
});

/**
 * The platform grows the control. `field-sizing: content` shrinkwraps, so
 * `rows` stops being the floor and the family restates it as a minimum block
 * size in `lh` units; `maxRows` is the ceiling, after which the control
 * scrolls rather than pushing the page.
 */
test('grows with its content through the platform, with a floor and a ceiling', () => {
  assert.equal(contract.autoSizeMechanism, 'field-sizing');
  assert.equal(contract.autoSizeFloor, 'rows');
  assert.equal(contract.autoSizeCeiling, 'maxRows');
  assert.equal(member.defaults.autoSize, false);
  assert.equal(member.defaults.rows, 3);
  /* The ceiling has a default and cannot be removed: a control that grows
     forever pushes the page out from under the caret, which is the defect
     every auto-grow implementation ships first. */
  assert.equal(member.defaults.maxRows, 12);
});

/**
 * A control that sizes itself and a handle that fixes its size disagree on the
 * next keystroke, so the handle is withdrawn while `autoSize` is on.
 */
test('withdraws the resize handle from a control that sizes itself', () => {
  assert.deepEqual(contract.axes.resize, ['block', 'none', 'both']);
  assert.equal(member.defaults.resize, 'block');
  assert.equal(contract.resizeWithdrawnBy, 'autoSize');
});

test('counts in the units the platform enforces and lets the field place them', () => {
  assert.deepEqual(contract.counter, textField.counter);
});

/**
 * Enter makes a line and never submits, which is the difference WAI-ARIA notes
 * between a single-line and a multi-line text control, and which
 * `docs/component-features.md` §6 states as a requirement. Tab leaves the
 * control rather than inserting a tab.
 */
test('binds no key of its own and lets Enter make a line', () => {
  assert.deepEqual(contract.keyboard, []);
  assert.equal(contract.submitsOnEnter, false);
});

test('resolves its axes in one stated order', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.deepEqual(contract.axes.variant, ['outline', 'subtle', 'plain']);
  assert.deepEqual(contract.resolution.size, ['prop', 'field', 'defaults', 'md']);
});

test('lets an application decide once what its textareas look like', () => {
  assert.deepEqual(contract.provides.textareaDefaults, ['size', 'variant', 'mono', 'resize']);
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.textarea, [
    'playground',
    'sizes',
    'variants',
    'auto-size',
    'resize',
    'states',
    'count',
    'content',
    'composition',
    'keyboard',
  ]);
});
