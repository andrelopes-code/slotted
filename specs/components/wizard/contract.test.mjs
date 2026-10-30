import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, CHANGE_REASONS } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.wizard;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'wizard');
  assert.equal(contract.ui, 'wizard');
  assert.equal(contract.schemaVersion, 5);
  assert.deepEqual(Object.keys(contract.members), ['wizard']);
  assert.equal(member.nativeElement, 'div');
  assert.equal(contract.rootRole, null);
});

/**
 * The design's anatomy, §3, part for part. The progress is the stepper family,
 * each step's body is the form family, and the error is the alert family, so
 * none of their inner parts is this family's.
 */
test('declares every part of the anatomy', () => {
  assert.deepEqual(member.parts, [
    'root',
    'layout',
    'progress',
    'progress-toggle',
    'progress-position',
    'progress-track',
    'progress-segment',
    'main',
    'error',
    'step',
    'step-header',
    'step-title',
    'position',
    'optional',
    'step-description',
    'actions',
    'actions-start',
    'actions-end',
    'cancel',
    'save-draft',
    'draft-status',
    'skip',
    'previous',
    'next',
    'submit',
    'edit',
    'complete',
    'skeleton',
  ]);
  for (const part of member.parts) {
    assert.ok(typeof contract.anatomy[part] === 'string', `${part} is not described`);
  }
  assert.deepEqual(contract.composes, ['stepper', 'form', 'button', 'alert', 'tag', 'skeleton']);
});

/**
 * Three values move. The step is a name, not an index, because a branch that
 * inserts a step renumbers every index after it and a bookmarked `?step=3`
 * would open another step. The value holds accepted answers only, so a step is
 * complete exactly when it is in the map.
 */
test('models every mutable value with its reasons', () => {
  assert.deepEqual(contract.stateModel.current, {
    controlled: 'step',
    uncontrolled: 'defaultStep',
    request: 'onStepChange',
    reasons: ['pointer', 'keyboard', 'submit', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.value, {
    controlled: 'value',
    uncontrolled: 'defaultValue',
    request: 'onValueChange',
    reasons: ['submit', 'clear', 'programmatic'],
  });
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'progressOpen',
    uncontrolled: 'defaultProgressOpen',
    request: 'onProgressOpenChange',
    reasons: ['pointer', 'keyboard', 'select', 'escape', 'programmatic'],
  });
  for (const model of Object.values(contract.stateModel)) {
    for (const reason of model.reasons) assert.ok(CHANGE_REASONS.includes(reason), reason);
  }
  assert.match(contract.rules.complete, /exactly when its name is in value/);
  assert.match(contract.rules.drafts, /not value/);
});

/**
 * §5 of the design, where a test can find it: what a submission of a step
 * does, what going back keeps, where the flow goes next, what an unreachable
 * step becomes, and what a submission is given.
 */
test('states the rules of the step cycle', () => {
  assert.match(contract.rules.advance, /constraint validation/);
  assert.match(contract.rules.advance, /validate/);
  assert.match(contract.rules.advance, /AbortSignal/);
  assert.match(contract.rules.back, /without validating/);
  assert.match(contract.rules.jump, /submitted first/);
  assert.match(contract.rules.destination, /return point/);
  assert.match(contract.rules.destination, /after the consumer has rendered/);
  assert.match(contract.rules.restore, /after the consumer has rendered/);
  assert.match(contract.rules.clamp, /first incomplete step/);
  assert.match(contract.rules.clamp, /programmatic/);
  assert.match(contract.rules.submit, /only the steps present/);
  assert.match(contract.rules.failure, /step/);
  assert.match(contract.rules.failure, /errors/);
  assert.match(contract.rules.branching, /new name is a new step/);
  assert.match(contract.rules.branching, /keeps its entry/);
  assert.match(contract.rules.skip, /\{\}/);
  assert.match(contract.rules.url, /never writes location/);
});

/**
 * The eight cases decided at the visual gate, §5.6 of the design: the list of
 * steps changing under the reader is where a flow built on the consumer's own
 * conditional rendering breaks first.
 */
