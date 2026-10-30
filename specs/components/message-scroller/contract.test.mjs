import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertContractShape,
  CHANGE_REASONS,
  MUTABLE_CAPABILITIES,
} from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.messageScroller;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'message-scroller');
  assert.equal(contract.ui, 'message-scroller');
});

test('is one region whose rows are parts', () => {
  assert.deepEqual(Object.keys(contract.members), ['messageScroller']);
  assert.deepEqual(member.parts, [
    'root',
    'viewport',
    'content',
    'item',
    'separator',
    'unread',
    'loader',
    'jump',
    'jump-count',
  ]);
});

/**
 * The position is read from the layout and moved by command, which is why
 * `overflow` is not mutable: a consumer who owned the scroll offset could
 * assert a place the browser does not show. The family reports and obeys.
 */
test('holds no value a consumer owns, and says what happened with a reason', () => {
  assert.ok(!('stateModel' in contract));
  for (const capability of member.capabilities) {
    assert.ok(!MUTABLE_CAPABILITIES.includes(capability), `${capability} would need a model`);
  }
  assert.deepEqual(Object.keys(contract.events), [
    'reachStart',
    'anchorChange',
    'scrollableChange',
  ]);
  for (const event of Object.values(contract.events)) {
    for (const reason of event.reasons ?? []) assert.ok(CHANGE_REASONS.includes(reason));
  }
  assert.deepEqual(contract.events.reachStart.reasons, ['scroll']);
  assert.deepEqual(contract.events.anchorChange.reasons, ['scroll', 'programmatic']);
  assert.deepEqual(contract.imperative, [
    'scrollToMessage',
    'scrollToEnd',
    'scrollToStart',
    'focus',
  ]);
});

test('opens a saved conversation at its last turn unless told otherwise', () => {
  assert.deepEqual(contract.axes.defaultPosition, ['start', 'end', 'last-anchor']);
  assert.equal(member.defaults.defaultPosition, 'last-anchor');
  assert.equal(member.defaults.follow, false);
  assert.equal(member.defaults.peek, 64);
  assert.equal(member.defaults.edgeThreshold, 8);
  assert.equal(member.defaults.preserveOnPrepend, true);
});

/**
 * Every gesture that is the reader choosing where to look releases the
 * follow; a scroll the engine makes itself does not.
 */
test('stops following the moment the reader acts', () => {
  assert.deepEqual(contract.engine.release, [
    'wheel',
    'touchmove',
    'scroll keys on the viewport',
    'pointerdown on the scrollbar',
    'selectionchange inside the content',
    'scrollToMessage',
  ]);
  assert.equal(contract.engine.module, '@slotted/core/message-scroller');
  assert.equal(contract.engine.overflowAnchor, 'none');
});

test('writes its runtime state on the root and the viewport, under names that say so', () => {
  assert.deepEqual(contract.runtimeAttributes, [
    'data-scrollable',
    'data-following',
    'data-pending',
  ]);
  assert.equal(contract.runtimeProperty, '--slotted-message-scroller-room');
});

test('is a labelled, focusable region around a log', () => {
  assert.equal(contract.roles.viewport, 'region');
  assert.equal(contract.roles.content, 'log');
  assert.equal(contract.aria.content['aria-relevant'], 'additions');
  assert.equal(contract.aria.viewport.tabindex, '0');
  assert.ok(contract.messages.includes('label'));
});

test('the jump control says how many arrived out of view and is inert when it has nowhere to go', () => {
  assert.equal(contract.jump.inactive, 'inert, tabindex=-1, data-active="false"');
  assert.equal(contract.jump.count, 'jump-count');
  assert.ok(contract.messages.includes('jumpCount'));
  assert.ok(contract.messages.includes('jumpToEndCount'));
});

test('has one reference page', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['messageScroller']);
});
