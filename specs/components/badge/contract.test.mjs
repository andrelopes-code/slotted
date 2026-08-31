import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const buttonContract = JSON.parse(
  await readFile(new URL('../button/contract.json', import.meta.url), 'utf8'),
);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because the family is one primitive', () => {
  assert.equal(contract.family, 'badge');
  assert.deepEqual(Object.keys(contract.members), ['badge']);
});

test('renders a span, so a badge inherits the semantics of its context', () => {
  assert.equal(contract.members.badge.nativeElement, 'span');
  assert.deepEqual(contract.members.badge.parts, ['root']);
});

test('names the same tones the button family names', () => {
  assert.deepEqual(contract.axes.variant, buttonContract.axes.variant);
});

test('offers only the fills the tone tokens can paint', () => {
  assert.deepEqual(contract.axes.fill, ['solid', 'outline']);
});

test('sizes a badge for a table row and for a heading', () => {
  assert.deepEqual(contract.axes.size, ['sm', 'md']);
});

test('defaults to the quietest appearance', () => {
  assert.deepEqual(contract.members.badge.defaults, {
    variant: 'secondary',
    fill: 'solid',
    size: 'md',
  });
  assert.deepEqual(contract.members.badge.capabilities, ['appearance']);
});

test('carries no state: a badge reports, it does not respond', () => {
  assert.deepEqual(contract.members.badge.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['badge']);
  assert.deepEqual(contract.scenarios.badge, ['playground', 'appearance', 'sizes', 'composition']);
});
