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
    new URL('../../../../specs/components/rating/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./rating.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./rating.harness.html', import.meta.url), 'utf8'),
);
const normalized = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const parts = [...new Set(Object.values(contract.members).flatMap((member) => member.parts))];

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

test('lives in the component layer and is keyed on its identifier', () => {
  assert.match(css, /@layer slotted\.components/);
  assert.ok(normalized.includes(`${ui}[data-part-root]{`));
});

test('styles and renders every part either member declares', () => {
  for (const part of parts) {
    if (part !== 'root') {
      assert.ok(
        normalized.includes(`[data-part-${part.toLowerCase()}]`),
        `no rule reaches ${part}`,
      );
    }
    assert.match(fragment, new RegExp(`data-part="${part}"`), `${part} appears in no scene`);
  }
});

/** Radios group by name within their form, and the harness copies each scene nine times. */
test('names every radio group and wraps every input scene in a form', () => {
  for (const group of fragment.match(/role="radiogroup"[\s\S]*?<\/div>\n {4}<\/div>/g) ?? []) {
    assert.match(group, /name="rt-/);
  }
  for (const scene of fragment.split('<section').slice(1)) {
    if (scene.includes('type="radio"')) assert.match(scene, /<form/);
  }
});

/**
 * The input member's picture is the platform's state: the lit share comes
 * from `:checked` and `:hover`, never from an attribute a script must keep in
 * step. The display member reads the runtime share the binding writes.
 */
test('derives the lit share from the radios, and reads it from the binding on display', () => {
  assert.match(rule(`${ui} [data-part-item]`), /--_fill:var\(--slotted-rating-fill,0\)/);
  assert.match(normalized, /:not\(\[data-half\]\):checked\)\{--_fill:1;/);
  assert.match(normalized, /\[data-part-input\]\[data-half\]:checked\)\{--_fill:0\.5;/);
  assert.match(normalized, /:hover:not\(:disabled\)\)\{--_fill:0\.5;/);
  assert.equal(contract.fillProperty, '--slotted-rating-fill');
});

test('lights from the inline-start edge in both directions', () => {
  assert.match(
    rule(`${ui} [data-part-fill]`),
    /clip-path:inset\(0 calc\(\(1 - var\(--_fill\)\) \* 100%\) 0 0\)/,
  );
  assert.match(
    rule(`${ui}[data-part-root]:dir(rtl) [data-part-fill]`),
    /clip-path:inset\(0 0 0 calc\(\(1 - var\(--_fill\)\) \* 100%\)\)/,
  );
});

/** Boxes touch, so a ring outside one would draw over the next star. */
test('rings the focused item inside its own box', () => {
  const ring = rule(`${ui} [data-part-item]:has(>[data-part-input]:focus-visible)`);
  assert.match(
    ring,
    /outline:var\(--slotted-focus-ring-width,2px\) solid var\(--slotted-focus-ring-color\)/,
  );
  assert.match(ring, /outline-offset:calc\(-1 \* var\(--slotted-focus-ring-width,2px\)\)/);
  assert.match(rule(`${ui} [data-part-input]`), /outline:none/);
});

test('never lets a target fall under the WCAG minimum, shrinking included', () => {
  const target = rule(`${ui} [data-part-item]:has(>[data-part-input])`);
  assert.match(target, /--_box:max\(var\(--slotted-target-min,24px\)/);
  assert.match(target, /min-inline-size:var\(--slotted-target-min,24px\)/);
});

/** A rating wrapped after its eighth star reads as eight of eight. */
test('keeps the symbols on one row that shrinks rather than wraps', () => {
  const row = rule(`${ui} [data-part-symbols]`);
  assert.match(row, /display:flex/);
  assert.doesNotMatch(row, /flex-wrap:wrap/);
  assert.match(row, /min-inline-size:0/);
  assert.match(rule(`${ui} [data-part-item]`), /container-type:inline-size/);
});

/** The curve follows the state a change moves to: lighting enters, dimming exits. */
test('lights on the enter curve and dims on the exit curve', () => {
  assert.match(rule(`${ui} [data-part-item]`), /--_fill-easing:var\(--slotted-easing-exit\)/);
  assert.match(normalized, /--_fill:1;--_fill-easing:var\(--slotted-easing-enter\)/);
  assert.match(normalized, /--_fill:0;--_fill-easing:var\(--slotted-easing-exit\)/);
});

/**
 * A star that grew toward the pointer read as a toy at the visual gate. The
 * hover is the lit share following the pointer and a round wash; only the
 * press moves the symbol, six per cent.
 */
test('grows nothing on hover and settles the symbol only a little on press', () => {
  const hovered = normalized
    .split('}')
    .filter((block) => block.includes(':hover') && !block.includes(':active'));
  for (const block of hovered) assert.doesNotMatch(block, /scale:/);
  assert.match(
    normalized,
    /:active:not\(:disabled\)\)>:is\(\[data-part-symbol\],\[data-part-fill\]\)\{scale:0\.94;\}/,
  );
});

/** At the same level the whole radio, later in the DOM, took every press meant for the half. */
test('stacks the half radio above the whole one', () => {
  assert.match(rule(`${ui} [data-part-input][data-half]`), /z-index:1/);
  assert.match(rule(`${ui} [data-part-input]`), /z-index:0/);
});

test('lines the distribution up in one grid of subgrid rows', () => {
  assert.match(
    rule(`${ui} [data-part-distribution]`),
    /grid-template-columns:auto minmax\(4rem,1fr\) auto/,
  );
  assert.match(rule(`${ui} [data-part-level]`), /grid-template-columns:subgrid/);
  assert.match(
    rule(`${ui} [data-part-indicator]`),
    /inline-size:calc\(var\(--slotted-rating-share,0\) \* 100%\)/,
  );
});

test('draws the edge of both shapes from the scheme token', () => {
  assert.match(normalized, /--_edge:var\(--slotted-rating-edge,transparent\)/);
});

/**
 * A flex row centers the line box, and the line box sits the letters high: the
 * figures beside the stars read above the stars' center until the box was
 * trimmed to the cap and the baseline. The summary's figure stays on its
 * baseline, above the stars rather than beside them.
 */
test('centers the text beside the stars on its ink', () => {
  const trimmed = normalized.split('@supports (text-box:trim-both cap alphabetic){')[1] ?? '';
  assert.match(
    trimmed,
    /\[data-ui-rating\]\[data-part-root\]>:is\(\[data-part-value\],\[data-part-count\]\)/,
  );
  assert.match(trimmed, /\[data-part-level-count\]/);
  assert.match(trimmed, /\[data-part-level-label\]>span:not\(\[data-ui\]\)/);
  assert.match(trimmed, /text-box:trim-both cap alphabetic/);
  assert.doesNotMatch(trimmed.split('}')[0], /aggregate/);
});

/** A value on the scale sits on the columns' axis: the first column's center plus one step per unit. */
test('places the mean and its interval on the axis the columns are drawn on', () => {
  const place =
    /calc\(var\(--_col\) \/ 2 \+ \(var\(--_mean\) - 1\) \* \(var\(--_col\) \+ var\(--_g\)\)/;
  assert.match(rule(`${ui} [data-part-mean]`), place);
  assert.match(rule(`${ui} [data-part-mean]`), /z-index:2/);
  assert.match(rule(`${ui} [data-part-interval]`), /z-index:0/);
  assert.match(rule(`${ui} [data-part-columns]`), /z-index:1/);
  assert.match(
    rule(`${ui}[data-part-root][data-variant='spectrum']`),
    /--_mean:var\(--slotted-rating-mean,3\)/,
  );
});

/** A level nobody chose draws nothing; a mark never stands in a pseudo-element. */
test('draws an empty level as nothing and marks each share with a real part', () => {
  assert.match(
    rule(`${ui} [data-part-column]>[data-part-bar]`),
    /min\(var\(--slotted-space-1,0\.125rem\),var\(--slotted-rating-share,0\) \* 100rem\)/,
  );
  assert.doesNotMatch(normalized, /\[data-part-bucket\]::before/);
  assert.match(rule(`${ui} [data-part-swatch]`), /background-color:var\(--_mark\)/);
});

test('keeps the lit and unlit shapes apart under forced colors', () => {
  const forced = normalized.split('@media (forced-colors:active){')[1] ?? '';
  assert.match(forced, /--_on:CanvasText/);
  assert.match(forced, /--_off:Canvas;/);
  assert.match(forced, /--_off-edge:CanvasText/);
});
