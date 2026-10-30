import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./select.css', import.meta.url), 'utf8');
const normalized = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1');

/** The declarations of every rule whose selector list holds `selector`. */
function declarationsFor(selector) {
  return [...normalized.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => selectors.split(',').some((one) => one.trim() === selector))
    .map(([, , body]) => body)
    .join(';');
}

/**
 * A filtered option and an emptied group are hidden with the `hidden`
 * attribute — Angular hides every option the query rejects, and both bindings
 * hide a group whose options all went. The sheet sets `display: grid` on both,
 * and an author rule beats the user agent's `[hidden] { display: none }`, so
 * without these rules the search filtered nothing anyone could see.
 */
test('takes a hidden option and a hidden group out of the list', () => {
  for (const part of ['item', 'group']) {
    const selector = `[data-ui-select] [data-part-${part.toLowerCase()}][hidden]`;
    assert.match(declarationsFor(selector), /display:none/, `${part}[hidden] is still drawn`);
  }
});
