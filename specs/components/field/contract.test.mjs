import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('defines the ordered field family structure', () => {
  assert.equal(contract.family, 'field');
  assert.deepEqual(Object.keys(contract.members), [
    'field',
    'fieldLabel',
    'fieldDescription',
    'fieldError',
    'fieldControl',
  ]);
  assert.ok(!('axes' in contract), 'the field family has no appearance axes');
});

test('gives each member its native element and parts', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, member]) => [name, member.nativeElement]),
    ),
    {
      field: 'div',
      fieldLabel: 'label',
      fieldDescription: 'p',
      fieldError: 'p',
      fieldControl: 'input',
    },
  );
  assert.deepEqual(contract.members.field.parts, ['root']);
});

test('carries the field state vocabulary on the root only', () => {
  assert.deepEqual(contract.members.field.states, [
    'default',
    'disabled',
    'invalid',
    'required',
    'readonly',
  ]);
  assert.deepEqual(contract.stateAttributes, {
    disabled: 'data-disabled',
    invalid: 'data-invalid',
    required: 'data-required',
    readonly: 'data-readonly',
  });
  for (const name of ['fieldLabel', 'fieldDescription', 'fieldError', 'fieldControl']) {
    assert.deepEqual(contract.members[name].states, ['default'], name);
  }
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['field']);
  assert.deepEqual(contract.scenarios.field, [
    'playground',
    'states',
    'description',
    'error',
    'accessibility',
  ]);
});
