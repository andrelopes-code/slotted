import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * The fragment as its regular expressions read it: the selector keys the
 * stylesheet matches are left out, and every tag stands on one line, as it did
 * before the formatter wrapped the tags the keys made long.
 */
function withoutSelectorKeys(markup) {
  return markup
    .replace(/\s+data-(?:part|ui)-[a-z0-9-]+=""/g, '')
    .replace(/<[^<>]+>/g, (tag) => tag.replace(/\s+/g, ' ').replace(/ (\/?>)$/, '$1'));
}

const css = readFileSync(new URL('./command-palette.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const dense = declarations.replace(/\s+/g, '');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./command-palette.harness.html', import.meta.url), 'utf8'),
);

test('hands its glyph size to an icon placed in the first column', () => {
  // The icon family reads `--slotted-icon-size` from its container, and a
  // glyph host such as `ng-icon` sizes itself at `1em`. A column that sizes
  // only its own box leaves both at the row's type size.
  const rule = dense.split(`[data-ui-command-palette][data-part-icon]{`)[1]?.split('}')[0] ?? '';
  assert.ok(rule.includes('--slotted-icon-size:var(--_icon-size)'));
  // The font-size sits on the child: the box's `1lh` reads the item's line box.
  assert.ok(!rule.includes('font-size:'));
  const child =
    dense.split(`[data-ui-command-palette][data-part-icon]:not(:empty)>*{`)[1]?.split('}')[0] ?? '';
  assert.ok(child.includes('font-size:var(--_icon-size)'));
});

/**
 * The family's own marks — the search glyph, the clear cross, the chevron
 * between two pages and the one that says an item opens a page — are `Glyph`
 * elements the bindings render, the two chevrons in a `directional` box. The
 * sheet sizes their boxes and paints none of them, and no family hook swaps
 * one from CSS.
 */
test('draws its own marks as Glyph elements, never from the stylesheet', () => {
  assert.doesNotMatch(
    dense,
    /-icon[,)]|::before\{[^}]*mask|\[data-part-(search|arrow|icon)\]\{[^}]*mask/,
  );
  assert.match(dense, /\[data-part-search]\{--slotted-icon-size:var\(--_header-icon-size\)/);
  assert.match(dense, /\[data-part-arrow]\{--slotted-icon-size:var\(--_icon-size\)/);
  const drawn = (part, glyph) =>
    new RegExp(
      `data-part="${part}"[^>]*>\\s*<span data-ui="icon" data-part="root"${
        glyph === 'chevron-right' ? ' data-directional=""' : ''
      } aria-hidden="true"\\s*>\\s*<svg data-part="glyph" data-glyph="${glyph}"`,
      'g',
    );
  for (const [part, glyph] of [
    ['search', 'search'],
    ['clear', 'x'],
    ['arrow', 'chevron-right'],
  ]) {
    const written = (fragment.match(new RegExp(`data-part="${part}"`, 'g')) ?? []).length;
    assert.ok(written > 0, `no ${part} in the fragment`);
    assert.equal(
      (fragment.match(drawn(part, glyph)) ?? []).length,
      written,
      `${part} draws ${glyph}`,
    );
  }
});

/**
 * The dialog closes on Escape and on the scrim. A palette that has taken the
 * whole screen has no scrim, and a touch screen has no Escape: the way out is
 * a word at the end of the field, drawn only under the dialog's full-screen
 * query. And where the primary input is touch, the footer's key legends name
 * nothing the reader can press.
 */
test('draws the way out where the scrim is not, and no key legends for a touch screen', () => {
  assert.match(dense, /\[data-part-header]>\[data-part-close]\{[^}]*display:none/);
  const fullscreen =
    /@containerslotted-dialog\(max-inline-size:30rem\)\{([\s\S]*?)\}\}/.exec(dense)?.[1] ?? '';
  assert.match(fullscreen, /\[data-part-close]\{display:inline-flex/);
  const touch = /@media\(hover:none\)and\(pointer:coarse\)\{([\s\S]*?)\}\}/.exec(dense)?.[1] ?? '';
  assert.match(touch, /\[data-part-footer]\{display:none/);
});

/**
 * A hint longer than the field fades at the field's end, not mid-glyph, and
 * only while the placeholder shows: Chromium draws no ellipsis on a
 * placeholder whose input it clips, so the fade is what every engine agrees on.
 */
test('fades a placeholder longer than the field at its end, and nothing the reader typed', () => {
  assert.match(
    dense,
    /\[data-part-input]:placeholder-shown\{mask-image:linear-gradient\(toright,#000calc\(100%-var\(--slotted-command-palette-placeholder-fade,2em\)\),transparent\)/,
  );
  assert.doesNotMatch(dense, /\[data-part-input]\{[^}]*mask-image/);
});
