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

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/sparkline/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./sparkline.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./sparkline.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const { parts } = contract.members.sparkline;

/** Every innermost rule, with the at-rule it sits in. */
function collectRules(sheet) {
  const collected = [];
  const stack = [];
  let selector = '';
  for (let index = 0; index < sheet.length; index += 1) {
    const character = sheet[index];
    if (character === '}') {
      stack.pop();
      selector = '';
      continue;
    }
    if (character !== '{') {
      selector += character;
      continue;
    }
    const close = sheet.indexOf('}', index);
    const nested = sheet.indexOf('{', index + 1);
    if (nested === -1 || nested > close) {
      collected.push({
        selector: selector.trim(),
        body: sheet.slice(index + 1, close),
        media: stack.find((frame) => frame.startsWith('@media')) ?? '',
      });
      index = close;
      selector = '';
    } else {
      stack.push(selector.trim());
      selector = '';
    }
  }
  return collected;
}

const rules = collectRules(normalized);
const rule = (selector, media = '') =>
  rules.find((entry) => entry.selector === selector && entry.media === media);
const body = (selector, media) => rule(selector, media)?.body ?? '';

test('lives in the component layer', () => {
  assert.match(css, /^@layer slotted\.components \{/m);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(rule(ui), 'the root rule keys on data-ui');
});

test('styles every part the contract declares, and the harness renders each', () => {
  for (const part of parts) {
    if (part === 'root') continue;
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `${part} is a part the sheet never paints`,
    );
    assert.ok(fragment.includes(`data-part="${part}"`), `${part} never appears in the harness`);
  }
});

/**
 * The root takes the width of what holds it and the height of its size step:
 * a sparkline never states its own width, because the room beside a value is
 * the container's to give.
 */
test('fills the inline size of its container and takes its height from its size', () => {
  const root = body(ui);
  assert.ok(root.includes('inline-size:100%'));
  assert.ok(root.includes('block-size:var(--_size)'));
  assert.ok(root.includes('display:inline-block'));
  for (const size of ['sm', 'lg']) {
    assert.ok(body(`${ui}[data-size='${size}']`).includes('--_size:'), `${size} states a height`);
  }
});

/**
 * Colour resolves in one order: a tone wins, a series slot is next, and a
 * sparkline naming neither reads `--slotted-sparkline-color` from its
 * container or the first data slot. The rules are written in that order so
 * the cascade agrees with the contract.
 */
test('resolves colour as tone, then series, then the container, then the first slot', () => {
  assert.ok(body(ui).includes('--_color:var(--slotted-sparkline-color,var(--slotted-data-1))'));
  const seriesAt = normalized.indexOf("[data-series='1']");
  const toneAt = normalized.indexOf("[data-tone='neutral']");
  assert.ok(seriesAt > 0 && toneAt > seriesAt, 'tone rules come after series rules');
  for (const slot of contract.axes.series) {
    assert.equal(body(`${ui}[data-series='${slot}']`), `--_color:var(--slotted-data-${slot});`);
  }
  for (const tone of contract.axes.tone) {
    const expected =
      tone === 'neutral'
        ? '--_color:var(--slotted-text-muted,GrayText);'
        : `--_color:var(--slotted-tone-${tone}-text);`;
    assert.equal(body(`${ui}[data-tone='${tone}']`), expected, `${tone}`);
  }
});

/**
 * Every mark that has a stroke keeps it in screen pixels: the grid is
 * stretched to the box for the one frame before the box is measured, and a
 * stroke scaled with it would be a line two pixels tall and one wide.
 */
test('draws every stroke in screen pixels rather than in grid units', () => {
  for (const part of ['line', 'reference']) {
    assert.ok(
      body(`${ui} [data-part-${part.toLowerCase()}]`).includes('vector-effect:non-scaling-stroke'),
      `${part}`,
    );
  }
  assert.ok(
    body(`${ui} [data-part-ring],${ui} [data-part-marker]`).includes(
      'vector-effect:non-scaling-stroke',
    ),
  );
});

/**
 * The marker is a round-capped stroke of zero length, and so is the ring
 * under it: a disc whose diameter is its stroke width, which is the one disc
 * that stays round on a stretched grid.
 */
