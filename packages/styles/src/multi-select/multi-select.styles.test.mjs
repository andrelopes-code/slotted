import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./multi-select.css', import.meta.url), 'utf8');
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
    const selector = `[data-ui-multi-select] [data-part-${part.toLowerCase()}][hidden]`;
    assert.match(declarationsFor(selector), /display:none/, `${part}[hidden] is still drawn`);
  }
});

/**
 * Under 120 pixels the counter, the clear button and the trigger share the
 * frame. At 112 pixels they needed 127 and the trigger ran 15 pixels past the
 * border, so the chevron was cut. The counter gives way instead: it shrinks
 * and ends in an ellipsis, and the grid's aria-label still carries the count.
 */
test('lets the counter shrink so the buttons stay inside a narrow frame', () => {
  const rules = declarationsFor('[data-ui-multi-select] > [data-part-counter]');
  assert.match(rules, /flex:0 1 auto/, 'the counter does not shrink');
  assert.match(rules, /min-inline-size:0/, 'the counter keeps its content width');
  assert.match(rules, /overflow:hidden/, 'the counter draws past its box');
  assert.match(rules, /text-overflow:ellipsis/, 'a cut counter gives no sign of it');
  const row = declarationsFor('[data-ui-multi-select][data-narrow] > [data-part-control]');
  assert.match(row, /flex-basis:0/, 'the empty row takes room the count needs');
});
