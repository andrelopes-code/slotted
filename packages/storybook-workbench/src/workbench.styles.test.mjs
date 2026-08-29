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
