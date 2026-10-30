import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.otpInput;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'otp-input');
  assert.equal(contract.ui, 'otp-input');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * One real input and N painted boxes. The input is the control — value, name,
 * form, autocomplete, one tab stop, one accessible name — and the boxes are
 * paint over it, hidden from assistive technology. Ark, Chakra and Mantine
 * render one input per box and pay for it with N tab stops, no real label and
 * an SMS autofill that only works on a single field; input-otp is the
 * surveyed implementation that made the other choice, and the scope in
 * `docs/process/build-order.md` made it too.
 */
test('draws one control and paints the boxes over it', () => {
  assert.deepEqual(Object.keys(contract.members), ['otpInput']);
  assert.deepEqual(member.parts, ['root', 'input', 'group', 'separator', 'slot']);
  assert.equal(member.nativeElement, 'input');
  assert.equal(contract.controlPart, 'input');
  assert.equal(contract.rootRole, null, 'the frame carries no role of its own');
  assert.equal(contract.focusStops, 1);
  assert.deepEqual(contract.hiddenParts, ['group', 'separator', 'slot']);
});

/**
 * The value is the only thing that moves. `keyboard` names the control's
 * editing surface — typing, pasting, the keyboard's own autofill, an IME
 * commit — as `text-field` already does. `programmatic` is the WebOTP API
 * filling the code from an SMS: the application asked for nothing and the
 * reader typed nothing.
 */
test('declares a state model for the value and for nothing else', () => {
  assert.ok(member.capabilities.includes('value'));
  assert.ok(MUTABLE_CAPABILITIES.includes('value'));
  assert.deepEqual(Object.keys(contract.stateModel), ['value']);
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['keyboard', 'programmatic'],
  });
});

/**
 * Completion and rejection are facts about one edit rather than state: there
 * is no value to control and nothing to cancel, so each is an event with a
 * payload and not a model.
 */
test('reports completion and rejected input as events, not as state', () => {
  assert.deepEqual(contract.events, {
    onComplete: 'value',
    onRejected: 'text',
  });
});

/**
 * The field-aware control mechanism. `aria-required` never becomes the native `required`, which would
 * engage browser constraint validation and change submit behavior.
 */
test('takes its identity and its state from the field around it', () => {
  assert.equal(contract.stateSource, 'field');
  assert.equal(contract.stateSource, field.family);
  assert.equal(contract.requiredAttribute, 'aria-required');
  assert.equal(contract.disabledAttribute, 'disabled');
  assert.deepEqual(contract.wiring, field.wiring);
});

/**
 * Four states are mirrored onto the frame and `required` is not: the label
 * draws the necessity marker and the frame paints nothing for it. `complete`
 * is the one the other field families do not have — a code is a value with a
 * known length, and a stylesheet has to be able to say when it is whole.
 * `current` belongs to the box where the cursor or the selection is, which is
 * where the reader is now.
 */
test('mirrors onto the frame exactly the states the frame paints', () => {
  assert.equal(contract.mirrorsState, true);
  assert.deepEqual(Object.keys(contract.stateAttributes), [
    'disabled',
    'invalid',
    'readonly',
    'complete',
    'current',
  ]);
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'focus-visible',
    'disabled',
    'invalid',
    'readonly',
    'complete',
    'current',
  ]);
  assert.deepEqual(contract.partStates, { slot: ['current'] });
});

/**
 * Nothing is bound. The control is a native textbox and the platform answers
 * every key: arrows, Backspace, Delete, Home, End, Shift+arrow, select-all,
 * paste and undo. The family only normalizes the selection afterwards, so a
 * cursor inside the value always has one character selected and typing
 * replaces it instead of being refused by `maxlength`.
 */
test('binds no key of its own and normalizes the selection', () => {
  assert.deepEqual(contract.keyboard, []);
  assert.equal(contract.escapeBound, false);
  assert.equal(contract.selection, 'one-character');
});

test('offers the two code types and a pattern that outranks them', () => {
  assert.deepEqual(contract.axes.type, ['numeric', 'alphanumeric']);
  assert.deepEqual(contract.inputMode, { numeric: 'numeric', alphanumeric: 'text' });
  assert.equal(contract.pattern, 'per-character');
  assert.equal(contract.autocomplete, 'one-time-code');
});

/**
 * `mask` swaps the control's own `type` to `password`, so the platform treats
 * the value as a secret: the screen reader counts characters instead of
 * reading them and the keyboard keeps nothing. The box paints a dot.
 */
test('masks through the platform rather than through paint alone', () => {
  assert.equal(member.defaults.mask, false);
  assert.equal(contract.maskType, 'password');
});

/**
 * `size` comes from the field when there is one, because a `size="sm"` field
 * whose control is `md` is a field and a control disagreeing about one row.
 * `plain` is not offered: a code is never a cell.
 */
test('resolves its axes in one stated order', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.deepEqual(contract.axes.variant, ['outline', 'subtle']);
  assert.deepEqual(contract.resolution.size, ['prop', 'field', 'defaults', 'md']);
  assert.deepEqual(contract.resolution.variant, ['prop', 'defaults', 'outline']);
  assert.deepEqual(contract.resolution.length, ['prop', 'defaults', '6']);
  assert.deepEqual(contract.resolution.type, ['prop', 'defaults', 'numeric']);
});

test('lets an application decide once what its code fields look like', () => {
  assert.deepEqual(contract.provides.otpInputDefaults, [
    'size',
    'variant',
    'attached',
    'length',
    'type',
    'placeholder',
  ]);
  assert.deepEqual(member.defaults, {
    size: 'md',
    variant: 'outline',
    attached: false,
    length: 6,
    type: 'numeric',
    placeholder: '',
    mask: false,
    autoSubmit: false,
    webOtp: false,
  });
});

/**
 * `groups` is a partition of `length`; a `123-456` is how the SMS arrives.
 * The separator is drawn, never a character.
 */
test('partitions the boxes into groups the consumer states', () => {
  assert.equal(contract.groups, 'partition-of-length');
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.otpInput, [
    'playground',
    'sizes',
    'variants',
    'groups',
    'types',
    'mask',
    'states',
    'complete',
    'content',
    'form',
    'composition',
    'keyboard',
  ]);
});
