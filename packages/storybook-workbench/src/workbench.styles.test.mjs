import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('./workbench.css', import.meta.url), 'utf8');

test('workbench CSS keeps the reference-sheet layout and accessibility invariants', () => {
  assert.match(css, /@import '@fontsource-variable\/inter';/);
  assert.match(css, /@import '@fontsource-variable\/jetbrains-mono';/);
  assert.match(css, /max-inline-size:\s*1480px/);
  assert.match(css, /\.slotted-matrix-scroll\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(css, /@media \(max-width:\s*760px\)/);
  assert.match(css, /\.slotted-code-drawer summary:focus-visible/);
  assert.match(css, /\[data-slotted-scheme='dark'\]\s*\{/);
  assert.match(css, /\.slotted-visually-hidden\s*\{[\s\S]*?clip-path:\s*inset\(50%\)/);
  assert.match(
    css,
    /\.slotted-matrix-scroll:focus-visible,[\s\S]*?\.slotted-token-scroll:focus-visible\s*\{/,
  );
});

test('workbench CSS composes demonstrations as a continuous component lab', () => {
  assert.match(
    css,
    /\.slotted-component-lab\s*\{[\s\S]*?border:\s*1px solid var\(--slotted-workbench-border\)/,
  );
  assert.match(
    css,
    /\.slotted-component-lab__section\s*\{[\s\S]*?grid-template-columns:\s*minmax\(150px, 0\.24fr\) minmax\(0, 1fr\)/,
  );
  assert.match(
    css,
    /\.slotted-demo-grid\s*\{[\s\S]*?display:\s*grid[\s\S]*?gap:\s*var\(--slotted-workbench-scene-gap\)/,
  );
  assert.match(css, /\.slotted-demo-row\s*\{[\s\S]*?align-items:\s*center/);
  assert.match(css, /\.slotted-demo-scene__label\s*\{[\s\S]*?font-weight:\s*700/);
});

test('workbench CSS gives matrices stable geometry and centered non-empty cells', () => {
  assert.match(css, /\.slotted-matrix\s*\{[\s\S]*?inline-size:\s*100%/);
  assert.match(css, /\.slotted-matrix__cell\s*\{[\s\S]*?text-align:\s*center/);
  assert.match(css, /\.slotted-matrix__cell\s*>\s*\*\s*\{[\s\S]*?vertical-align:\s*middle/);
});

test('workbench does not own icon glyph data', () => {
  assert.doesNotMatch(css, /slotted-demo-icon|mask-image:\s*url\(["']data:image\/svg\+xml/);
});

test('embedded docs canvases do not become empty viewport-height demonstrations', () => {
  assert.match(
    css,
    /\.slotted-workbench-preview--embedded\s*\{[\s\S]*?background:\s*transparent;[\s\S]*?min-block-size:\s*0;[\s\S]*?padding:\s*0;/,
  );
  assert.match(
    css,
    /@media \(max-width:\s*760px\)\s*\{[\s\S]*?\.slotted-workbench-preview:not\(\.slotted-workbench-preview--embedded\)\s*\{[\s\S]*?padding:\s*12px;/,
  );
});
