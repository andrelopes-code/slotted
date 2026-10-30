import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.switch;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'switch');
  assert.equal(contract.ui, 'switch');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * The family that shipped before this one was a `button` with `role="switch"`
 * and no form value at all. Six of the ten surveyed implementations build on
 * the native checkbox, and the four that build on a button pay for it: Radix
 * renders a hidden input beside its button so a form can see the value, and
 * Primer's button carries `aria-pressed` and submits nothing.
 */
test('builds the control on the element the platform ships for a binary value', () => {
  assert.deepEqual(Object.keys(contract.members), ['switch']);
  assert.equal(member.nativeElement, 'input');
  assert.equal(contract.controlPart, 'control');
  assert.equal(contract.controlType, 'checkbox');
  assert.equal(contract.controlRole, 'switch');
  assert.equal(contract.rootRole, null, 'the root carries no role of its own');
});

/**
 * ARIA 1.2 declares `switch` **Children Presentational**, so the role belongs
 * on the void `input` and never on the root: a root carrying it would fold the
 * label and the description beside it into the control's own accessible name,
 * and the name of a switch must not change when its state does.
 */
test('keeps the role off the box that holds the label', () => {
  assert.ok(member.parts.includes('label'));
  assert.ok(member.parts.includes('description'));
  assert.equal(contract.rootRole, null);
});

/**
 * The APG's switch pattern states that a checkbox-based switch uses the HTML
 * `checked` attribute *instead of* `aria-checked`. Writing both is the state
 * said twice, and the two can disagree.
 */
test('lets the element carry its own checked state', () => {
  assert.equal(contract.checkedAttribute, 'checked');
  assert.ok(!('ariaChecked' in contract));
});

/**
 * The anatomy `checkbox` settled one item earlier in the same wave, and the
 * reason it settled it that way: a binary control names itself. The label is
 * the control's own element pointing at it through `for`, and the description
 * sits under the label rather than inside it — inside, it would join the
 * accessible name, and help text that toggles a setting when it is clicked is
 * help text nobody reads.
 */
test('draws its own label and description around the pill', () => {
  assert.deepEqual(member.parts, ['root', 'control', 'track', 'thumb', 'label', 'description']);
  assert.deepEqual(contract.axes.labelPlacement, ['end', 'start']);
  assert.ok(member.capabilities.includes('placement'));
});

test('declares a state model for the one value it holds', () => {
  assert.ok(member.capabilities.includes('checked'));
  assert.ok(MUTABLE_CAPABILITIES.includes('checked'));
  assert.deepEqual(contract.stateModel.checked, {
    controlled: 'checked',
    uncontrolled: 'defaultChecked',
    request: 'onCheckedChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
});

/**
 * The request is raised on `click`, which is the one event that fires for a
 * pointer press, for Space and for `element.click()` — and the one that can be
 * refused before the element moves. The reason is read from the event rather
 * than guessed: `detail` separates a pointer from a key, and `isTrusted`
 * separates a key from a script.
 */
test('names the event the request is raised on and how the reason is read', () => {
  assert.equal(contract.requestEvent, 'click');
  assert.deepEqual(contract.reasonSource, {
    pointer: 'detail > 0',
    keyboard: 'detail === 0 && isTrusted',
    programmatic: 'detail === 0 && !isTrusted',
  });
});

/**
 * The native `readonly` attribute does nothing on a checkbox, so a family that
 * wrote it would ship a read-only switch that toggles. The legacy contract
 * declared the capability unsupported instead of implementing it.
 */
test('implements read-only rather than declaring it unsupported', () => {
  assert.ok(member.capabilities.includes('readOnly'));
  assert.equal(contract.readOnlyAttribute, 'aria-readonly');
  assert.ok(member.states.includes('readonly'));
});

/**
 * The field-aware control mechanism. `aria-required` never becomes the native `required`, which would
 * engage browser constraint validation and change submit behavior.
 */
test('takes its identity and its state from the field around it', () => {
  assert.equal(contract.stateSource, 'field');
  assert.equal(contract.stateSource, field.family);
  assert.equal(contract.mirrorsState, true);
  assert.equal(contract.requiredAttribute, 'aria-required');
  assert.equal(contract.disabledAttribute, 'disabled');
  assert.deepEqual(contract.wiring, {
    id: "the field's, else its own",
    'aria-describedby': 'merged',
    'aria-invalid': 'invalid',
    'aria-required': 'required',
    disabled: 'disabled',
    readonly: 'aria-readonly',
  });
});

/**
 * Space is the platform's, and nothing intercepts it. Enter is optional in the
 * APG and is deliberately not bound: inside a form Enter submits, and a switch
 * that stole it would break the form for the sake of an optional key.
 */
test('binds Space and leaves Enter and Escape to the page', () => {
  assert.deepEqual(contract.keyboard, ['Space']);
  assert.equal(contract.keySource, 'platform');
  assert.equal(contract.enterBound, false);
  assert.equal(contract.escapeBound, false);
});

test('resolves every axis from the prop, then the field, then the application', () => {
  assert.deepEqual(contract.axes, {
    size: ['sm', 'md', 'lg'],
    indicator: ['mark', 'none'],
    labelPlacement: ['end', 'start'],
  });
  assert.deepEqual(contract.resolution.size, ['prop', 'field', 'defaults', 'md']);
  assert.deepEqual(contract.resolution.indicator, ['prop', 'defaults', 'mark']);
  assert.deepEqual(contract.resolution.labelPlacement, ['prop', 'defaults', 'end']);
});

test('lets an application decide once what its switches look like', () => {
  assert.deepEqual(contract.provides.switchDefaults, ['size', 'indicator', 'labelPlacement']);
});

/**
 * A switch takes effect immediately, which in a real product means a write
 * that can be in flight. `loading` refuses the second toggle at the click,
 * before the DOM moves, so no request queues behind another.
 */
test('holds a pending state, and refuses activation while it holds it', () => {
  assert.ok(member.capabilities.includes('loading'));
  assert.ok(member.states.includes('loading'));
  assert.deepEqual(contract.refusesActivation, ['disabled', 'loading', 'readonly', 'controlled']);
});

test('paints every state it declares an attribute for', () => {
  assert.deepEqual(contract.stateAttributes, {
    checked: 'data-checked',
    disabled: 'data-disabled',
    invalid: 'data-invalid',
    readonly: 'data-readonly',
    loading: 'data-loading',
  });
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'checked',
    'disabled',
    'readonly',
    'invalid',
    'loading',
  ]);
});

/**
 * `content` is not declared, and the omission is deliberate: the workbench's
 * API table reads that capability as `start` and `end` adornments, which this
 * family does not have. Its label and its description are parts, not
 * adornments, and `placement` is what says the label can move.
 */
test('declares only capabilities it actually holds', () => {
  assert.deepEqual(member.capabilities, [
    'checked',
    'appearance',
    'size',
    'placement',
    'disabled',
    'loading',
    'invalid',
    'required',
    'readOnly',
    'wiring',
  ]);
});

test('demonstrates every axis, every state and the family in a real row', () => {
  for (const id of [
    'sizes',
    'indicator',
    'placement',
    'description',
    'states',
    'loading',
    'settings',
    'keyboard',
  ]) {
    assert.ok(contract.scenarios.switch.includes(id), `no ${id} scenario`);
  }
});
