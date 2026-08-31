import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/input/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./input.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

const rule = (selector) => collapsed.split(`${selector} {`)[1]?.split('}')[0];

test('lives in the component layer and styles the one part it has', () => {
  assert.match(css, /@layer slotted\.components/);
  assert.deepEqual(contract.members.input.parts, ['root']);
  assert.ok(normalized.includes('.slotted-input{'));
});

test('answers every size the contract names', () => {
  for (const size of contract.axes.size) {
    assert.ok(normalized.includes(`.slotted-input[data-size='${size}']`), `Missing size ${size}`);
  }
});

test('answers every state the contract declares, on the control itself', () => {
  assert.equal(contract.mirrorsState, true);
  for (const state of contract.members.input.states) {
    if (state === 'default') continue;
    const selector = contract.stateAttributes[state]
      ? `.slotted-input[${contract.stateAttributes[state]}]`
      : `.slotted-input:${state}`;
    assert.ok(normalized.includes(selector), `Missing state ${state}`);
  }
});

test('never reaches for the field, so a control outside one looks the same', () => {
  assert.ok(
    !normalized.includes('.slotted-field'),
    'A descendant selector would make the field’s DOM part of this stylesheet’s contract',
  );
});

test('holds the hover rule back for a disabled or read-only control', () => {
  assert.ok(
    normalized.includes('.slotted-input:hover:not([data-disabled]):not([data-readonly])'),
    'A control that cannot be edited should not invite the pointer',
  );
});

test('lets the error outrank the pointer, by writing it afterwards', () => {
  const hover = declarations.indexOf(':hover');
  const invalid = declarations.indexOf('[data-invalid]');
  assert.ok(
    hover !== -1 && invalid > hover,
    'A field reporting an error should not stop looking wrong because the pointer is over it',
  );
});

test('sizes the control in the block axis, never with a physical height', () => {
  for (const size of contract.axes.size) {
    const declaration = rule(`.slotted-input[data-size='${size}']`);
    assert.ok(declaration?.includes('block-size:'), `Missing block size for ${size}`);
    assert.ok(declaration?.includes('padding-inline:'), `Missing inline padding for ${size}`);
  }
});
