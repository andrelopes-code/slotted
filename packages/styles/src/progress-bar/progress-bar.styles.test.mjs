import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/progress-bar/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./progress-bar.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

test('lives in the component layer and styles the indicator part', () => {
  assert.match(css, /@layer slotted\.components/);
  assert.ok(normalized.includes("[data-part='indicator']"), 'Missing the indicator part');
});

test('states every state the contract declares', () => {
  for (const attribute of Object.values(contract.stateAttributes)) {
    assert.ok(normalized.includes(`[${attribute}]`), `Missing ${attribute}`);
  }
});

test('starts at nothing, so a bar with no value paints no progress', () => {
  const indicator = collapsed
    .split(".slotted-progress-bar [data-part='indicator'] {")[1]
    ?.split('}')[0];
  assert.ok(indicator?.includes('inline-size: 0'), 'The indicator should start empty');
});

test('travels with a logical inset, so it runs the way the document reads', () => {
  assert.ok(
    normalized.includes('inset-inline-start:100%'),
    'A translation would run the same way in a right-to-left document',
  );
  assert.ok(!normalized.includes('translateX'), 'Found a physical translation');
});

test('slows the travel rather than stopping it under reduced motion', () => {
  assert.ok(
    /animation-duration:var\(--slotted-progress-bar-reduced-motion-duration/.test(normalized),
    'An indeterminate bar reports through motion and reports nothing once still',
  );
});
