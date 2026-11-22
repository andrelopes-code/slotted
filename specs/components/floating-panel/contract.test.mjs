import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.floatingPanel;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'floating-panel');
  assert.equal(contract.ui, 'floating-panel');
});

/** It holds nobody: a named region, never a dialog, with nothing on the page made inert. */
test('is a non-modal region rather than a dialog', () => {
  assert.equal(contract.rootRole, 'region');
  assert.equal(contract.modal, false);
  assert.match(contract.dismiss, /focus returns/);
});

test('is moved by a handle that holds a grip, and stays in the viewport', () => {
  assert.deepEqual(member.parts, ['root', 'handle', 'grip', 'title', 'close', 'body']);
  assert.match(contract.placement, /clamps/);
  assert.deepEqual(contract.messages, ['close', 'move']);
});
