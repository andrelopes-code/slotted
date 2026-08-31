import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('declares one member, because the family is one primitive', () => {
  assert.equal(contract.family, 'spinner');
  assert.deepEqual(Object.keys(contract.members), ['spinner']);
});

test('names the sizes the button family already names', () => {
  assert.deepEqual(contract.axes, { size: ['sm', 'md', 'lg'] });
  assert.equal(contract.members.spinner.defaults.size, 'md');
});

test('separates the animated shape from the text that announces it', () => {
  assert.equal(contract.members.spinner.nativeElement, 'span');
  assert.deepEqual(contract.members.spinner.parts, ['root', 'indicator', 'label']);
});

test('announces itself by default and can be silenced', () => {
  assert.deepEqual(contract.members.spinner.capabilities, ['size', 'decorative']);
  assert.equal(contract.members.spinner.defaults.decorative, false);
  assert.equal(contract.members.spinner.defaults.label, 'Loading');
});

test('carries no state attribute: a spinner is never anything but busy', () => {
  assert.deepEqual(contract.members.spinner.states, ['default']);
  assert.ok(!('stateAttributes' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['spinner']);
  assert.deepEqual(contract.scenarios.spinner, [
    'playground',
    'sizes',
    'composition',
    'accessibility',
  ]);
});
