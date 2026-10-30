import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const field = JSON.parse(
  await readFile(new URL('../field/contract.json', import.meta.url), 'utf8'),
);
const member = contract.members.promptComposer;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'prompt-composer');
  assert.equal(contract.ui, 'prompt-composer');
});

/**
 * A form around a textarea, two bands and the buttons in them. The form is
 * what makes Enter, requestSubmit() and reset() the platform's; the bands are
 * where ReUI, AI Elements and assistant-ui all put the attachments above and
 * the tools and the send below
 *.
 */
test('is a form holding a textarea, a band above, a band below and their buttons', () => {
  assert.equal(member.nativeElement, 'form');
  assert.equal(contract.controlPart, 'input');
  assert.deepEqual(member.parts, [
    'root',
    'header',
    'input',
    'footer',
    'action',
    'attach',
    'dictate',
    'submit',
    'ring',
    'glow',
  ]);
});

test('takes its identity and its state from the field around it', () => {
  assert.equal(contract.stateSource, 'field');
  assert.deepEqual(contract.wiring, field.wiring);
});

/**
 * The value is the one mutable thing the family owns. A submit that was
 * accepted clears an uncontrolled value with its own reason, so a consumer can
 * tell the reader's deletion from the send.
 */
test('declares a state model for the value, cleared on an accepted submit', () => {
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['keyboard', 'submit', 'dictation'],
  });
  assert.equal(contract.submit.clearsOn, 'accepted');
});

test('asks before it sends, and never sends what the reader is still composing', () => {
  assert.equal(contract.submit.request, 'onValueSubmit');
  assert.equal(contract.submit.cancelable, true);
  assert.deepEqual(contract.submit.reasons, ['keyboard', 'pointer']);
  assert.deepEqual(contract.imeGuard, ['KeyboardEvent.isComposing', 'keyCode 229']);
  assert.deepEqual(
    contract.keyboard.map(({ key }) => key),
    ['Enter', 'Shift+Enter', 'Mod+Enter'],
  );
  assert.deepEqual(contract.axes.submitOn, ['enter', 'mod-enter']);
  assert.equal(contract.escapeBound, false);
});

/**
 * The status of the request belongs to the application, which is the one that
 * knows whether an answer is streaming. The family turns send into stop.
 */
test('turns send into stop while an answer streams', () => {
  assert.deepEqual(contract.axes.status, ['ready', 'submitted', 'streaming', 'error']);
  assert.deepEqual(contract.submit.busyWhile, ['submitted']);
  assert.deepEqual(contract.submit.stopWhile, ['streaming']);
  assert.equal(contract.submit.stop, 'onStop');
  assert.deepEqual(contract.submit.glyphs, { send: 'arrow-up', stop: 'stop', retry: 'rotate-ccw' });
  assert.deepEqual(contract.submit.retryWhile, ['error']);
  assert.ok(!('status' in contract.stateModel), 'status is the consumer’s, never requested');
});

/**
 * The attachments are the consumer's list, because they upload while the
 * reader types. The family hands over the files, validated by the rules
 * `upload` already applies, and draws nothing of them.
 */
test('hands over files from a button, a paste and a drop, validated like upload', () => {
  assert.deepEqual(contract.attach.sources, ['pointer', 'paste', 'drop']);
  assert.equal(contract.attach.rules, '@slotted/core/upload selectFiles');
  assert.equal(contract.attach.output, 'onAttach');
  assert.deepEqual(contract.attach.detail, ['reason', 'rejected']);
  assert.ok(member.states.includes('drop-target'));
});

/**
 * The chat composer is a surface and the default; a composer inside a form —
 * a comment, a reply — keeps a one-line control's geometry.
 */
test('offers a raised surface by default and the two control frames beside it', () => {
  assert.deepEqual(contract.axes.variant, ['raised', 'outline', 'subtle']);
  assert.equal(contract.members.promptComposer.defaults.variant, 'raised');
});

test('lets an application decide once how its composers look', () => {
  assert.deepEqual(contract.provides.promptComposerDefaults, [
    'size',
    'variant',
    'submitOn',
    'emphasis',
  ]);
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.promptComposer, [
    'playground',
    'chat',
    'comment',
    'attachments',
    'status',
    'sizes',
    'states',
    'content',
    'composition',
    'keyboard',
  ]);
});
