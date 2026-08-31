import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape, STATE_ATTRIBUTES } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is a navigation region around an ordered list', () => {
  assert.equal(contract.family, 'breadcrumb');
  assert.deepEqual(Object.keys(contract.members), [
    'breadcrumb',
    'breadcrumbList',
    'breadcrumbItem',
    'breadcrumbLink',
  ]);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, m]) => [name, m.nativeElement]),
    ),
    { breadcrumb: 'nav', breadcrumbList: 'ol', breadcrumbItem: 'li', breadcrumbLink: 'a' },
  );
});

test('has no separator member, because the separator is not content', () => {
  assert.ok(!('breadcrumbSeparator' in contract.members));
  assert.equal(contract.separator, 'stylesheet');
});

test('marks the page the reader is on', () => {
  assert.deepEqual(contract.members.breadcrumbLink.capabilities, ['wiring', 'current']);
  assert.equal(contract.members.breadcrumbLink.defaults.current, false);
  assert.deepEqual(contract.stateAttributes, { current: 'data-current' });
  assert.equal(STATE_ATTRIBUTES.current, 'data-current');
});

test('gives the link the states a link has, and the rest none', () => {
  assert.deepEqual(contract.members.breadcrumbLink.states, [
    'default',
    'hover',
    'focus-visible',
    'current',
  ]);
  for (const name of ['breadcrumb', 'breadcrumbList', 'breadcrumbItem']) {
    assert.deepEqual(contract.members[name].states, ['default'], name);
  }
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['breadcrumb']);
  assert.deepEqual(contract.scenarios.breadcrumb, [
    'playground',
    'current',
    'composition',
    'accessibility',
  ]);
});
