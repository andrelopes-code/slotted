import assert from 'node:assert/strict';

export const SCHEMA_VERSION = 4;

export const PSEUDO_STATES = ['default', 'hover', 'active', 'focus-visible'];

export const STATE_ATTRIBUTES = {
  disabled: 'data-disabled',
  loading: 'data-loading',
  pressed: 'data-pressed',
  invalid: 'data-invalid',
  required: 'data-required',
  readonly: 'data-readonly',
};

export const ATTRIBUTE_STATES = Object.keys(STATE_ATTRIBUTES);

export const KNOWN_CAPABILITIES = [
  'appearance',
  'content',
  'fullWidth',
  'disabled',
  'loading',
  'pressed',
  'orientation',
  'invalid',
  'required',
  'readOnly',
  'wiring',
];

function assertUnique(values, label) {
  const duplicates = [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
  assert.deepEqual(duplicates, [], `${label} repeats ${duplicates.join(', ')}`);
}

export function assertContractShape(contract) {
  assert.equal(contract.schemaVersion, SCHEMA_VERSION, 'schemaVersion');
  assert.ok(
    typeof contract.family === 'string' && contract.family.length > 0,
    'family must be a non-empty string',
  );

  const memberNames = Object.keys(contract.members ?? {});
  assert.ok(memberNames.length > 0, 'contract declares no members');

  const declaredStates = new Set();
  for (const [name, member] of Object.entries(contract.members)) {
    for (const field of ['nativeElement', 'defaults', 'capabilities', 'states', 'parts']) {
      assert.ok(field in member, `${name} is missing ${field}`);
    }
    assertUnique(member.capabilities, `${name} capabilities`);
    assertUnique(member.states, `${name} states`);
    assertUnique(member.parts, `${name} parts`);

    for (const capability of member.capabilities) {
      assert.ok(
        KNOWN_CAPABILITIES.includes(capability),
        `${name} unknown capability ${capability}`,
      );
    }
    for (const state of member.states) {
      assert.ok(
        PSEUDO_STATES.includes(state) || ATTRIBUTE_STATES.includes(state),
        `${name} unknown state ${state}`,
      );
      declaredStates.add(state);
    }
  }

  const stateAttributes = contract.stateAttributes ?? {};
  for (const state of declaredStates) {
    if (PSEUDO_STATES.includes(state)) {
      assert.ok(!(state in stateAttributes), `${state} must not declare an attribute`);
      continue;
    }
    assert.ok(state in stateAttributes, `${state} needs a declared attribute`);
  }
  for (const [state, attribute] of Object.entries(stateAttributes)) {
    assert.equal(attribute, STATE_ATTRIBUTES[state], `${state} disagrees with the vocabulary`);
    assert.ok(declaredStates.has(state), `${state} is declared but no member uses it`);
  }

  for (const [page, ids] of Object.entries(contract.scenarios ?? {})) {
    assert.ok(page === 'overview' || memberNames.includes(page), `scenario page ${page}`);
    assertUnique(ids, `scenario page ${page}`);
    assert.ok(ids.length > 0, `scenario page ${page} is empty`);
  }
}
