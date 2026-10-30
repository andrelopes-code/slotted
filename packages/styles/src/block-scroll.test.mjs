import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * A body that scrolls a column of content scrolls on the block axis only. An
 * `auto` inline axis drew a horizontal bar whenever a row stood wider than the
 * body: for the length of the app-shell navigation's width transition, and for
 * any wide child of a panel. Wide content brings its own scroller (`table`,
 * `data-grid`, `scroll-area`), so the body hides its inline axis.
 */
const BODIES = [
  ['app-shell/app-shell.css', '[data-ui-app-shell] > [data-part-nav] > [data-part-nav-body] {'],
  ['app-shell/app-shell.css', '[data-ui-app-shell] > [data-part-aside] > [data-part-aside-body] {'],
  ['drawer/drawer.css', '[data-ui-drawer] > [data-part-panel] > [data-part-body] {'],
  [
    'dialog/dialog.css',
    '[data-ui-dialog] > [data-part-viewport] > [data-part-content] > [data-part-body] {',
  ],
  ['popover/popover.css', '[data-ui-popover] > [data-part-content] > [data-part-body] {'],
  ['tour/tour.css', '[data-ui-tour] [data-part-content] > [data-part-body] {'],
];

function body(path, selector) {
  const css = readFileSync(new URL(path, import.meta.url), 'utf8');
  const at = css.indexOf(selector);
  assert.notEqual(at, -1, `${path}: no rule for ${selector}`);
  const open = css.indexOf('{', at);
  return css.slice(open, css.indexOf('\n  }', open));
}

test('scrolls each column body on the block axis and hides its inline axis', () => {
  for (const [path, selector] of BODIES) {
    const rule = body(path, selector);
    assert.doesNotMatch(rule, /(^|\s)overflow:/, `${selector} sets both axes at once`);
    assert.match(rule, /overflow-x:\s*hidden/, `${selector} scrolls sideways`);
    assert.match(rule, /overflow-y:\s*auto/, `${selector} does not scroll`);
    assert.match(rule, /overflow-inline:\s*hidden/, `${selector} scrolls sideways`);
    assert.match(rule, /overflow-block:\s*auto/, `${selector} does not scroll`);
  }
});