test('decides what a changing list of steps does', () => {
  assert.match(contract.rules.clamp, /never the current step/);
  assert.match(contract.rules.insertedBefore, /first incomplete step/);
  assert.match(contract.rules.controlledAbsent, /renders the step the family requested/);
  assert.match(contract.rules.returnAbsent, /dropped/);
  assert.match(contract.rules.pendingRemoved, /aborts/);
  assert.match(contract.rules.uniqueNames, /throw/);
  assert.match(contract.rules.liveConditions, /after the advance/);
  assert.match(contract.rules.countChanges, /recomputed/);
  assert.match(contract.rules.empty, /throws/);
});

test('declares the draft, restore and leave policies', () => {
  assert.deepEqual(Object.keys(contract.snapshot), [
    'version',
    'step',
    'value',
    'drafts',
    'savedAt',
  ]);
  assert.deepEqual(contract.persistence.methods, ['load', 'save', 'clear']);
  assert.match(contract.persistence.storage, /File/);
  assert.match(contract.persistence.version, /ignored and cleared/);
  assert.deepEqual(contract.axes.autosave, ['none', 'step']);
  assert.equal(member.defaults.guardUnsaved, false);
});

test('offers the layout axes with their defaults', () => {
  assert.deepEqual(contract.axes.progress, ['start', 'top', 'none']);
  assert.deepEqual(contract.axes.scroll, ['ancestor', 'self']);
  assert.deepEqual(contract.axes.level, [2, 3, 4]);
  assert.equal(member.defaults.progress, 'start');
  assert.equal(member.defaults.scroll, 'ancestor');
  assert.equal(member.defaults.linear, true);
  assert.equal(member.defaults.level, 2);
  assert.equal(contract.reflow.container, 'slotted-wizard');
  assert.equal(contract.reflow.breakpoint, '600px');
  assert.deepEqual(contract.provides.wizardDefaults, [
    'progress',
    'linear',
    'level',
    'scroll',
    'delay',
    'minDuration',
  ]);
});

test('moves focus where the design says, and nowhere on first render', () => {
  assert.match(contract.focus.initial, /does not move/);
  assert.match(contract.focus.step, /step-title/);
  assert.match(contract.focus.failure, /alert/);
  assert.match(contract.focus.complete, /complete/);
  assert.match(contract.focus.escape, /progress-toggle/);
});

test('answers every wait with one indicator', () => {
  assert.match(contract.waits.restore, /skeleton/);
  assert.match(contract.waits.restore, /aria-busy/);
  assert.match(contract.waits.validate, /loading/);
  assert.match(contract.waits.submit, /loading/);
  assert.match(contract.waits.draft, /loading/);
  assert.equal(member.defaults.delay, 200);
  assert.equal(member.defaults.minDuration, 400);
});

test('carries every word the design names, as catalog keys', () => {
  assert.deepEqual(contract.messages, [
    'cancel',
    'draftFailed',
    'edit',
    'incomplete',
    'next',
    'optional',
    'position',
    'previous',
    'progress',
    'restoring',
    'return',
    'saved',
    'saveDraft',
    'saving',
    'skip',
    'submit',
    'submitFailed',
  ]);
});

test('names the family that owns each declined capability', () => {
  assert.equal(contract.declined.modal.deferTo, 'dialog');
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok('deferTo' in entry || 'composition' in entry, `${name} names neither`);
  }
});

test('declares a demonstration for every capability the design asks to show', () => {
  assert.deepEqual(contract.scenarios.wizard, [
    'playground',
    'progress',
    'validation',
    'branching',
    'optional',
    'review',
    'submit',
    'drafts',
    'url',
    'narrow',
    'dialog',
    'content',
    'forms',
    'labels',
    'accessibility',
  ]);
});

test('records why its component tokens state a literal', () => {
  assert.equal(contract.literals['--slotted-wizard-progress-inline-size'].value, '14rem');
  assert.match(contract.literals.reflowBreakpoint, /container condition/);
});
