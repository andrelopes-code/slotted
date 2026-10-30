import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.textField;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'text-field');
  assert.equal(contract.ui, 'text-field');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * A frame around the control rather than the control itself, which is what the
 * eight surveyed implementations that put content inside the border all do.
 * WAI-ARIA settles the shape: a `textbox` may hold only non-interactive,
 * presentational children, so the clear and reveal buttons are siblings of the
 * `input` inside a frame with no role — never children of the control.
 */
test('draws a frame holding the control, its adornments and its buttons', () => {
  assert.deepEqual(Object.keys(contract.members), ['textField']);
  assert.deepEqual(member.parts, [
    'root',
    'input',
    'start',
    'end',
    'action',
    'busy',
    'caps-lock',
    'clear',
    'copy',
    'reveal',
  ]);
  assert.equal(member.nativeElement, 'input');
  assert.equal(contract.controlPart, 'input');
  assert.equal(contract.rootRole, null, 'the frame carries no role of its own');
});

/**
 * The words `docs/component-features.md` §2.4 asks for, and the ones `tag`
 * already ships. `prefix` could not have been the name in React either: it is
 * a global RDFa attribute React's own `HTMLAttributes` declares.
 */
test('names its adornments for the reading direction rather than for a side', () => {
  assert.ok(member.parts.includes('start') && member.parts.includes('end'));
  assert.ok(!member.parts.includes('prefix') && !member.parts.includes('suffix'));
});

/**
 * The control holds text, and the schema had no word for that until this wave:
 * the deleted `input` family declared five capabilities, none of them mutable,
 * and no state model for the one thing the control does.
 */
test('declares a state model for the value and for the password toggle', () => {
  assert.ok(member.capabilities.includes('value'));
  assert.ok(MUTABLE_CAPABILITIES.includes('value'));
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['keyboard', 'clear'],
  });
  assert.deepEqual(contract.stateModel.revealed, {
    controlled: 'revealed',
    uncontrolled: 'defaultRevealed',
    request: 'onRevealedChange',
    reasons: ['pointer', 'keyboard'],
  });
});

/**
 * Every user edit is one reason. `keyboard` names the control's editing
 * surface rather than the device, because typing, pasting, dropping text, an
 * IME commit and an autofill all arrive through the same surface and a
 * consumer who needs the device reads the originating event the request
 * carries.
 */
test('emits only the two reasons a text control can produce', () => {
  assert.deepEqual(contract.stateModel.value.reasons, ['keyboard', 'clear']);
});

/**
 * The field-aware control mechanism. `aria-required` never becomes the native `required`, which would
 * engage browser constraint validation and change submit behaviour.
 */
test('takes its identity and its state from the field around it', () => {
  assert.equal(contract.stateSource, 'field');
  assert.equal(contract.stateSource, field.family);
  assert.equal(contract.requiredAttribute, 'aria-required');
  assert.equal(contract.disabledAttribute, 'disabled');
  assert.deepEqual(contract.wiring, field.wiring);
});

/**
 * `complete` is the one state written on a part rather than on the frame: the
 * copy button, for as long as its check is shown.
 *
 * Three states are mirrored and `required` is not: the label draws the
 * necessity marker and the frame paints nothing for it, so an attribute for it
 * would be an attribute nothing reads.
 */
test('mirrors onto the frame exactly the states the frame paints', () => {
  assert.equal(contract.mirrorsState, true);
  assert.deepEqual(Object.keys(contract.stateAttributes), [
    'disabled',
    'invalid',
    'readonly',
    'loading',
    'complete',
  ]);
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'disabled',
    'invalid',
    'readonly',
    'loading',
    'complete',
  ]);
});

/**
 * The consumer's button inside the frame. A menu trigger is composed onto it
 * rather than drawn by this family: `menu` owns the popup, and `select` is
 * refused because it binds to the field as its control and would take the
 * input's identifier.
 */
test('lets the consumer place its own buttons inside the frame', () => {
  assert.deepEqual(contract.action, {
    part: 'action',
    element: 'button',
    placedIn: ['start', 'end'],
    composes: ['menu', 'popover', 'tooltip'],
    square: 'aria-label or aria-labelledby',
    open: 'aria-expanded',
  });
});

/**
 * Loading belongs to the consumer and leaves the value editable: an
 * asynchronous check of a user name must not take the keyboard away.
 */
test('waits with the shared ring and keeps the value editable', () => {
  assert.equal(contract.waiting.busy.part, 'busy');
  assert.equal(contract.waiting.busy.ui, 'spinner');
  assert.equal(contract.waiting.busy.stylesheet, 'spinner/spinner.css');
  assert.equal(contract.waiting.editable, true);
  assert.equal(contract.waiting.control, 'aria-busy');
});

/**
 * The shape `code-block` already ships. The feedback is transient, so it is
 * not a state model: the clipboard is not a value this family holds.
 */
test('copies the value and says whether it could', () => {
  assert.deepEqual(contract.copy, {
    part: 'copy',
    module: '@slotted/core/clipboard',
    complete: 'data-complete',
    completeFor: 2000,
    glyphs: ['copy', 'check'],
    output: 'onValueCopy',
    detail: ['copied', 'reason', 'source', 'value'],
    announces: ['copied', 'copyFailed'],
  });
  assert.ok(!('copied' in contract.stateModel));
});

/** A fact of the platform, read and never requested. */
test('warns about Caps Lock in a password it has focus in', () => {
  assert.deepEqual(contract.capsLock, {
    part: 'caps-lock',
    types: ['password'],
    read: "KeyboardEvent.getModifierState('CapsLock')",
    while: 'focus',
    glyph: 'caps-lock',
    announces: 'capsLock',
  });
});

/** The count is the control's and the place is the field's. */
test('counts in the units the platform enforces and lets the field place them', () => {
  assert.equal(contract.counter.unit, 'utf-16');
  assert.equal(contract.counter.placedBy, 'field');
  assert.equal(contract.counter.limitFrom, 'maxLength');
  assert.ok(field.members.field.parts.includes('counter'), 'the field draws no counter');
});

/**
 * Nothing is bound to Escape. Some user agents clear a `type="search"` input
 * on the key; a control that swallowed it inside a dialog would be a control a
 * keyboard user cannot leave.
 */
test('binds no key of its own', () => {
  assert.deepEqual(contract.keyboard, []);
  assert.equal(contract.escapeBound, false);
});

test('offers the six text types and no more', () => {
  assert.deepEqual(contract.types, ['text', 'search', 'email', 'url', 'tel', 'password']);
});

/**
 * `size` comes from the field when there is one, because a `size="sm"` field
 * whose control is `md` is a field and a control disagreeing about one row.
 */
test('resolves its axes in one stated order', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.deepEqual(contract.axes.variant, ['outline', 'subtle', 'plain']);
  assert.deepEqual(contract.resolution.size, ['prop', 'field', 'defaults', 'md']);
  assert.deepEqual(contract.resolution.variant, ['prop', 'defaults', 'outline']);
});

test('lets an application decide once what its text fields look like', () => {
  assert.deepEqual(contract.provides.textFieldDefaults, ['size', 'variant', 'mono']);
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.textField, [
    'playground',
    'sizes',
    'variants',
    'adornments',
    'actions',
    'menu',
    'copy',
    'password',
    'loading',
    'states',
    'count',
    'types',
    'content',
    'composition',
    'keyboard',
  ]);
});
