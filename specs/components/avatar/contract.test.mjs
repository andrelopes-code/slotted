import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, STATE_ATTRIBUTES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('separates the picture from what stands in for it', () => {
  assert.equal(contract.family, 'avatar');
  assert.deepEqual(Object.keys(contract.members), ['avatar', 'avatarImage', 'avatarFallback']);
});

test('gives each member its native element and part', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, member]) => [name, member.nativeElement]),
    ),
    { avatar: 'span', avatarImage: 'img', avatarFallback: 'span' },
  );
  assert.deepEqual(contract.members.avatar.parts, ['root']);
  assert.deepEqual(contract.members.avatarImage.parts, ['image']);
  assert.deepEqual(contract.members.avatarFallback.parts, ['fallback']);
});

test('holds one state, and holds it on the root', () => {
  assert.deepEqual(contract.stateAttributes, { loaded: 'data-loaded' });
  assert.equal(STATE_ATTRIBUTES.loaded, 'data-loaded');
  assert.deepEqual(contract.members.avatar.states, ['default', 'loaded']);
  for (const name of ['avatarImage', 'avatarFallback']) {
    assert.deepEqual(contract.members[name].states, ['default'], name);
  }
});

test('sizes the avatar and leaves its shape to the theme', () => {
  assert.deepEqual(contract.axes, { size: ['sm', 'md', 'lg'] });
  assert.deepEqual(contract.members.avatar.capabilities, ['size']);
  assert.equal(contract.members.avatar.defaults.size, 'md');
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['avatar']);
  assert.deepEqual(contract.scenarios.avatar, ['playground', 'sizes', 'fallback', 'composition']);
});
