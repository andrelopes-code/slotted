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
  const requiredStates = new Set(
    Object.values(contract.members).flatMap((member) => member.states),
  );
  const selectors = {
    default: '.slotted-button {',
    hover: ":hover:not(:disabled):not([aria-disabled='true'])",
    active: ":active:not(:disabled):not([aria-disabled='true'])",
    'focus-visible': '.slotted-button:focus-visible',
    disabled: "[data-state='disabled']",
    loading: "[data-state='loading']",
    pressed: "[data-state='pressed']",
  };

  assert.deepEqual(new Set(Object.keys(selectors)), requiredStates);
  for (const selector of Object.values(selectors)) {
    assert.ok(css.includes(selector), `Missing state selector: ${selector}`);
  }

  for (const tone of contract.axes.tone) {
    assert.ok(css.includes(`[data-tone='${tone}']`), `Missing tone: ${tone}`);
  }
  for (const variant of contract.axes.variant) {
    assert.ok(css.includes(`[data-variant='${variant}']`), `Missing variant: ${variant}`);
  }
  for (const size of contract.axes.size) {
    assert.ok(css.includes(`[data-size='${size}']`), `Missing size: ${size}`);
  }
  assert.ok(css.includes('--slotted-control-radius'), 'Missing control radius token');
});

test('styles button group seams and focus layering with logical properties', () => {
  const selectors = [
    '.slotted-button-group {',
    ".slotted-button-group[data-orientation='horizontal'] > .slotted-button:not(:first-child)",
    ".slotted-button-group[data-orientation='vertical'] > .slotted-button:not(:first-child)",
    '.slotted-button-group > .slotted-button:focus-visible',
  ];

  for (const selector of selectors) {
    assert.ok(css.includes(selector), `Missing group selector: ${selector}`);
  }
  assert.ok(css.includes('margin-inline-start: var(--slotted-button-group-adjacent-offset, -1px)'));
  assert.ok(css.includes('margin-block-start: var(--slotted-button-group-adjacent-offset, -1px)'));
  assert.ok(css.includes('var(--slotted-button-group-inner-radius, 0px)'));
});
