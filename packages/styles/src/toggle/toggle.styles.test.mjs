import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./toggle.css', import.meta.url), 'utf8');

test('hands its glyph size to whatever the icon slot holds', () => {
  // A glyph host such as `ng-icon` sizes itself at `1em`, and an icon box
  // reads `--slotted-icon-size`: the slot declares both, so nothing placed in
  // it is drawn at the control's font-size.
  const rule = css.match(/\[data-ui-toggle\] \[data-part-icon\] \{([^}]*)\}/)?.[1] ?? '';
  assert.match(rule, /--slotted-icon-size: var\(--_icon-size\)/);
  assert.match(rule, /font-size: var\(--_icon-size\)/);
});
