import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(new URL('../../../../specs/components/link/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./link.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('answers every underline value the contract names', () => {
  for (const underline of contract.axes.underline) {
    const styled =
      underline === 'always'
        ? normalized.includes('.slotted-link{')
        : normalized.includes(`.slotted-link[data-underline='${underline}']`);
    assert.ok(styled, `Missing underline ${underline}`);
  }
});

test('reacts to every pseudo-state the contract declares', () => {
  for (const state of contract.members.link.states) {
    if (state === 'default') continue;
    assert.ok(normalized.includes(`.slotted-link:${state}`), `Missing state ${state}`);
  }
});

test('restores the underline under forced colours', () => {
  assert.ok(normalized.includes('@media(forced-colors:active)'), 'Missing the query');
  assert.ok(
    /@media\(forced-colors:active\)\{\.slotted-link\{text-decoration-line:underline/.test(
      normalized,
    ),
    'A link with no underline is unrecognizable once the palette flattens colour',
  );
});
