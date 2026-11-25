import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

/** Two modules, the rail and the frame of the surface. */
test('is no wider than two modules and the rail', () => {
  const { module, rail, widest } = contract.grid;

  assert.equal(rail + module * 2 + 2, widest);
  assert.ok(contract.grid.oneColumnBelow > widest);
});

/**
 * A draft is what lets a reader change both halves of a value and leave without
 * changing it: a press that wrote at once had nothing to go back to.
 */
test('writes nothing until Apply, and discards on the way out', () => {
  assert.deepEqual(contract.draft.discardedBy, ['Escape', 'outside press']);
  assert.ok(contract.members.pickerPanel.parts.includes('apply'));
});

test('speaks the reason Apply is off', () => {
  assert.match(contract.wiring.status, /status region/);
});
