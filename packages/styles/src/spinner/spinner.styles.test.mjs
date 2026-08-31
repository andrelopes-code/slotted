import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/spinner/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./spinner.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('sizes every axis value the contract names', () => {
  for (const size of contract.axes.size) {
    assert.ok(normalized.includes(`.slotted-spinner[data-size='${size}']`), `Missing size ${size}`);
  }
});

test('styles the indicator part and leaves the label to the shared primitive', () => {
  assert.ok(normalized.includes("[data-part='indicator']"), 'Missing the indicator part');
  assert.ok(
    !normalized.includes("[data-part='label']"),
    'The label is hidden by visually-hidden.css, so a second rule here would drift from it',
  );
});

test('takes its colour from the text it accompanies', () => {
  assert.ok(normalized.includes('solidcurrentColor'), 'The ring should be painted in currentColor');
});

test('slows the animation rather than stopping it under reduced motion', () => {
  assert.ok(normalized.includes('@media(prefers-reduced-motion:reduce)'), 'Missing the query');
  assert.ok(
    /animation-duration:var\(--slotted-spinner-reduced-motion-duration/.test(normalized),
    'Reduced motion should slow the ring, since a frozen spinner reports nothing',
  );
});

test('uses logical properties, so a right-to-left document needs no second sheet', () => {
  for (const physical of ['width:', 'height:', 'left:', 'right:']) {
    assert.ok(!normalized.includes(physical), `Found the physical property ${physical}`);
  }
});

test('documents exactly the public custom properties the stylesheet reads', () => {
  const declared = JSON.parse(
    readFileSync(new URL('./spinner.tokens.json', import.meta.url), 'utf8'),
  );
  const referenced = [
    ...new Set([...css.matchAll(/var\((--slotted-[a-z0-9-]+)/g)].map(([, token]) => token)),
  ].sort();
  assert.deepEqual(declared, referenced);
});
