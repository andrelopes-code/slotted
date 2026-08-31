import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/skeleton/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./skeleton.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('shapes every axis value the contract names', () => {
  for (const shape of contract.axes.shape) {
    assert.ok(
      normalized.includes(`.slotted-skeleton[data-shape='${shape}']`),
      `Missing shape ${shape}`,
    );
  }
});

test('pulses opacity rather than sliding a gradient across', () => {
  assert.ok(normalized.includes('@keyframesslotted-skeleton-pulse'), 'Missing the animation');
  assert.ok(
    /@keyframesslotted-skeleton-pulse\{50%\{opacity:/.test(normalized),
    'A gradient sweep would need a second colour the theme does not own',
  );
});

test('stops the animation outright under reduced motion', () => {
  assert.ok(
    /@media\(prefers-reduced-motion:reduce\)\{\.slotted-skeleton\{animation:none/.test(normalized),
    'A placeholder reports through its shape, which survives the animation stopping',
  );
});

test('documents exactly the public custom properties the stylesheet reads', () => {
  const declared = JSON.parse(
    readFileSync(new URL('./skeleton.tokens.json', import.meta.url), 'utf8'),
  );
  const referenced = [
    ...new Set([...css.matchAll(/var\((--slotted-[a-z0-9-]+)/g)].map(([, token]) => token)),
  ].sort();
  assert.deepEqual(declared, referenced);
});
