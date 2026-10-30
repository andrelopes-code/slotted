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

/**
 * The ring has no contract of its own: it is declared by the family that
 * carries it, as the shared identifier its `indicator` part wears and the
 * glyph that draws it, and a second host declares the same.
 */
const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/button/contract.json', import.meta.url),
    'utf8',
  ),
).spinner;
const css = readFileSync(new URL('./spinner.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./spinner.harness.html', import.meta.url), 'utf8'),
);
const buttonCss = readFileSync(new URL('../button/button.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, ' ').replace(/\s*([{};,:])\s*/g, '$1');
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}{`), 'the family has no base rule keyed on data-ui');
});

/**
 * The ring is vector and inline: the host's ink on the stroke of two circles
 * the host writes inside the box, a track at a fifth of its strength and an
 * arc with round caps. No gradient draws any part of it, because a conic
 * gradient's hard stop steps from frame to frame, and no image is fetched,
 * because a policy that allows images from the page's own origin alone
 * refused the `data:` masks it was drawn with.
 */
test('strokes the ring the host writes, with no image and no gradient', () => {
  assert.doesNotMatch(declarations, /gradient\(/, 'a gradient draws the ring');
  assert.doesNotMatch(declarations, /url\(|mask/, 'an image draws the ring');
  const svg = rule(`${ui} > svg`);
  assert.match(svg, /stroke:currentColor/);
  assert.match(svg, /fill:none/);
  assert.match(svg, /stroke-width:2\.25/);
  assert.match(rule(`${ui} > svg > circle:first-child`), /stroke-opacity:0\.2/);
  assert.match(rule(`${ui} > svg > circle:last-child`), /stroke-linecap:round/);
});

/**
 * The icon set's measure: a ring of twenty units in a box of twenty-four and
 * a stroke of two and a quarter, so the swap with a glyph keeps one size.
 */
test('is drawn to the measure of the glyph it stands in for', () => {
  for (const ring of fragment.match(/<svg[^>]*>.*?<\/svg>/g) ?? []) {
    assert.match(ring, /viewBox="0 0 24 24"/, 'the ring is not on the icon grid');
    assert.equal(ring.match(/<circle cx="12" cy="12" r="8\.875"/g)?.length, 2);
    assert.match(ring, /pathLength="100"/);
  }
});

/**
 * The box turns by `rotate`, which the compositor runs while the main thread
 * is busy; the dash opens and travels on its own cycle, out of step with the
 * turn. `tools/harness/scenarios/spinner-busy.mjs` counts the frames.
 */
test('turns the box on the compositor and chases its tail on the arc', () => {
  assert.match(
    rule(ui),
    /animation:slotted-spinner-turn calc\(var\(--slotted-duration-loop-slow\) \* 1\.25\) linear infinite/,
  );
  assert.match(normalized, /@keyframes slotted-spinner-turn\{to\{rotate:360deg;\}\}/);
  const arc = normalized.split('@keyframes slotted-spinner-arc{')[1] ?? '';
  assert.match(arc, /stroke-dasharray:1 150;stroke-dashoffset:0/);
  assert.match(arc, /stroke-dasharray:70 150;stroke-dashoffset:-28/);
  assert.match(arc, /stroke-dasharray:70 150;stroke-dashoffset:-99/);
});

test('arrives on a fade rather than a cut', () => {
  assert.match(css, /@starting-style\s*\{\s*\[data-ui-spinner\]\s*\{\s*opacity: 0;\s*scale: 0\.6/);
  assert.match(rule(ui), /transition:opacity var\(--slotted-control-transition-duration\)/);
});

/**
 * The box is the host's glyph box, read through the family token, so the ring
 * that stands in for a glyph is the size of the glyph it replaces; left alone
 * it is the medium control icon.
 */
test('is the size its host says, and the medium glyph box otherwise', () => {
  const base = rule(ui);
  assert.ok(
    base.includes('--_size:var(--slotted-spinner-size,var(--slotted-control-icon-size-md,16px))'),
  );
  assert.ok(base.includes('block-size:var(--_size)'));
  assert.ok(base.includes('inline-size:var(--_size)'));
  assert.ok(base.includes('flex:none'));
});

test('stands still under reduced motion, as a track with an arc resting on it', () => {
  const reduced = normalized.split('@media (prefers-reduced-motion:reduce){')[1] ?? '';
  assert.match(reduced, /animation:none/);
  assert.match(reduced, /stroke-dasharray:75 150/);
});

/** Forced colours keep the ink, which they have already set, instead of erasing the background. */
test('keeps its ink under forced colours', () => {
  assert.match(rule(ui), /forced-color-adjust:none/);
});

/**
 * One ring, drawn once. The host that drew it first hands the drawing over
 * and keeps only the size and the place.
 */
test('is the only sheet that draws the ring', () => {
  assert.doesNotMatch(buttonCss, /slotted-button-spin|border-inline-end-color:\s*transparent/);
  assert.match(buttonCss, /--slotted-spinner-size:\s*var\(--_icon-size\)/);
  assert.equal(contract.stylesheet, 'spinner/spinner.css');
});

test('exercises the identifier and the size token in the harness fragment', () => {
  assert.match(fragment, /data-ui="spinner"/);
  assert.match(fragment, /--slotted-spinner-size/);
});
