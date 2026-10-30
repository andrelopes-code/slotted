import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { isRuntimeProperty, RUNTIME_PROPERTY_PREFIXES } from './runtime-properties.mjs';

const source = new URL('.', import.meta.url).pathname;

/**
 * Whitespace after `var(` is legal CSS and Prettier introduces it whenever a
 * declaration is long enough to wrap. A pattern anchored directly to the
 * token name therefore misses exactly the tokens in the longest declarations,
 * which is how two families came to document one custom property fewer than
 * they read.
 */
const TOKEN = /var\(\s*(--slotted-[a-z0-9-]+)/g;

/**
 * The theme-owned properties a stylesheet reads. A runtime property is read the
 * same way and belongs to `packages/core` rather than to any theme, so it is
 * subtracted here — see `runtime-properties.mjs` for why one exists at all.
 */
function referencedTokens(css) {
  return [...new Set([...css.matchAll(TOKEN)].map(([, token]) => token))]
    .filter((token) => !isRuntimeProperty(token))
    .sort();
}

function families() {
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const files = readdirSync(join(source, entry.name));
      return {
        name: entry.name,
        declared: files.find((file) => file.endsWith('.tokens.json')),
        stylesheets: files.filter((file) => file.endsWith('.css')),
      };
    })
    .filter((family) => family.stylesheets.length > 0);
}

test('gives every family exactly one declared token list', () => {
  for (const { declared, name } of families()) {
    assert.ok(declared !== undefined, `${name} ships a stylesheet and no tokens.json`);
  }
});

test('documents exactly the custom properties each family reads', () => {
  for (const { declared, name, stylesheets } of families()) {
    const css = stylesheets
      .map((file) => readFileSync(join(source, name, file), 'utf8'))
      .join('\n');
    const expected = referencedTokens(css);
    const actual = JSON.parse(readFileSync(join(source, name, declared), 'utf8'));
    assert.deepEqual(actual, expected, `${name} tokens.json disagrees with its stylesheets`);
  }
});

/**
 * A reference page prints `tokens.json` as the list of decisions a theme owns.
 * A runtime property in that list would send a consumer looking for a theme
 * value that no theme can hold, so the subtraction above has to be visible in
 * the result rather than only in the code that performs it.
 */
test('never files a runtime value as a theme-owned token', () => {
  for (const { declared, name } of families()) {
    const actual = JSON.parse(readFileSync(join(source, name, declared), 'utf8'));
    const runtime = actual.filter((token) => isRuntimeProperty(token));
    assert.deepEqual(
      runtime,
      [],
      `${name} lists ${runtime.join(', ')}, which script writes and no theme can retune`,
    );
  }
});

test('names every runtime prefix once, where a family can find the reason', () => {
  assert.deepEqual(RUNTIME_PROPERTY_PREFIXES, [
    '--slotted-positioner-',
    '--slotted-layer-depth',
    '--slotted-toast-count',
    '--slotted-toast-duration',
    '--slotted-toast-front-height',
    '--slotted-toast-height',
    '--slotted-toast-index',
    '--slotted-toast-play-state',
    '--slotted-toast-stack-height',
    '--slotted-toast-stack-offset',
    '--slotted-toast-swipe-x',
    '--slotted-toast-swipe-y',
    '--slotted-page-header-collapse',
    '--slotted-page-sticky-top',
    '--slotted-page-sticky-bottom',
    '--slotted-section-header-size',
    '--slotted-tree-depth',
    '--slotted-tree-row-offset',
    '--slotted-segmented-control-count',
    '--slotted-segmented-control-index',
    '--slotted-data-grid-template',
    '--slotted-data-grid-column',
    '--slotted-data-grid-pin-offset',
    '--slotted-data-grid-level',
    '--slotted-data-grid-drop-offset',
    '--slotted-data-grid-drop-scroll',
    '--slotted-data-grid-changed-duration',
    '--slotted-data-grid-pinned-top-offset',
    '--slotted-data-grid-pinned-bottom-offset',
    '--slotted-data-grid-window-start',
    '--slotted-data-grid-window-total',
    '--slotted-data-grid-viewport',
    '--slotted-data-grid-loader-row-size',
    '--slotted-data-grid-leading',
    '--slotted-upload-visible-rows',
    '--slotted-code-block-digits',
    '--slotted-code-block-indent',
    '--slotted-code-block-collapse',
    '--slotted-code-block-max-lines',
    '--slotted-chart-x',
    '--slotted-chart-y',
    '--slotted-chart-band-start',
    '--slotted-chart-band-size',
    '--slotted-chart-frame-start',
    '--slotted-chart-frame-size',
    '--slotted-event-lane',
    '--slotted-event-span',
    '--slotted-event-start',
    '--slotted-event-length',
    '--slotted-event-column',
    '--slotted-event-columns',
    '--slotted-event-calendar-days',
    '--slotted-event-calendar-lanes',
    '--slotted-event-calendar-slot',
    '--slotted-tour-target-',
    '--slotted-keyboard-inset',
    '--slotted-rating-fill',
    '--slotted-rating-share',
    '--slotted-rating-mean',
    '--slotted-rating-low',
    '--slotted-rating-high',
    '--slotted-message-max-lines',
    '--slotted-message-scroller-room',
    '--slotted-cascader-depth',
    '--slotted-carousel-slides-per-view',
    '--slotted-carousel-autoplay-delay',
    '--slotted-carousel-overscroll',
    '--slotted-color-picker-color',
    '--slotted-color-picker-opaque',
    '--slotted-color-picker-hue',
    '--slotted-color-picker-x',
    '--slotted-color-picker-y',
    '--slotted-color-picker-alpha',
    '--slotted-color-picker-previous',
    '--slotted-color-picker-preset',
    '--slotted-color-picker-contrast-with',
    '--slotted-navigation-menu-viewport-inline-size',
    '--slotted-navigation-menu-viewport-block-size',
    '--slotted-navigation-menu-viewport-inline-start',
    '--slotted-navigation-menu-viewport-block-start',
    '--slotted-navigation-menu-arrow-offset',
    '--slotted-navigation-menu-available-inline-size',
    '--slotted-media-viewer-frame-inline-size',
    '--slotted-media-viewer-frame-block-size',
    '--slotted-media-viewer-media-inline-size',
    '--slotted-media-viewer-media-block-size',
    '--slotted-media-viewer-rotation',
  ]);
  assert.equal(isRuntimeProperty('--slotted-positioner-arrow-x'), true);
  assert.equal(isRuntimeProperty('--slotted-space-4'), false);
  assert.equal(isRuntimeProperty('--slotted-toast-play-state'), true);
  /* The family owns theme tokens under the same prefix, and they are not this. */
  assert.equal(isRuntimeProperty('--slotted-toast-gap'), false);
  assert.equal(isRuntimeProperty('--slotted-tree-depth'), true);
  assert.equal(isRuntimeProperty('--slotted-tree-indent'), false);
  assert.equal(isRuntimeProperty('--slotted-code-block-digits'), true);
  assert.equal(isRuntimeProperty('--slotted-code-block-radius'), false);
});
