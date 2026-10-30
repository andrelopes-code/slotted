import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members?.tour ?? {};

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'tour');
  assert.equal(contract.ui, 'tour');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * There is no tour pattern in the APG. A modal step answers the modal dialog
 * pattern; a step whose target the reader must operate answers the non-modal
 * dialog `popover` already answers. Both are stated, not left to the role.
 */
test('cites the pattern it answers, and says there is none of its own', () => {
  assert.equal(contract.pattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/');
  assert.match(contract.patternStatus, /no tour pattern/i);
  assert.equal(contract.roles.content, 'dialog');
  assert.match(contract.wiring['aria-modal'], /inert/);
});

test('holds two values a consumer can own, each with a request and its reasons', () => {
  assert.deepEqual(contract.stateModel.open, {
    controlled: 'open',
    uncontrolled: 'defaultOpen',
    request: 'onOpenChange',
    reasons: ['pointer', 'keyboard', 'dismiss', 'escape', 'outsidePress', 'back', 'programmatic'],
    outcome: ['complete', 'skip', 'close', 'unavailable'],
  });
  assert.deepEqual(contract.stateModel.current, {
    controlled: 'step',
    uncontrolled: 'defaultStep',
    request: 'onStepChange',
    reasons: ['pointer', 'keyboard', 'programmatic'],
    value: 'the id of the step, never its index',
  });
});

test('declares the anatomy of the frame, the spotlight and the card', () => {
  assert.deepEqual(member.parts, [
    'root',
    'backdrop',
    'spotlight',
    'surface',
    'focus-guard',
    'arrow',
    'content',
    'media',
    'header',
    'progress',
    'close',
    'title',
    'description',
    'body',
    'footer',
    'skip',
    'prev',
    'next',
  ]);
  assert.deepEqual(member.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'open',
    'loading',
  ]);
  assert.equal(contract.stateAttributes.loading, 'data-loading');
});

test('answers every key it binds, and says where focus lands', () => {
  assert.deepEqual(
    contract.keyboard.map((entry) => entry.key),
    ['Tab', 'Shift+Tab', 'Escape', 'ArrowRight', 'ArrowLeft', 'Enter', 'Space'],
  );
  for (const entry of contract.keyboard) {
    assert.ok(entry.effect.length > 0, `${entry.key} does not say what it does`);
    assert.ok(entry.focus.length > 0, `${entry.key} does not say where focus lands`);
    assert.ok(['platform', 'pattern', 'family'].includes(entry.source), `${entry.key} source`);
  }
  const arrows = contract.keyboard.filter((entry) => entry.key.startsWith('Arrow'));
  for (const entry of arrows) assert.match(entry.effect, /right-to-left/);
});

/**
 * Focus follows the reader, not the tour: a step change moves focus only when
 * focus was already in the card.
 */
test('says when focus moves and when the step is only announced', () => {
  assert.equal(contract.focus.autoFocus.default, true);
  assert.equal(contract.focus.autoFocus.target, 'content');
  assert.match(contract.focus.stepChange, /announce/);
  assert.equal(contract.focus.restore, 'the element that held focus when the tour opened');
  assert.equal(contract.focus.guards.part, 'focus-guard');
});

test('recovers from a missing target, a failed preparation and an empty tour', () => {
  assert.deepEqual(contract.recovery.missing.values, ['center', 'skip']);
  assert.equal(contract.recovery.missing.default, 'center');
  assert.ok(contract.recovery.targetTimeout.reason.length > 0);
  assert.match(contract.recovery.prepareRejected, /missing/);
  assert.match(contract.recovery.noneAvailable, /unavailable/);
  assert.match(contract.recovery.targetRemoved, /data-missing/);
});

test('publishes the target rectangle as runtime properties, not as tokens', () => {
  for (const name of [
    '--slotted-tour-target-x',
    '--slotted-tour-target-y',
    '--slotted-tour-target-width',
    '--slotted-tour-target-height',
  ]) {
    assert.ok(contract.runtimeProperties.includes(name), name);
  }
});

test('says what each rejected capability is replaced by', () => {
  for (const [name, entry] of Object.entries(contract.declined)) {
    assert.ok(entry.reason.length > 0, `${name} gives no reason`);
    assert.ok(
      'deferTo' in entry || 'compose' in entry,
      `${name} names neither owner nor composition`,
    );
  }
});

test('lets an application set every default once', () => {
  const provided = contract.provides.tourDefaults;
  for (const axis of Object.keys(contract.resolution)) {
    assert.ok(provided.includes(axis), `${axis} is not provided`);
  }
  assert.ok(
    provided.every((key) => !key.startsWith('labels')),
    'words come from the catalog, not the defaults provider',
  );
});

test('declares one scenario per capability the reference page has to show', () => {
  assert.deepEqual(contract.scenarios.tour, [
    'playground',
    'placement',
    'centered',
    'spotlight',
    'modal',
    'interactive',
    'availability',
    'missing',
    'prepare',
    'controlled',
    'composition',
    'labels',
    'keyboard',
    'compact',
    'edges',
    'layers',
  ]);
});

/**
 * A tour has to hold on a phone, beside a target in a corner, over a target
 * that fills the screen, and over a dialog that opens halfway through it.
 */
test('says how it holds on a phone, at the edges and over another layer', () => {
  assert.deepEqual(contract.axes.layout, ['auto', 'compact', 'regular']);
  assert.equal(contract.members.tour.defaults.layout, 'auto');
  assert.match(contract.compact.threshold, /600/);
  assert.match(contract.compact.side, /bottom/);
  assert.match(contract.edges.crowded, /centred/);
  assert.match(contract.edges.tracking, /visual viewport/);
  assert.match(contract.layers.focus, /opened over/);
  assert.match(contract.layers.escape, /topmost/);
});
