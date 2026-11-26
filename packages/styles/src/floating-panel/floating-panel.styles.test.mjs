import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./floating-panel.css', import.meta.url), 'utf8');
const normalized = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1');

/**
 * Angular keeps a closed panel in the document with the `hidden` attribute.
 * The root sets `display: flex`, and an author rule beats the user agent's
 * `[hidden] { display: none }`, so the sheet must take a hidden root out.
 */
test('takes a closed panel out of the page', () => {
  assert.match(declarationsFor('[data-ui-floating-panel][data-part-root][hidden]'), /display:none/);
});

/** The declarations of every rule whose selector list holds `selector`. */
function declarationsFor(selector) {
  return [...normalized.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => selectors.split(',').some((one) => one.trim() === selector))
    .map(([, , body]) => body)
    .join(';');
}
