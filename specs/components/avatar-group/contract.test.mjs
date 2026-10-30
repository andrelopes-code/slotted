import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, MUTABLE_CAPABILITIES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const avatar = JSON.parse(
  await readFile(new URL('../avatar/contract.json', import.meta.url), 'utf8'),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'avatar-group');
  assert.equal(contract.ui, 'avatar-group');
  assert.equal(contract.schemaVersion, 5);
});

/**
 * A family of its own rather than a part of `avatar`, for the reason
 * `button-group` is one: it owns a different element, a different set of
 * decisions, and a member it does not have to be. `badge` went the other way
 * with `anchor` because that part contains a badge and nothing else; a group
 * contains any number of avatars and a summary of the ones it does not show.
 */
test('is a list, and its members are list items', () => {
  assert.equal(contract.members.avatarGroup.nativeElement, 'ul');
  assert.deepEqual(contract.members.avatarGroup.parts, ['root', 'item', 'overflow']);
  assert.equal(contract.memberFamily, 'avatar');
});

/**
 * The overflow holds a real avatar rather than a fourth part painted to look
 * like one, so it takes the size, the shape, the edge and the ring from the
 * same rules as every member beside it.
 */
test('summarises what it does not show, in an avatar of its own', () => {
  assert.ok(contract.members.avatarGroup.parts.includes('overflow'));
  assert.equal(contract.members.avatarGroup.defaults.max, 5);
});

/**
 * Two layouts. Fluent ships `spread`, `stack` and `pie`; Atlassian ships
 * `grid` and `stack`. The two both ship are the overlapped run and the
 * separated one, and `pie` is a chart of a group rather than a list of it.
 */
test('overlaps its members by default, and can lay them out apart', () => {
  assert.deepEqual(contract.axes.layout, ['stack', 'spread']);
  assert.equal(contract.members.avatarGroup.defaults.layout, 'stack');
});

/**
 * The group decides how its members are drawn, once. It does not decide their
 * tone: a tone derived from a name is the member's own identity, and a group
 * that overrode it would paint eight people the same colour.
 */
test('provides the appearance of its members, and never their identity colour', () => {
  assert.deepEqual(contract.provides.avatarDefaults, ['size', 'shape', 'variant']);
  assert.ok(!contract.provides.avatarDefaults.includes('tone'));
});

test('speaks the same size and shape vocabulary as the family it holds', () => {
  assert.deepEqual(contract.axes.size, avatar.axes.size);
  assert.deepEqual(contract.axes.shape, avatar.axes.shape);
  assert.equal(contract.members.avatarGroup.defaults.size, avatar.members.avatar.defaults.size);
  assert.equal(contract.members.avatarGroup.defaults.shape, avatar.members.avatar.defaults.shape);
});

/**
 * In a stack the member under the pointer comes to the front, so its focus ring
 * is never half-covered by the avatar after it. MUI, Ant, Chakra and Primer all
 * clip it.
 */
test('raises the member under the pointer or the caret', () => {
  assert.deepEqual(contract.members.avatarGroup.states, ['default', 'hover', 'focus-visible']);
  assert.ok(!('stateAttributes' in contract), 'every declared state is a pseudo-state');
});

test('holds no state a consumer can own, and therefore declares no state model', () => {
  for (const capability of MUTABLE_CAPABILITIES) {
    assert.ok(
      !contract.members.avatarGroup.capabilities.includes(capability),
      `avatar-group claims the mutable capability ${capability}`,
    );
  }
  assert.ok(!('stateModel' in contract));
});

test('names one reference page, covering the limit and the summary', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['avatarGroup']);
  assert.deepEqual(contract.scenarios.avatarGroup, [
    'playground',
    'layout',
    'overflow',
    'sizes',
    'composition',
    'extremes',
    'accessibility',
  ]);
});
