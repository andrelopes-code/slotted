import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./popover.css', import.meta.url), 'utf8');

/** The body of the first rule whose selector matches, comments and all. */
function rule(selector) {
  const at = css.indexOf(selector);
  assert.notEqual(at, -1, `no rule for ${selector}`);
  const open = css.indexOf('{', at);
  const close = css.indexOf('\n  }', open);
  return css.slice(open, close);
}

/**
 * The body paints an opaque cover at each of its ends — the scroll shadow's
 * two `local` layers — and a child's background is not clipped by its
 * parent's radius unless the parent clips. A popover with no footer drew its
 * body's square corners over the panel's rounded ones, and the capture read
 * as a panel rounded at the top alone. `clip` rather than `hidden`, so the
 * panel itself is no scroll container: only the body scrolls, and a focus
 * moving inside it cannot drag the panel off its own frame.
 */
test('clips the panel at its radius, so the scrolling body keeps the corners', () => {
  const content = rule('[data-ui-popover] > [data-part-content] {');
  assert.match(content, /border-radius:\s*var\(--_radius\)/);
  assert.match(content, /overflow:\s*clip/);
  assert.doesNotMatch(content, /overflow:\s*hidden/);
});

/**
 * The panel's three rows are the header's, the body's and the footer's, and
 * only the body's is bounded. A consumer's own composition — a notification
 * centre, an inline command palette — stands as the panel's one child, and as
 * an auto row it grew past the room the positioner reported, clipped at the
 * panel's edge with its own footer out of sight. The one child takes the
 * body's row instead: bounded, with the family inside it scrolling what it
 * owns. Two children or more are the consumer's own layout and keep auto rows.
 */
test('bounds a lone composition to the body row', () => {
  const lone = rule(
    '> :only-child:not([data-part-header], [data-part-body], [data-part-footer]) {',
  );
  assert.match(lone, /grid-row:\s*2/);
  assert.match(lone, /min-block-size:\s*0/);
});
