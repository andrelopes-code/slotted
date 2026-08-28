import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/button/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./button.css', import.meta.url), 'utf8');

test('implements every contract state in framework-owned CSS', () => {
  const selectors = {
    default: '.slotted-button {',
    hover: ".slotted-button[data-variant='solid']:hover:not(:disabled)",
    active: ".slotted-button[data-variant='solid']:active:not(:disabled)",
    'focus-visible': '.slotted-button:focus-visible',
    disabled: '.slotted-button:disabled',
  };

  assert.deepEqual(Object.keys(selectors).sort(), [...contract.states].sort());
  for (const selector of Object.values(selectors)) {
    assert.ok(css.includes(selector), `Missing state selector: ${selector}`);
  }
});
