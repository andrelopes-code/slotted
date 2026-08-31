import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('defines the ordered tabs family structure', () => {
  assert.equal(contract.family, 'tabs');
  assert.deepEqual(Object.keys(contract.members), ['tabs', 'tabList', 'tab', 'tabPanel']);
  assert.deepEqual(contract.orientations, ['horizontal', 'vertical']);
  assert.deepEqual(contract.activation, ['automatic', 'manual']);
});

test('gives each member its native element and parts', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, member]) => [name, member.nativeElement]),
    ),
    { tabs: 'div', tabList: 'div', tab: 'button', tabPanel: 'div' },
  );
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, member]) => [name, member.parts]),
    ),
    { tabs: ['root'], tabList: ['list'], tab: ['tab'], tabPanel: ['panel'] },
  );
});

test('carries selection and disability on the tab alone', () => {
  assert.ok(contract.members.tab.states.includes('selected'));
  assert.ok(contract.members.tab.states.includes('disabled'));
  for (const name of ['tabs', 'tabList', 'tabPanel']) {
    assert.deepEqual(contract.members[name].states, ['default'], name);
  }
});

test('defaults to horizontal automatic tabs', () => {
  assert.deepEqual(contract.members.tabs.defaults, {
    activation: 'automatic',
    orientation: 'horizontal',
  });
  assert.ok(contract.orientations.includes(contract.members.tabs.defaults.orientation));
  assert.ok(contract.activation.includes(contract.members.tabs.defaults.activation));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['tabs']);
  assert.deepEqual(contract.scenarios.tabs, [
    'playground',
    'orientations',
    'activation',
    'states',
    'composition',
    'accessibility',
  ]);
});
