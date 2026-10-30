import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./menu.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const dense = declarations.replace(/\s+/g, '');

test('hands its glyph size to an icon placed in the mark column', () => {
  // The icon family reads `--slotted-icon-size` from its container, and a
  // glyph host such as `ng-icon` sizes itself at `1em`. A mark column that
  // sizes only its own box leaves both at the item's type size.
  const rule = dense.split(`[data-ui-menu][data-part-icon]{`)[1]?.split('}')[0] ?? '';
  assert.ok(rule.includes('--slotted-icon-size:var(--_icon-size)'));
  // The font-size sits on the child: the box's `1lh` reads the item's line box.
  assert.ok(!rule.includes('font-size:'));
  const child = dense.split(`[data-ui-menu][data-part-icon]>*{`)[1]?.split('}')[0] ?? '';
  assert.ok(child.includes('font-size:var(--_icon-size)'));
  /* The icon is content, never a mask the stylesheet fills from a property. */
  assert.ok(!rule.includes('mask'));
  assert.ok(!/--slotted-menu-item-icon/.test(declarations));
});

/**
 * The check, the dot and the submenu chevron are Glyph elements the bindings
 * render; the sheet sizes their boxes and paints none of them.
 */
test('paints no mark of its own', () => {
  assert.ok(!/--slotted-icon-(check|dot|chevron-right)\b/.test(declarations));
  assert.ok(!dense.includes("[aria-haspopup='menu']::after"));
  const indicator = dense.split(`[data-ui-menu][data-part-indicator]{`)[1]?.split('}')[0] ?? '';
  assert.ok(indicator.includes('--slotted-icon-size:var(--_icon-size)'));
  assert.ok(!indicator.includes('mask'));
  /* The last rule for the box: the first is the line-box rule it shares with the column. */
  const chevron =
    dense
      .split(`[data-ui-menu][data-part-item][aria-haspopup='menu']>[data-ui-icon]{`)
      .at(-1)
      ?.split('}')[0] ?? '';
  assert.ok(chevron.includes('grid-column:4'));
});