test('draws the marker and its ring as round-capped strokes, the ring in the ground', () => {
  const shared = body(`${ui} [data-part-ring],${ui} [data-part-marker]`);
  assert.ok(shared.includes('stroke-linecap:round'));
  assert.ok(shared.includes('fill:none'));
  assert.ok(body(`${ui} [data-part-marker]`).includes('stroke-width:var(--_marker)'));
  const ring = body(`${ui} [data-part-ring]`);
  assert.ok(ring.includes('stroke:var(--_ring-color)'));
  assert.ok(ring.includes('stroke-width:calc(var(--_marker) + 2 * var(--_ring))'));
  assert.ok(
    body(ui).includes(
      '--_ring-color:var(--slotted-sparkline-ring-color,var(--slotted-surface-raised,Canvas))',
    ),
  );
});

test('washes the area with the colour faded to nothing, without minting a gradient id', () => {
  const area = body(`${ui} [data-part-area]`);
  assert.ok(area.includes('fill:var(--_color)'));
  assert.ok(area.includes('mask-image:linear-gradient(to bottom,black,transparent)'));
  assert.doesNotMatch(declarations, /url\(#/, 'no in-document reference');
});

/**
 * The earlier bars are the colour mixed with the line between two surfaces,
 * not the colour faded: a fade is a tint no scheme promises a ratio for, and
 * `--slotted-border-strong` lends its 3:1 to the mix in every scheme.
 */
test('dims every bar but the current one by mixing, not by fading', () => {
  assert.ok(body(`${ui} [data-part-bar]`).includes('fill:var(--_bar-dim)'));
  assert.doesNotMatch(body(`${ui} [data-part-bar]`), /opacity/);
  assert.ok(body(ui).includes('--slotted-border-strong'));
  assert.equal(body(`${ui} [data-part-bar][data-current]`), 'fill:var(--_color);');
});

test('dashes the reference so it is read as not data before its colour is', () => {
  const reference = body(`${ui} [data-part-reference]`);
  assert.ok(reference.includes('stroke-dasharray:'));
  assert.ok(reference.includes('stroke:var(--_reference-color)'));
});

/** The series reads from the right in a right-to-left document, as the text does. */
test('mirrors the drawing in a right-to-left document', () => {
  assert.equal(body(`${ui}:dir(rtl) [data-part-plot]`), 'transform:scaleX(-1);');
});

/**
 * Only a change of data moves a path, and only when motion is allowed: the
 * binding writes `data-animate` for that render. A resize redraws at once.
 */
test('moves a path from the motion scale when its data changes, and not when its box does', () => {
  const media = '@media (prefers-reduced-motion:no-preference)';
  assert.match(
    body(
      `${ui}[data-animate]:is([data-part-area],[data-part-line],[data-part-ring],[data-part-marker])`,
      media,
    ),
    /transition:d var\(--slotted-duration-medium\) var\(--slotted-easing-standard\)/,
  );
  assert.match(
    body(`${ui}[data-animate] [data-part-bar]`, media),
    /transition:d var\(--slotted-duration-medium\)/,
  );
  for (const part of ['line', 'area', 'bar', 'ring', 'marker']) {
    assert.doesNotMatch(body(`${ui} [data-part-${part}]`), /transition:[^;]*\bd\b/, part);
  }
});

/** An unsized sparkline in a box sized by its content keeps the grid's nominal width. */
test('holds a nominal width where its container gives it none', () => {
  assert.match(body(ui), /min-inline-size:var\(--slotted-sparkline-min-inline-size,6rem\)/);
});

/**
 * Under forced colours the theme maps the data scale to `CanvasText`; what
 * the sheet has to do itself is take the mix out of the bars and drop the
 * wash, which is a tint the mode has no colour for.
 */
test('answers forced colours for the bars, the wash and the ring', () => {
  const media = '@media (forced-colors:active)';
  assert.equal(body(`${ui} [data-part-area]`, media), 'display:none;');
  assert.equal(body(`${ui} [data-part-bar]`, media), 'fill:GrayText;');
  assert.equal(body(`${ui} [data-part-bar][data-current]`, media), 'fill:CanvasText;');
  assert.equal(body(`${ui} [data-part-ring]`, media), 'stroke:Canvas;');
});

test('exercises every axis value and the states the drawing can be in', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      assert.ok(fragment.includes(`data-${axis}="${value}"`), `${axis}=${value} is never drawn`);
    }
  }
  assert.ok(fragment.includes('data-current=""'), 'a current bar');
  assert.ok(fragment.includes('data-part="reference"'), 'a reference');
  assert.ok(fragment.includes('no data'), 'an empty series with its description');
});
