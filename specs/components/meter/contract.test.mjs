import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.meter;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'meter');
  assert.equal(contract.ui, 'meter');
});

/**
 * A static value is a meter, never a progressbar: a test suite and a screen
 * reader that wait for "no progressbar" wait for ever on a page that draws a
 * share with one.
 */
test('is a meter, and a decorative one carries no role', () => {
  assert.equal(contract.rootRole, 'meter');
  assert.match(contract.decorative, /no role/);
  assert.ok(member.capabilities.includes('decorative'));
});

/** One continuous track and one indicator: no end mark, no gap, nothing that reads as a wait. */
test('draws a track and an indicator and nothing else', () => {
  assert.deepEqual(member.parts, ['root', 'track', 'indicator']);
});

test('holds no state a reader moves', () => {
  assert.equal(contract.stateModel, undefined);
  assert.deepEqual(member.states, ['default']);
});

test('reads its regions as the HTML meter element does', () => {
  assert.match(contract.regions, /optimum is success/);
  assert.ok(contract.axes.tone.includes('warning'));
});
