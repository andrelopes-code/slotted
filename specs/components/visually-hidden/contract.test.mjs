import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because the family is one primitive', () => {
  assert.equal(contract.family, 'visually-hidden');
  assert.deepEqual(Object.keys(contract.members), ['visuallyHidden']);
  assert.ok(!('axes' in contract), 'the family has no appearance axes');
});

test('renders a span, the element that adds no semantics of its own', () => {
  assert.equal(contract.members.visuallyHidden.nativeElement, 'span');
  assert.deepEqual(contract.members.visuallyHidden.parts, ['root']);
});

test('carries no state attribute, because the primitive has no state', () => {
  assert.deepEqual(contract.members.visuallyHidden.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
});

test('exposes focusable content as its only capability', () => {
  assert.deepEqual(contract.members.visuallyHidden.capabilities, ['focusable']);
  assert.deepEqual(contract.members.visuallyHidden.defaults, { focusable: false });
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['visuallyHidden']);
  assert.deepEqual(contract.scenarios.visuallyHidden, ['playground', 'focusable', 'accessibility']);
});
