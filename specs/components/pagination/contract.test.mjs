import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is a navigation region around a list of destinations', () => {
  assert.equal(contract.family, 'pagination');
  assert.deepEqual(Object.keys(contract.members), [
    'pagination',
    'paginationList',
    'paginationItem',
    'paginationPage',
    'paginationEllipsis',
  ]);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, m]) => [name, m.nativeElement]),
    ),
    {
      pagination: 'nav',
      paginationList: 'ul',
      paginationItem: 'li',
      paginationPage: 'button',
      paginationEllipsis: 'span',
    },
  );
});

test('is an unordered list, because the pages are siblings', () => {
  assert.equal(contract.members.paginationList.nativeElement, 'ul');
  assert.equal(contract.listReason, 'siblings');
});

test('marks the page the reader is on and the moves they cannot make', () => {
  assert.deepEqual(contract.members.paginationPage.capabilities, ['wiring', 'current', 'disabled']);
  assert.equal(contract.members.paginationPage.defaults.current, false);
  assert.equal(contract.members.paginationPage.defaults.disabled, false);
  assert.deepEqual(contract.stateAttributes, {
    current: 'data-current',
    disabled: 'data-disabled',
  });
});

test('gives the page control the states a control has', () => {
  assert.deepEqual(contract.members.paginationPage.states, [
    'default',
    'hover',
    'active',
    'focus-visible',
    'current',
    'disabled',
  ]);
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['pagination']);
  assert.deepEqual(contract.scenarios.pagination, [
    'playground',
    'current',
    'composition',
    'accessibility',
  ]);
});
