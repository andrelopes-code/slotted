import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is the platform disclosure, not a button and a div', () => {
  assert.equal(contract.family, 'collapsible');
  assert.deepEqual(Object.keys(contract.members), [
    'collapsible',
    'collapsibleTrigger',
    'collapsibleContent',
  ]);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, m]) => [name, m.nativeElement]),
    ),
    { collapsible: 'details', collapsibleTrigger: 'summary', collapsibleContent: 'div' },
  );
});

test('reads its state from the attribute the platform already sets', () => {
  assert.equal(contract.openAttribute, 'open');
  assert.ok(!('stateAttributes' in contract), 'no data attribute duplicates [open]');
});

test('exposes being open as its only capability', () => {
  assert.deepEqual(contract.members.collapsible.capabilities, ['open']);
  assert.equal(contract.members.collapsible.defaults.open, false);
});

test('gives the trigger the states a control has', () => {
  assert.deepEqual(contract.members.collapsibleTrigger.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
  ]);
  assert.deepEqual(contract.members.collapsibleContent.states, ['default']);
});

test('names one part per member', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(contract.members).map(([name, m]) => [name, m.parts])),
    { collapsible: ['root'], collapsibleTrigger: ['trigger'], collapsibleContent: ['content'] },
  );
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['collapsible']);
  assert.deepEqual(contract.scenarios.collapsible, [
    'playground',
    'open',
    'composition',
    'accessibility',
  ]);
});
