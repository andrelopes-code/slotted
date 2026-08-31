import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because the family is one primitive', () => {
  assert.equal(contract.family, 'link');
  assert.deepEqual(Object.keys(contract.members), ['link']);
});

test('renders an anchor, the only element that navigates', () => {
  assert.equal(contract.members.link.nativeElement, 'a');
});

test('names the underline axis and defaults to the web convention', () => {
  assert.deepEqual(contract.axes, { underline: ['always', 'hover', 'none'] });
  assert.equal(contract.members.link.defaults.underline, 'always');
});

test('carries a part for the warning an external link owes the reader', () => {
  assert.deepEqual(contract.members.link.parts, ['root', 'external-hint']);
  assert.equal(contract.members.link.defaults.external, false);
});

test('reacts to the pointer and the keyboard, and holds no attribute state', () => {
  assert.deepEqual(contract.members.link.states, ['default', 'hover', 'active', 'focus-visible']);
  assert.ok(!('stateAttributes' in contract));
});

test('exposes underline and external as its capabilities', () => {
  assert.deepEqual(contract.members.link.capabilities, ['underline', 'external']);
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['link']);
  assert.deepEqual(contract.scenarios.link, ['playground', 'underline', 'external', 'composition']);
});
