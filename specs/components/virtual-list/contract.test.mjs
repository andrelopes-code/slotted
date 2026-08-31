import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('holds the scrolling list and the row it places', () => {
  assert.equal(contract.family, 'virtual-list');
  assert.deepEqual(Object.keys(contract.members), ['virtualList', 'virtualListItem']);
});

test('gives each member its native element and parts', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, member]) => [name, member.nativeElement]),
    ),
    { virtualList: 'div', virtualListItem: 'div' },
  );
  assert.deepEqual(contract.members.virtualList.parts, ['root', 'canvas']);
  assert.deepEqual(contract.members.virtualListItem.parts, ['item']);
});

test('is a list of listitems, and the canvas between them owns nothing', () => {
  assert.equal(contract.role, 'list');
  assert.equal(contract.itemRole, 'listitem');
  assert.equal(
    contract.canvasRole,
    'none',
    'A generic element between a list and its items breaks ownership',
  );
});

test('reports the whole list rather than the window it renders', () => {
  assert.deepEqual(contract.setSemantics, ['aria-setsize', 'aria-posinset']);
});

test('scrolls in the block axis only', () => {
  assert.equal(contract.axis, 'block');
});

test('makes the scroll container focusable, and gives it a focus state', () => {
  assert.equal(
    contract.focusable,
    'root',
    'A scrollable region with no focusable element cannot be scrolled by keyboard',
  );
  assert.deepEqual(contract.members.virtualList.states, ['default', 'focus-visible']);
  assert.deepEqual(contract.members.virtualListItem.states, ['default']);
});

test('binds no keys: the platform already scrolls a focused container', () => {
  assert.deepEqual(contract.keys, []);
});

test('takes the row count and the row size, and buffers four rows either side', () => {
  assert.deepEqual(contract.members.virtualList.capabilities, ['virtualization']);
  assert.deepEqual(contract.members.virtualList.defaults, { overscan: 4 });
  assert.deepEqual(
    contract.required,
    ['itemCount', 'itemSize'],
    'Neither the length nor the row size can be guessed',
  );
});

test('leaves the row nothing to configure but its own content', () => {
  assert.deepEqual(contract.members.virtualListItem.capabilities, ['wiring']);
  assert.deepEqual(contract.members.virtualListItem.defaults, {});
});

test('carries no attribute state: a window position is a number, not a state', () => {
  assert.ok(!('stateAttributes' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['virtualList']);
  assert.deepEqual(contract.scenarios.virtualList, [
    'playground',
    'scale',
    'accessibility',
    'composition',
  ]);
});
