import assert from 'node:assert/strict';
import test from 'node:test';

import { drawGlyphs } from './glyph.mjs';

test('draws an empty glyph element with the geometry the bindings render', () => {
  const html = drawGlyphs(
    '<span data-ui="icon" data-part="root" aria-hidden="true"><svg data-part="glyph" data-glyph="x"></svg></span>',
  );
  assert.match(
    html,
    /<svg data-part="glyph" data-glyph="x" aria-hidden="true" focusable="false" viewBox="0 0 24 24"/,
  );
  assert.match(html, /stroke="currentColor" stroke-width="2"/);
  assert.match(html, /<path d="M18 6 6 18"\/><path d="m6 6 12 12"\/>/);
});

test('fails on a glyph the manifest does not name', () => {
  assert.throws(() => drawGlyphs('<svg data-glyph="nope"></svg>'), /no glyph named "nope"/);
});

test('draws a glyph element the formatter wrapped across lines', () => {
  const html = drawGlyphs('<svg data-part="glyph" data-glyph="x"></svg\n  >');
  assert.match(html, /<path d="M18 6 6 18"\/>/);
});

test('draws the solid form, the symbol cut out of the filled shape', () => {
  const html = drawGlyphs('<svg data-part="glyph" data-glyph="circle-alert" data-solid></svg>');
  assert.match(html, /<mask id="sl-glyph-harness-\d+"/);
  assert.match(
    html,
    /fill="currentColor" stroke="currentColor"[^>]*mask="url\(#sl-glyph-harness-\d+\)"/,
  );
});
