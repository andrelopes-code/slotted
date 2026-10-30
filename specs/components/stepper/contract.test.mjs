import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  CHANGE_REASONS,
  STATE_PRECEDENCE,
  strongestState,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const stepper = contract.members.stepper;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because every part reads one step', () => {
  assert.equal(contract.family, 'stepper');
  assert.equal(contract.ui, 'stepper');
  assert.deepEqual(Object.keys(contract.members), ['stepper']);
});

test('names the ten parts a step is made of', () => {
  assert.deepEqual(stepper.parts, [
    'root',
    'list',
    'item',
    'trigger',
    'marker',
    'label',
    'description',
    'status',
    'separator',
    'panel',
  ]);
});

/**
 * Moving one step is a handler on the consumer's own button. Angular Material
 * reaches the same conclusion with `matStepperNext`, a directive placed on a
 * `mat-button`: a family that shipped its own advance button would ship a
 * second button nobody could theme with the first.
 */
test('advances through the consumer button rather than one of its own', () => {
  assert.ok(!stepper.parts.includes('previous'));
  assert.ok(!stepper.parts.includes('next'));
  assert.equal(contract.advance.react, 'useStepper()');
  assert.equal(contract.advance.angular, 'slStepperPrevious and slStepperNext');
});

/**
 * The sequence and the set size come from `ol` and `li`, not from ARIA, and the
 * root is a plain element rather than a second navigation landmark on a page
 * whose main navigation is elsewhere.
 */
test('takes sequence from the platform and claims no landmark', () => {
  assert.equal(stepper.nativeElement, 'div');
  assert.equal(contract.rootRole, 'none');
  assert.equal(contract.listElement, 'ol');
  assert.ok(contract.messages.includes('label'));
});

/**
 * `aria-current="step"` is the ARIA specification's own value for a link inside
 * a step indicator. Unlike the breadcrumb, this family also mirrors the fact
 * into `data-current` — the trigger carries the attribute and the item carries
 * the mirror, because the marker, the label and the connector are all styled
 * from the item and none of them is the trigger.
 */
test('marks the current step on the trigger and mirrors it onto the item', () => {
  assert.equal(contract.currentValue, 'step');
  assert.equal(contract.currentSource, 'aria-current');
  assert.match(contract.mirrorsCurrent, /different element from the trigger/);
  assert.equal(contract.stateAttributes.current, 'data-current');
});

test('gives the step a controlled and uncontrolled pair', () => {
  assert.deepEqual(contract.stateModel.current, {
    controlled: 'step',
    uncontrolled: 'defaultStep',
    request: 'onStepChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
  });
  assert.equal(stepper.defaults.defaultStep, 0);
  for (const reason of contract.stateModel.current.reasons) {
    assert.ok(CHANGE_REASONS.includes(reason));
  }
});

/**
 * `complete` entered the shared vocabulary for this family. Where the reader is
 * outranks what they have finished, and an error outranks both.
 */
test('paints the four statuses, in the order the vocabulary resolves them', () => {
  assert.deepEqual(contract.statuses, ['pending', 'current', 'complete']);
  assert.equal(contract.stateAttributes.complete, 'data-complete');
  assert.equal(contract.stateAttributes.invalid, 'data-invalid');
  assert.equal(strongestState(['complete', 'current']), 'current');
  assert.equal(strongestState(['complete', 'invalid']), 'invalid');
  assert.ok(STATE_PRECEDENCE.indexOf('complete') < STATE_PRECEDENCE.indexOf('hover'));
});

/**
 * Walking past a step is not the same as completing it, so the family never
 * claims completion the consumer did not state — `autoComplete` is the
 * shorthand for the flow where reaching step three does mean the first two are
 * done, and it is off.
 */
test('never reports work as finished that the consumer did not finish', () => {
  assert.equal(stepper.defaults.autoComplete, false);
});

test('names three navigation modes, one of which is not a navigation at all', () => {
  assert.deepEqual(contract.axes.navigation, ['button', 'link', 'none']);
  assert.equal(stepper.defaults.navigation, 'button');
  assert.deepEqual(contract.triggerElement, {
    button: 'button',
    link: 'a',
    none: 'span',
    decidedBy: 'navigation',
  });
});

/**
 * A step a linear flow has not reached stays discoverable: `aria-disabled`
 * keeps it in the tab sequence, so a reader can find out the step exists and
 * that it is not yet available.
 */
test('keeps an unreachable step discoverable rather than removing it', () => {
  assert.equal(contract.unreachableAttribute, 'aria-disabled');
  assert.equal(stepper.defaults.linear, false);
});

test('names both axes the field ships and defaults them the way it does', () => {
  assert.deepEqual(contract.axes.orientation, ['horizontal', 'vertical']);
  assert.deepEqual(contract.axes.labelPlacement, ['end', 'bottom']);
  assert.equal(stepper.defaults.orientation, 'horizontal');
  assert.equal(stepper.defaults.labelPlacement, 'end');
});

test('turns a row into a column from its own container, with a literal breakpoint', () => {
  assert.equal(contract.reflow.container, 'slotted-stepper');
  assert.equal(contract.reflow.breakpoint, '30rem');
  assert.equal(contract.reflow.below, 'vertical');
  assert.match(contract.reflow.appliesTo, /left horizontal/);
  assert.ok('--slotted-stepper-reflow-breakpoint' in contract.literals);
});

/**
 * Every key the CDK stepper binds, plus the two the CDK does not, and every one
 * of them says where focus lands. The arrows are added on top of the tab
 * sequence rather than replacing it with a roving tab stop, because the roving
 * model belongs to the role this family declined.
 */
test('names every key, its orientation and its focus destination', () => {
  const keys = contract.keyboard.map((row) => row.key);
  assert.deepEqual(keys, [
    'Tab',
    'Enter',
    'Space',
    'ArrowRight',
    'ArrowLeft',
    'ArrowDown',
    'ArrowUp',
    'Home',
    'End',
  ]);
  for (const row of contract.keyboard) {
    assert.ok(row.focus.length > 0, `${row.key} names no focus destination`);
    assert.ok(['platform', 'family'].includes(row.source));
  }
  for (const row of contract.keyboard) {
    if (row.key === 'ArrowRight' || row.key === 'ArrowLeft') {
      assert.match(row.effect, /horizontal only/);
      assert.match(row.effect, /reading direction/);
    }
    if (row.key === 'ArrowDown' || row.key === 'ArrowUp') {
      assert.match(row.effect, /vertical only/);
    }
  }
});

test('takes its status and focus arithmetic from the module both bindings share', () => {
  assert.equal(contract.logic, '@slotted/core/steps');
});

/** The tab role is refused, and the family that owns it is named. */
test('names an owner for everything it declines', () => {
  assert.deepEqual(Object.keys(contract.declined), [
    'tabRole',
    'progressBar',
    'validation',
    'size',
    'panelAnimation',
  ]);
  for (const [capability, decline] of Object.entries(contract.declined)) {
    assert.ok(decline.deferTo, `${capability} declines and names no owner`);
    assert.ok(decline.reason.length > 40, `${capability} declines without a reason`);
  }
  assert.equal(contract.declined.tabRole.deferTo, 'tabs');
  assert.equal(contract.declined.validation.deferTo, 'the consumer');
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['stepper']);
  assert.deepEqual(contract.scenarios.stepper, [
    'playground',
    'orientation',
    'statuses',
    'linear',
    'navigation',
    'placement',
    'panels',
    'compact',
    'content',
    'composition',
    'keyboard',
  ]);
});
