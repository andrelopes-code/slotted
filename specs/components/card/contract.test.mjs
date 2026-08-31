import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the surface and its three regions', () => {
  assert.equal(contract.family, 'card');
  assert.deepEqual(Object.keys(contract.members), ['card', 'cardHeader', 'cardBody', 'cardFooter']);
});

test('renders divs, because a card is whatever the page says it is', () => {
  for (const member of Object.values(contract.members)) {
    assert.equal(member.nativeElement, 'div');
  }
});

test('names one part per member', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(contract.members).map(([name, m]) => [name, m.parts])),
    { card: ['root'], cardHeader: ['header'], cardBody: ['body'], cardFooter: ['footer'] },
  );
});

test('declares no axes and no configuration', () => {
  assert.ok(!('axes' in contract), 'a card is a surface, not a set of variants');
  for (const member of Object.values(contract.members)) {
    assert.deepEqual(member.capabilities, ['wiring']);
    assert.deepEqual(member.defaults, {});
  }
});

test('carries no state: a surface does not respond', () => {
  for (const member of Object.values(contract.members)) {
    assert.deepEqual(member.states, ['default']);
  }
  assert.ok(!('stateAttributes' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['card']);
  assert.deepEqual(contract.scenarios.card, [
    'playground',
    'anatomy',
    'composition',
    'accessibility',
  ]);
});
