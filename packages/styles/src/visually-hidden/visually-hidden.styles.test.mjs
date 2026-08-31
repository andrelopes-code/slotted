import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./visually-hidden.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('hides the element without removing it from the accessibility tree', () => {
  assert.ok(normalized.includes('clip-path:inset(50%)'), 'Missing the clipping rule');
  assert.ok(normalized.includes('position:absolute'), 'Missing the removal from flow');
  assert.ok(
    !/display:\s*none/.test(declarations),
    'display: none would hide it from assistive technology',
  );
  assert.ok(
    !/visibility:\s*hidden/.test(declarations),
    'visibility: hidden would hide it from assistive technology',
  );
});

test('reveals the focusable variant while focus is inside', () => {
  assert.ok(
    normalized.includes('.slotted-visually-hidden[data-focusable]:not(:focus-within)'),
    'The focusable variant must stop matching the hiding rule once focus is inside',
  );
  assert.ok(
    normalized.includes('.slotted-visually-hidden:not([data-focusable])'),
    'The default variant stays hidden whether or not it holds focus',
  );
});
