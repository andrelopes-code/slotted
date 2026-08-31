import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('is the grouping element the platform already has, and its legend', () => {
  assert.equal(contract.family, 'fieldset');
  assert.deepEqual(Object.keys(contract.members), ['fieldset', 'fieldsetLegend']);
  assert.equal(contract.members.fieldset.nativeElement, 'fieldset');
  assert.equal(contract.members.fieldsetLegend.nativeElement, 'legend');
  assert.deepEqual(contract.members.fieldset.parts, ['root']);
  assert.deepEqual(contract.members.fieldsetLegend.parts, ['legend']);
});

test('names the group with the legend, and adds no ARIA to do it', () => {
  assert.equal(contract.role, 'group');
  assert.equal(
    contract.roleSource,
    'native',
    'A fieldset is already a group and a legend already names it',
  );
  assert.deepEqual(contract.aria, []);
});

test('disables its contents through the platform, not through context', () => {
  assert.equal(
    contract.disabledMechanism,
    'native',
    'A disabled fieldset disables every control inside it, which no context has to reproduce',
  );
  assert.equal(contract.stateAttributes.disabled, 'data-disabled');
});

test('arranges the fields it groups along one axis', () => {
  assert.deepEqual(contract.axes.orientation, ['vertical', 'horizontal']);
  assert.equal(contract.members.fieldset.defaults.orientation, 'vertical');
});

test('carries the states a group can be in, and not the ones a control can', () => {
  assert.deepEqual(contract.members.fieldset.states, ['default', 'disabled', 'invalid']);
  assert.deepEqual(Object.keys(contract.stateAttributes), ['disabled', 'invalid']);
  assert.ok(
    !contract.members.fieldset.capabilities.includes('readOnly'),
    'Read-only belongs to a control, not to the box around several of them',
  );
});

test('reads no field: it groups fields rather than sitting inside one', () => {
  assert.ok(!('stateSource' in contract));
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['fieldset']);
  assert.deepEqual(contract.scenarios.fieldset, [
    'playground',
    'orientations',
    'states',
    'composition',
  ]);
});
