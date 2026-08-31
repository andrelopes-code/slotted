import assert from 'node:assert/strict';
import test from 'node:test';

import { assertContractShape, STATE_ATTRIBUTES } from './contract.schema.mjs';

const valid = {
  schemaVersion: 4,
  family: 'example',
  stateAttributes: { disabled: 'data-disabled' },
  members: {
    example: {
      nativeElement: 'div',
      defaults: {},
      capabilities: ['disabled'],
      states: ['default', 'disabled'],
      parts: ['root'],
    },
  },
  scenarios: { example: ['playground'] },
};

test('accepts a contract without appearance axes', () => {
  assert.doesNotThrow(() => assertContractShape(valid));
});

test('rejects an attribute-driven state with no declared attribute', () => {
  const contract = structuredClone(valid);
  contract.members.example.states.push('invalid');
  assert.throws(() => assertContractShape(contract), /invalid/);
});

test('rejects a pseudo-class state given an attribute', () => {
  const contract = structuredClone(valid);
  contract.stateAttributes.hover = 'data-hover';
  assert.throws(() => assertContractShape(contract), /hover/);
});

test('rejects a state attribute that disagrees with the shared vocabulary', () => {
  const contract = structuredClone(valid);
  contract.stateAttributes.disabled = 'data-off';
  assert.throws(() => assertContractShape(contract), /disabled/);
});

test('rejects a scenario page that names no member', () => {
  const contract = structuredClone(valid);
  contract.scenarios.ghost = ['playground'];
  assert.throws(() => assertContractShape(contract), /ghost/);
});

test('rejects duplicate scenario ids within a page', () => {
  const contract = structuredClone(valid);
  contract.scenarios.example = ['playground', 'playground'];
  assert.throws(() => assertContractShape(contract), /playground/);
});

test('carries the states Field introduces', () => {
  assert.equal(STATE_ATTRIBUTES.invalid, 'data-invalid');
  assert.equal(STATE_ATTRIBUTES.required, 'data-required');
  assert.equal(STATE_ATTRIBUTES.readonly, 'data-readonly');
});
