import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('holds two panes and the separator between them', () => {
  assert.equal(contract.family, 'splitter');
  assert.deepEqual(Object.keys(contract.members), ['splitter', 'splitterPane', 'splitterHandle']);
  assert.equal(contract.panes, 2);
});

test('gives each member its native element and part', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, member]) => [name, member.nativeElement]),
    ),
    { splitter: 'div', splitterPane: 'div', splitterHandle: 'div' },
  );
  assert.deepEqual(contract.members.splitter.parts, ['root']);
  assert.deepEqual(contract.members.splitterPane.parts, ['pane']);
  assert.deepEqual(contract.members.splitterHandle.parts, ['handle']);
});

test('makes the handle the separator, and the only focusable part', () => {
  assert.equal(contract.role, 'separator');
  assert.deepEqual(contract.members.splitterHandle.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
  ]);
  assert.deepEqual(contract.members.splitterPane.states, ['default']);
});

test('measures the first pane as a percentage, arranged along one axis', () => {
  assert.deepEqual(contract.orientations, ['horizontal', 'vertical']);
  assert.deepEqual(contract.members.splitter.capabilities, ['orientation', 'measurement']);
  assert.deepEqual(contract.members.splitter.defaults, {
    orientation: 'horizontal',
    max: 100,
    min: 0,
    step: 5,
  });
  assert.equal(contract.unit, 'percent');
});

test('carries no attribute state: the position is a number, not a state', () => {
  assert.ok(!('stateAttributes' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['splitter']);
  assert.deepEqual(contract.scenarios.splitter, [
    'playground',
    'orientations',
    'keyboard',
    'composition',
  ]);
});
