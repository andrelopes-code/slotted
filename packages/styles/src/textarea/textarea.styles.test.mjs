import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/textarea/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./textarea.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

const rule = (selector) => collapsed.split(`${selector} {`)[1]?.split('}')[0];

test('lives in the component layer and styles the one part it has', () => {
  assert.match(css, /@layer slotted\.components/);
  assert.deepEqual(contract.members.textarea.parts, ['root']);
  assert.ok(normalized.includes('.slotted-textarea{'));
});

test('answers every size the contract names', () => {
  for (const size of contract.axes.size) {
    assert.ok(normalized.includes(`.slotted-textarea[data-size='${size}']`), `Missing ${size}`);
  }
});

test('answers every state the contract declares, on the control itself', () => {
  assert.equal(contract.mirrorsState, true);
  for (const state of contract.members.textarea.states) {
    if (state === 'default') continue;
    const selector = contract.stateAttributes[state]
      ? `.slotted-textarea[${contract.stateAttributes[state]}]`
      : `.slotted-textarea:${state}`;
    assert.ok(normalized.includes(selector), `Missing state ${state}`);
  }
});

test('never reaches for the field, or for the single-line control', () => {
  for (const foreign of ['.slotted-field', '.slotted-input']) {
    assert.ok(
      !normalized.includes(foreign),
      `${foreign} would make another family's DOM part of this stylesheet's contract`,
    );
  }
});

test('grows with its content through the platform, not through measurement', () => {
  assert.equal(contract.autoSizeMechanism, 'field-sizing');
  const auto = rule('.slotted-textarea[data-auto-size]');
  assert.ok(auto?.includes('field-sizing: content'), 'The platform answers this itself now');
  assert.ok(
    auto?.includes('max-block-size:'),
    'A control that grows without limit eventually fills the page',
  );
});

test('withdraws the resize handle wherever the size is not the reader’s to set', () => {
  for (const selector of [
    '.slotted-textarea[data-auto-size]',
    '.slotted-textarea[data-disabled]',
  ]) {
    assert.ok(rule(selector)?.includes('resize: none'), `Missing resize: none on ${selector}`);
  }
});

test('offers the handle in the block axis, which is the one that has room', () => {
  assert.ok(rule('.slotted-textarea')?.includes('resize: var(--slotted-textarea-resize, block)'));
});

test('lets the error outrank the pointer, by writing it afterwards', () => {
  const hover = declarations.indexOf(':hover');
  const invalid = declarations.indexOf('[data-invalid]');
  assert.ok(hover !== -1 && invalid > hover, 'An error should survive the pointer being over it');
});
