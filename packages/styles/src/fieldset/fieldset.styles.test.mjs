import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/fieldset/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./fieldset.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

const rule = (selector) => collapsed.split(`${selector} {`)[1]?.split('}')[0];

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  assert.ok(normalized.includes('.slotted-fieldset{'));
  assert.ok(normalized.includes("[data-part='legend']"), 'Missing part legend');
});

test('resets what a fieldset carries before drawing anything', () => {
  const root = rule('.slotted-fieldset');
  for (const reset of ['border: 0', 'margin: 0', 'padding: 0', 'min-inline-size: 0']) {
    assert.ok(root?.includes(reset), `Missing reset ${reset}`);
  }
});

test('puts the legend back into the layout the browser takes it out of', () => {
  const legend = rule(".slotted-fieldset [data-part='legend']");
  assert.ok(legend?.includes('float: none'), 'A legend floats out of the fieldset by default');
  assert.ok(legend?.includes('display: block'));
});

test('answers every orientation the contract names', () => {
  for (const orientation of contract.axes.orientation) {
    assert.ok(
      normalized.includes(`.slotted-fieldset[data-orientation='${orientation}']`),
      `Missing orientation ${orientation}`,
    );
  }
});

test('answers every state the contract declares', () => {
  for (const state of contract.members.fieldset.states) {
    if (state === 'default') continue;
    assert.ok(
      normalized.includes(`.slotted-fieldset[${contract.stateAttributes[state]}]`),
      `Missing state ${state}`,
    );
  }
});

test('never reaches into the controls it groups', () => {
  assert.equal(contract.disabledMechanism, 'native');
  for (const foreign of ['.slotted-input', '.slotted-textarea', '.slotted-switch']) {
    assert.ok(
      !normalized.includes(foreign),
      `${foreign} is the platform's to disable, not this stylesheet's to restyle`,
    );
  }
  /** `.slotted-field` is a prefix of this family's own class, so it is matched
   * against the spaced text rather than the normalised one. */
  for (const foreign of ['.slotted-field ', '.slotted-field[', '.slotted-field.']) {
    assert.ok(!collapsed.includes(foreign), `${foreign} belongs to another family`);
  }
});
